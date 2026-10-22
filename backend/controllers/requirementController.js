const mongoose = require("mongoose");
const Requirement = require("../models/requirementModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const Donation = require("../models/donationModel");
const BeneficiaryCase = require("../models/BeneficiaryCase");
const { createNotification } = require("../utils/resourceMatcher");
const { findMatchingDonationsForRequirement, calculateMatch } = require("../services/matchingService");


/* ─── Create Requirement ─── */
exports.createRequirement = async (req, res) => {
  try {
    const {
      category,
      title,
      description,
      quantity,
      unit,
      beneficiaryType,
      beneficiaryCount,
      requiredBefore,
      imageUrl,
      urgency,
      location,
      latitude,
      longitude,
    } = req.body;

    // Require an existing, verified organization profile — do NOT auto-create or auto-approve
    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org) {
      return res.status(403).json({
        message: "Organization profile not found. Please complete your registration and wait for admin approval.",
      });
    }
    if (org.verificationStatus !== "verified") {
      return res.status(403).json({
        message: "Your organization must be verified by an administrator before posting requirements.",
      });
    }

    const requirement = await Requirement.create({
      organizationId: org._id,
      postedBy: req.user._id,
      category: category || "food",
      title,
      description,
      quantity: Number(quantity),
      unit: unit || "Packets",
      beneficiaryType: beneficiaryType || "General Community",
      beneficiaryCount: Number(beneficiaryCount || 0),
      requiredBefore: requiredBefore ? new Date(requiredBefore) : null,
      imageUrl: imageUrl || "",
      urgency: urgency || "medium",
      location: location || org.address || "",
      latitude: latitude ? Number(latitude) : org.latitude || null,
      longitude: longitude ? Number(longitude) : org.longitude || null,
    });

    res.status(201).json({ message: "Requirement posted successfully.", requirement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get All Open Requirements (public / donor view) ─── */
exports.getRequirements = async (req, res) => {
  try {
    const now = new Date();

    // Auto-transition requirements past deadline to 'expired'
    await Requirement.updateMany(
      {
        status: { $in: ["open", "pending"] },
        $or: [
          { requiredBefore: { $ne: null, $lt: now } },
          { expiresAt: { $ne: null, $lt: now } },
        ],
      },
      { status: "expired" }
    );

    const { category, urgency, status } = req.query;
    const filter = {};

    if (category && category !== "all") filter.category = category;
    if (urgency && urgency !== "all")   filter.urgency = urgency;
    
    // Only return active, non-expired open requirements for public browsing
    filter.status = status || "open";
    filter.$and = [
      { $or: [{ requiredBefore: null }, { requiredBefore: { $gte: now } }] },
      { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
    ];

    const requirements = await Requirement.find(filter)
      .populate("organizationId", "orgName orgType address")
      .populate("postedBy", "fullName")
      .populate({
        path: "beneficiaryCaseId",
        select: "caseNumber area priority requestSource householdSize vulnerableMembers neededItems assessmentRationale assessmentDate supportingEvidence verificationDetails status",
        populate: { path: "verificationDetails.reviewedBy", select: "fullName" },
      })
      .sort({ createdAt: -1 });

    // Calculate live fulfilled quantities and donor counts from active donations
    const reqIds = requirements.map((r) => r._id);
    const reqObjIds = reqIds.map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id));
    const reqStrIds = reqIds.map((id) => id.toString());

    const donationAgg = await Donation.aggregate([
      {
        $match: {
          matchedRequirement: { $in: [...reqObjIds, ...reqStrIds] },
          status: { $nin: ["cancelled", "rejected"] },
        },
      },
      {
        $group: {
          _id: "$matchedRequirement",
          totalQty: { $sum: "$quantity" },
          donors: { $addToSet: "$donorId" },
        },
      },
    ]);

    // Auto-sync Beneficiary Case and exact uploaded evidence image
    for (const r of requirements) {
      const matchAgg = donationAgg.find((a) => a._id?.toString() === r._id.toString());
      const livePledged = matchAgg ? Number(matchAgg.totalQty) || 0 : 0;
      const initialFulfilled = Number(r.fulfilledQuantity) || 0;
      const actualFulfilled = Math.max(initialFulfilled, livePledged);

      r.fulfilledQuantity = actualFulfilled;
      r.receivedQuantity = actualFulfilled;
      r.donorCount = matchAgg ? matchAgg.donors.length : 0;

      const updates = {};
      let needsUpdate = false;

      if (actualFulfilled !== initialFulfilled) {
        updates.fulfilledQuantity = actualFulfilled;
        updates.receivedQuantity = actualFulfilled;
        needsUpdate = true;
      }

      if (actualFulfilled >= Number(r.quantity) && r.status === "open") {
        updates.status = "fulfilled";
        r.status = "fulfilled";
        needsUpdate = true;
      }

      let caseDoc = null;

      if (r.beneficiaryCaseId && r.beneficiaryCaseId.caseNumber) {
        caseDoc = r.beneficiaryCaseId;
      } else {
        if (r.beneficiaryCaseId) {
          caseDoc = await BeneficiaryCase.findById(r.beneficiaryCaseId)
            .populate("verificationDetails.reviewedBy", "fullName");
        }
        if (!caseDoc && r.description) {
          const match = r.description.match(/BEN-[\w-]+/);
          if (match) {
            caseDoc = await BeneficiaryCase.findOne({ caseNumber: match[0] })
              .populate("verificationDetails.reviewedBy", "fullName");
          }
        }
        if (!caseDoc) {
          caseDoc = await BeneficiaryCase.findOne({ linkedRequirements: r._id })
            .populate("verificationDetails.reviewedBy", "fullName");
        }
      }

      if (caseDoc) {
        if (!r.beneficiaryCaseId || r.beneficiaryCaseId._id?.toString() !== caseDoc._id.toString()) {
          updates.beneficiaryCaseId = caseDoc._id;
          updates.beneficiaryType = "Verified Beneficiary Household";
          updates.beneficiaryCount = caseDoc.householdSize || r.beneficiaryCount || 1;
          needsUpdate = true;
        }

        // Extract the exact evidence image uploaded during beneficiary creation
        if (caseDoc.supportingEvidence && caseDoc.supportingEvidence.length > 0) {
          const latestImg =
            caseDoc.supportingEvidence.slice().reverse().find((e) =>
              e.fileUrl && /\.(jpe?g|png|webp|gif|svg)$/i.test(e.fileUrl)
            ) || caseDoc.supportingEvidence[caseDoc.supportingEvidence.length - 1];

          if (latestImg && latestImg.fileUrl && r.imageUrl !== latestImg.fileUrl) {
            updates.imageUrl = latestImg.fileUrl;
            r.imageUrl = latestImg.fileUrl;
            needsUpdate = true;
          }
        }

        // Auto-link any donations matching this requirement to the caseDoc
        const matchedDonationDocs = await Donation.find({
          matchedRequirement: r._id,
          status: { $nin: ["cancelled", "rejected"] },
        }).select("_id");

        if (matchedDonationDocs.length > 0) {
          const donationIds = matchedDonationDocs.map((d) => d._id);
          await BeneficiaryCase.updateOne(
            { _id: caseDoc._id },
            { $addToSet: { linkedDonations: { $each: donationIds }, linkedRequirements: r._id } }
          );
        }

        // Attach populated caseDoc directly so the client receives full details
        r.beneficiaryCaseId = caseDoc;
      }

      if (needsUpdate) {
        await Requirement.updateOne({ _id: r._id }, { $set: updates });
      }
    }

    res.json({ requirements, total: requirements.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get My Requirements (organization) ─── */
exports.getMyRequirements = async (req, res) => {
  try {
    const now = new Date();

    // Auto-transition past requirements to 'expired'
    await Requirement.updateMany(
      {
        status: { $in: ["open", "pending"] },
        $or: [
          { requiredBefore: { $ne: null, $lt: now } },
          { expiresAt: { $ne: null, $lt: now } },
        ],
      },
      { status: "expired" }
    );

    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org) return res.status(403).json({ message: "Organization not found." });

    const requirements = await Requirement.find({ organizationId: org._id })
      .sort({ createdAt: -1 });

    const stats = {
      total: requirements.length,
      pending: requirements.filter((r) => r.status === "pending").length,
      open: requirements.filter((r) => r.status === "open").length,
      matched: requirements.filter((r) => r.status === "matched").length,
      fulfilled: requirements.filter((r) => r.status === "fulfilled").length,
      rejected: requirements.filter((r) => r.status === "rejected").length,
      expired: requirements.filter((r) => r.status === "expired").length,
    };

    res.json({ requirements, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get Single Requirement ─── */
exports.getRequirementById = async (req, res) => {
  try {
    const now = new Date();
    let requirement = await Requirement.findById(req.params.id)
      .populate("organizationId", "orgName orgType address latitude longitude")
      .populate("postedBy", "fullName email")
      .populate("beneficiaryCaseId");

    if (!requirement) return res.status(404).json({ message: "Requirement not found." });

    // Calculate live pledged quantity from active donations
    const activeDonations = await Donation.find({
      matchedRequirement: requirement._id,
      status: { $nin: ["cancelled", "rejected"] },
    });
    const livePledged = activeDonations.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
    const actualFulfilled = Math.max(Number(requirement.fulfilledQuantity) || 0, livePledged);

    requirement.fulfilledQuantity = actualFulfilled;
    requirement.receivedQuantity = actualFulfilled;

    if (actualFulfilled !== (Number(requirement.fulfilledQuantity) || 0)) {
      await Requirement.updateOne(
        { _id: requirement._id },
        { $set: { fulfilledQuantity: actualFulfilled, receivedQuantity: actualFulfilled } }
      );
    }

    // If deadline has passed and status is still open/pending, update to expired
    const deadline = requirement.requiredBefore || requirement.expiresAt;
    if (["open", "pending"].includes(requirement.status) && deadline && new Date(deadline) < now) {
      requirement.status = "expired";
      await requirement.save();
    }

    res.json({ requirement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Update Requirement (organization owner) ─── */
exports.updateRequirement = async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) return res.status(404).json({ message: "Requirement not found." });

    // Only owner org can update
    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org || requirement.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (requirement.status !== "open" && requirement.status !== "pending") {
      return res.status(400).json({ message: "Only open or pending requirements can be edited." });
    }

    const fields = ["category", "title", "description", "quantity", "urgency", "location", "latitude", "longitude"];
    fields.forEach((f) => { if (req.body[f] !== undefined) requirement[f] = req.body[f]; });
    await requirement.save();

    res.json({ message: "Requirement updated.", requirement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Delete Requirement (organization owner) ─── */
exports.deleteRequirement = async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) return res.status(404).json({ message: "Requirement not found." });

    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org || requirement.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (!["open", "pending", "rejected", "expired"].includes(requirement.status)) {
      return res.status(400).json({ message: "Cannot delete requirements that are in progress or fulfilled." });
    }

    await requirement.deleteOne();
    res.json({ message: "Requirement deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Admin: Update Status (Approve / Reject) ─── */
exports.updateRequirementStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const requirement = await Requirement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("postedBy", "fullName email");

    if (!requirement) return res.status(404).json({ message: "Requirement not found." });

    // Send system notification to the organization user
    if (requirement.postedBy) {
      if (status === "open") {
        await createNotification(
          requirement.postedBy._id || requirement.postedBy,
          "Requirement Approved",
          `Your requirement "${requirement.title}" has been approved by the Admin and is now live for donors.`,
          "system"
        );
      } else if (status === "rejected") {
        await createNotification(
          requirement.postedBy._id || requirement.postedBy,
          "Requirement Rejected",
          `Your requirement "${requirement.title}" was rejected by the Admin.`,
          "system"
        );
      }
    }

    res.json({ message: `Requirement status updated to ${status}.`, requirement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Admin: Get All Requirements ─── */
exports.getAllRequirements = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (category && category !== "all") filter.category = category;

    const requirements = await Requirement.find(filter)
      .populate("organizationId", "orgName orgType address")
      .populate("postedBy", "fullName email")
      .sort({ createdAt: -1 });

    const stats = {
      total: await Requirement.countDocuments(),
      pending: await Requirement.countDocuments({ status: "pending" }),
      open: await Requirement.countDocuments({ status: "open" }),
      matched: await Requirement.countDocuments({ status: "matched" }),
      fulfilled: await Requirement.countDocuments({ status: "fulfilled" }),
      rejected: await Requirement.countDocuments({ status: "rejected" }),
    };

    res.json({ requirements, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get Recommendations for a Requirement (Workflow B: Organization) ─── */
exports.getRequirementRecommendations = async (req, res) => {
  try {
    const requirement = await Requirement.findById(req.params.id).populate("organizationId postedBy");
    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found." });
    }

    // Authorization: organization owner or admin
    if (req.user.role !== "admin") {
      const org = await RecipientOrganization.findOne({ userId: req.user._id });
      if (!org || requirement.organizationId._id.toString() !== org._id.toString()) {
        return res.status(403).json({ message: "Not authorized to view matches for this requirement." });
      }
      if (org.verificationStatus !== "verified") {
        return res.status(403).json({
          message: "Your organization must be verified by admin to access smart matching recommendations.",
        });
      }
    }

    const result = await findMatchingDonationsForRequirement(requirement._id, { limit: 10 });
    res.json({
      requirement: {
        _id: requirement._id,
        title: requirement.title,
        category: requirement.category,
        quantity: requirement.quantity,
        fulfilledQuantity: requirement.fulfilledQuantity || 0,
        remainingQuantity: Math.max(0, (requirement.quantity || 0) - (requirement.fulfilledQuantity || 0)),
        unit: requirement.unit,
        urgency: requirement.urgency,
        status: requirement.status,
      },
      recommendations: result.recommendations,
      totalEligible: result.totalEligible,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Organization: Accept Recommended Donation (Workflow B) ─── */
exports.matchDonationForRequirement = async (req, res) => {
  try {
    const { id: requirementId, donationId } = req.params;

    // 1. Verify organization credentials and verification status
    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org && req.user.role !== "admin") {
      return res.status(403).json({ message: "Organization profile not found." });
    }
    if (org && org.verificationStatus !== "verified") {
      return res.status(403).json({ message: "Organization is not verified by admin." });
    }

    // 2. Reload requirement with organization details
    const requirement = await Requirement.findById(requirementId).populate("organizationId");
    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found." });
    }

    const orgIdStr = org ? org._id.toString() : "";
    const reqOrgIdStr = requirement.organizationId?._id?.toString() || requirement.organizationId?.toString();

    // Ownership check
    if (req.user.role !== "admin" && reqOrgIdStr !== orgIdStr) {
      return res.status(403).json({ message: "Not authorized for this requirement." });
    }

    // 3. Reload donation
    const donation = await Donation.findById(donationId).populate("postedBy");
    if (!donation) {
      return res.status(404).json({ message: "Donation not found." });
    }

    // Idempotent guard: if this donation was already matched and accepted for this requirement
    if (
      donation.matchedRequirement?.toString() === requirement._id.toString() &&
      donation.status === "accepted"
    ) {
      return res.json({
        message: "Donation is already accepted and matched to this requirement.",
        donation,
        requirement,
        alreadyMatched: true,
      });
    }

    // Revalidate requirement status
    if (!["open", "matched"].includes(requirement.status)) {
      return res.status(400).json({
        message: `Requirement is no longer active (status: ${requirement.status}).`,
      });
    }

    const remainingReq = Math.max(0, requirement.quantity - (requirement.fulfilledQuantity || 0));
    if (remainingReq <= 0) {
      return res.status(409).json({ message: "Requirement has already been completely fulfilled." });
    }

    if (!["pending", "matched"].includes(donation.status)) {
      return res.status(409).json({
        message: `Donation is no longer available (current status: "${donation.status}").`,
      });
    }

    // Calculate match score & explainable details
    const matchCalc = calculateMatch(donation, requirement);
    const allocatedQty = Math.min(donation.quantity, remainingReq);
    const newFulfilledQty = (requirement.fulfilledQuantity || 0) + allocatedQty;
    const isRequirementFullyFulfilled = newFulfilledQty >= requirement.quantity;

    // 4. Atomic updates
    await Requirement.findByIdAndUpdate(requirement._id, {
      $inc: { fulfilledQuantity: allocatedQty },
      status: isRequirementFullyFulfilled ? "fulfilled" : "matched",
      matchedDonation: donation._id,
    });

    donation.status = "accepted";
    donation.matchedRequirement = requirement._id;
    donation.matchedOrganization = org ? org._id : requirement.organizationId;
    donation.matchScore = matchCalc.overallScore;
    donation.matchBreakdown = {
      factorScores: matchCalc.factorScores,
      reasons: matchCalc.reasons,
    };
    donation.acceptedAt = new Date();
    await donation.save();

    // 5. Notify donor
    if (donation.postedBy?._id) {
      const orgName = org?.orgName || "Recipient Organization";
      await createNotification(
        donation.postedBy._id,
        "✅ Donation Accepted by Organization!",
        `${orgName} accepted your donation of ${donation.quantity} ${donation.unit || "units"} for requirement "${requirement.title}" (Compatibility Score: ${matchCalc.overallScore}%).`,
        "match",
        donation._id,
        "Donation"
      );
    }

    res.json({
      message: "Donation successfully accepted and matched!",
      donation,
      requirement: {
        _id: requirement._id,
        title: requirement.title,
        quantity: requirement.quantity,
        fulfilledQuantity: newFulfilledQty,
        remainingQuantity: Math.max(0, requirement.quantity - newFulfilledQty),
        status: isRequirementFullyFulfilled ? "fulfilled" : "matched",
      },
      allocatedQuantity: allocatedQty,
      matchScore: matchCalc.overallScore,
      matchReasons: matchCalc.reasons,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

