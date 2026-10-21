const Donation = require("../models/donationModel");
const Donor = require("../models/donorModel");
const Requirement = require("../models/requirementModel");
const Delivery = require("../models/deliveryModel");
const User = require("../models/userModel");
const { matchDonationToRequirements, createNotification } = require("../utils/resourceMatcher");
const { findMatchingRequirementsForDonation, calculateMatch } = require("../services/matchingService");
const { interpretDonationDescription } = require("../services/aiDescriptionService");
const upload = require("../middleware/upload");
const { generateDonationReceiptPDF } = require("../utils/pdfGenerator");


/* ─── Create Donation (Donor) ─── */
exports.createDonation = async (req, res) => {
  try {
    const { category, donationName, quantity, description, pickupAddress, latitude, longitude, unit } = req.body;

    // Find donor profile
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) return res.status(403).json({ message: "Donor profile not found." });

    const imagePath = req.file ? req.file.path : (req.body.imageUrl || "");

    // 1. Save donation in pending status (Workflow A: never auto-lock without user choice)
    const donation = await Donation.create({
      donorId: donor._id,
      postedBy: req.user._id,
      category,
      donationName,
      quantity: Number(quantity),
      unit: unit || "Packets",
      description,
      pickupAddress,
      latitude: latitude ? Number(latitude) : (donor.latitude || null),
      longitude: longitude ? Number(longitude) : (donor.longitude || null),
      image: imagePath,
      status: "pending",
    });

    // 2. Run smart explainable matching to find top eligible requirements
    const matchData = await findMatchingRequirementsForDonation(donation, { limit: 5 });
    const topMatches = matchData.recommendations || [];
    const bestMatch = topMatches[0] || null;

    res.status(201).json({
      message: topMatches.length > 0
        ? "Donation submitted successfully! Smart recommendations found."
        : "Donation submitted successfully. Awaiting requirement matches.",
      donation,
      recommendations: topMatches,
      matchResult: {
        matched: topMatches.length > 0,
        bestMatch,
        topMatches,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get My Donations (Donor) ─── */
exports.getMyDonations = async (req, res) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) return res.status(403).json({ message: "Donor not found." });

    const donations = await Donation.find({ donorId: donor._id })
      .populate("matchedRequirement", "title category urgency location")
      .populate("matchedOrganization", "_id userId orgName orgType address")
      .sort({ createdAt: -1 });

    const stats = {
      total: donations.length,
      pending: donations.filter((d) => d.status === "pending").length,
      active: donations.filter((d) => ["matched", "accepted", "assigned", "picked_up"].includes(d.status)).length,
      delivered: donations.filter((d) => d.status === "delivered").length,
      cancelled: donations.filter((d) => d.status === "cancelled").length,
    };

    res.json({ donations, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get Single Donation ─── */
exports.getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("donorId")
      .populate("postedBy", "fullName email")
      .populate("matchedRequirement", "title category urgency location description")
      .populate("matchedOrganization", "orgName orgType address latitude longitude");

    if (!donation) return res.status(404).json({ message: "Donation not found." });

    // Also get delivery info if exists
    const delivery = await Delivery.findOne({ donationId: donation._id })
      .populate("volunteerId", "userId address")
      .populate("assignedBy", "fullName");

    res.json({ donation, delivery: delivery || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Download PDF Donation & Tax Exemption Receipt ─── */
exports.downloadReceipt = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate({ path: "donorId", populate: { path: "userId", select: "fullName email" } })
      .populate("postedBy", "fullName email")
      .populate("matchedRequirement", "title category urgency location description")
      .populate("matchedOrganization", "orgName orgType address");

    if (!donation) return res.status(404).json({ message: "Donation not found." });

    // Only the donor who posted it or an admin may download the receipt
    const isAdmin = req.user.role === "admin";
    const isOwner = donation.postedBy && donation.postedBy._id.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not authorized to download this receipt." });
    }

    generateDonationReceiptPDF(donation, res);
  } catch (err) {
    console.error("Receipt generation error:", err.message);
    res.status(500).json({ message: "Failed to generate receipt PDF." });
  }
};

/* ─── Delete Donation (Donor — only if pending) ─── */
exports.deleteDonation = async (req, res) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    const donation = await Donation.findById(req.params.id);

    if (!donation) return res.status(404).json({ message: "Donation not found." });
    if (donation.donorId.toString() !== donor._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (donation.status !== "pending") {
      return res.status(400).json({ message: "Only pending donations can be deleted." });
    }

    await donation.deleteOne();
    res.json({ message: "Donation deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Cancel Donation ─── */
exports.cancelDonation = async (req, res) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    const donation = await Donation.findById(req.params.id);

    if (!donation) return res.status(404).json({ message: "Donation not found." });
    if (donation.donorId.toString() !== donor._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (["delivered", "cancelled"].includes(donation.status)) {
      return res.status(400).json({ message: "Cannot cancel this donation." });
    }

    // If matched, reopen the requirement and release fulfilled quantity
    if (donation.matchedRequirement) {
      const targetReq = await Requirement.findById(donation.matchedRequirement);
      if (targetReq) {
        const remainingFulfilled = Math.max(0, (targetReq.fulfilledQuantity || 0) - (donation.quantity || 0));
        await Requirement.findByIdAndUpdate(donation.matchedRequirement, {
          status: "open",
          fulfilledQuantity: remainingFulfilled,
          matchedDonation: null,
        });
      }
    }

    donation.status = "cancelled";
    await donation.save();
    res.json({ message: "Donation cancelled.", donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Create Direct Donation to Requirement (Donor) ─── */
exports.createDirectDonation = async (req, res) => {
  try {
    const {
      requirementId,
      quantity,
      unit,
      pickupAddress,
      contactNumber,
      notes,
      imageUrl,
    } = req.body;

    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(403).json({ message: "Donor profile not found. Please complete registration." });
    }

    const requirement = await Requirement.findById(requirementId).populate("organizationId");
    if (!requirement) return res.status(404).json({ message: "Requirement not found." });
    if (requirement.status !== "open") {
      return res.status(400).json({ message: "This requirement is not open for donations." });
    }

    const now = new Date();
    const deadline = requirement.requiredBefore || requirement.expiresAt;
    if (requirement.status === "expired" || (deadline && new Date(deadline) < now)) {
      if (requirement.status !== "expired") {
        requirement.status = "expired";
        await requirement.save();
      }
      return res.status(400).json({ message: "This requirement has expired and can no longer accept donations." });
    }

    const orgId = requirement.organizationId?._id || requirement.organizationId;

    const donation = await Donation.create({
      donorId: donor._id,
      postedBy: req.user._id,
      category: requirement.category || "food",
      donationName: `Pledge for ${requirement.title}`,
      quantity: Number(quantity),
      unit: unit || "Packets",
      pickupAddress,
      contactNumber: contactNumber || req.user.phone || "",
      notes: notes || "",
      image: imageUrl || "",
      matchedRequirement: requirement._id,
      matchedOrganization: orgId,
      status: "accepted",
      acceptedAt: new Date(),
    });

    // Update requirement fulfillment quantity and status
    requirement.fulfilledQuantity = (Number(requirement.fulfilledQuantity) || 0) + Number(quantity);
    if (requirement.fulfilledQuantity >= requirement.quantity) {
      requirement.status = "fulfilled";
    }
    await requirement.save();

    // If requirement is linked to a BeneficiaryCase, link donation & case resources
    let targetCaseId = requirement.beneficiaryCaseId;
    if (!targetCaseId && requirement.description) {
      const match = requirement.description.match(/BEN-[\w-]+/);
      if (match) {
        const BeneficiaryCase = require("../models/BeneficiaryCase");
        const foundCase = await BeneficiaryCase.findOne({ caseNumber: match[0] });
        if (foundCase) {
          targetCaseId = foundCase._id;
          requirement.beneficiaryCaseId = foundCase._id;
          await requirement.save();
        }
      }
    }

    if (targetCaseId) {
      try {
        const BeneficiaryCase = require("../models/BeneficiaryCase");
        await BeneficiaryCase.updateOne(
          { _id: targetCaseId },
          {
            $addToSet: {
              linkedDonations: donation._id,
              linkedRequirements: requirement._id,
            },
          }
        );
      } catch (caseErr) {
        console.error("Error linking donation to beneficiary case:", caseErr.message);
      }
    }

    // Notify organization
    if (requirement.postedBy) {
      await createNotification(
        requirement.postedBy,
        "🎁 New Direct Donation Pledged!",
        `A donor pledged ${quantity} ${unit || "units"} for your requirement "${requirement.title}". Admin will assign a volunteer for delivery.`,
        "donation",
        donation._id,
        "Donation"
      );
    }

    // Notify Admins to assign a volunteer for pickup
    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "📦 New Donation Pledged - Assign Volunteer",
          `A donor pledged ${quantity} ${unit || "units"} for requirement "${requirement.title}". Please assign a volunteer for pickup.`,
          "donation",
          donation._id,
          "Donation"
        );
      }
    } catch (notifErr) {
      console.error("Admin notification error:", notifErr.message);
    }

    res.status(201).json({
      message: "Pledge submitted successfully. Awaiting volunteer pickup assignment by Admin.",
      donation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Organization: Accept Donation ─── */
exports.acceptDonation = async (req, res) => {
  try {
    const RecipientOrganization = require("../models/RecipientOrganization");
    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org) return res.status(403).json({ message: "Organization profile not found." });
    if (org.verificationStatus !== "verified") {
      return res.status(403).json({ message: "Your organization is not verified." });
    }

    const donation = await Donation.findById(req.params.id)
      .populate("matchedOrganization")
      .populate("matchedRequirement")
      .populate("postedBy", "_id fullName");

    if (!donation) return res.status(404).json({ message: "Donation not found." });

    // Verify this org is the one matched to the donation
    const donationOrgId = donation.matchedOrganization?._id?.toString() || donation.matchedOrganization?.toString();
    if (!donationOrgId || donationOrgId !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized: this donation is not assigned to your organization." });
    }

    if (!["pending", "matched"].includes(donation.status)) {
      return res.status(400).json({ message: "Only pending or matched donations can be accepted." });
    }

    donation.status = "accepted";
    donation.acceptedAt = new Date();
    await donation.save();

    const orgName = org.orgName || "Organization";

    // Notify donor
    if (donation.postedBy) {
      await createNotification(
        donation.postedBy._id,
        "✅ Donation Accepted!",
        `Your donation has been accepted by ${orgName}.`,
        "donation",
        donation._id,
        "Donation"
      );
    }

    res.json({ message: "Donation accepted successfully.", donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Organization: Reject Donation ─── */
exports.rejectDonation = async (req, res) => {
  try {
    const { reason } = req.body;

    const RecipientOrganization = require("../models/RecipientOrganization");
    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org) return res.status(403).json({ message: "Organization profile not found." });
    if (org.verificationStatus !== "verified") {
      return res.status(403).json({ message: "Your organization is not verified." });
    }

    const donation = await Donation.findById(req.params.id)
      .populate("matchedOrganization")
      .populate("postedBy", "_id");

    if (!donation) return res.status(404).json({ message: "Donation not found." });

    // Verify this org is the one matched to the donation
    const donationOrgId = donation.matchedOrganization?._id?.toString() || donation.matchedOrganization?.toString();
    if (!donationOrgId || donationOrgId !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized: this donation is not assigned to your organization." });
    }

    donation.status = "rejected";
    donation.rejectionReason = reason || "Declined by organization";
    await donation.save();

    // Reopen the matched requirement so it's available for other donations
    if (donation.matchedRequirement) {
      const targetReq = await Requirement.findById(donation.matchedRequirement);
      if (targetReq) {
        const remainingFulfilled = Math.max(0, (targetReq.fulfilledQuantity || 0) - (donation.quantity || 0));
        await Requirement.findByIdAndUpdate(donation.matchedRequirement, {
          status: "open",
          fulfilledQuantity: remainingFulfilled,
          matchedDonation: null,
        });
      }
    }

    const orgName = org.orgName || "Organization";

    if (donation.postedBy) {
      await createNotification(
        donation.postedBy._id,
        "❌ Donation Update",
        `Your donation was declined by ${orgName}. Reason: ${reason || "Not specified."}`,
        "donation",
        donation._id,
        "Donation"
      );
    }

    res.json({ message: "Donation rejected.", donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Admin: Get All Donations ─── */
exports.getAllDonations = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (category && category !== "all") filter.category = category;

    const donations = await Donation.find(filter)
      .populate("postedBy", "fullName email")
      .populate("matchedOrganization", "orgName address")
      .populate("matchedRequirement", "title urgency")
      .sort({ createdAt: -1 });

    const stats = {
      total: await Donation.countDocuments(),
      pending: await Donation.countDocuments({ status: "pending" }),
      matched: await Donation.countDocuments({ status: "matched" }),
      accepted: await Donation.countDocuments({ status: "accepted" }),
      delivered: await Donation.countDocuments({ status: "delivered" }),
      cancelled: await Donation.countDocuments({ status: "cancelled" }),
    };

    res.json({ donations, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Admin: Re-run Match for a Donation ─── */
exports.runMatch = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Donation not found." });
    if (!["pending", "matched"].includes(donation.status)) {
      return res.status(400).json({ message: "Can only re-match pending or matched donations." });
    }

    const { bestMatch, topMatches } = await matchDonationToRequirements(donation);

    if (bestMatch) {
      // Revert old match if any
      if (donation.matchedRequirement) {
        await Requirement.findByIdAndUpdate(donation.matchedRequirement, {
          status: "open",
          matchedDonation: null,
        });
      }

      donation.matchedRequirement = bestMatch.requirementId;
      donation.matchedOrganization = bestMatch.organizationId;
      donation.status = "matched";
      await donation.save();

      await Requirement.findByIdAndUpdate(bestMatch.requirementId, {
        status: "matched",
        matchedDonation: donation._id,
      });

      return res.json({ message: "Matching requirement found.", bestMatch, topMatches, donation });
    }

    res.json({ message: "No matching requirement found yet.", bestMatch: null, topMatches, donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get Incoming Donations for Organization ─── */
exports.getIncomingDonations = async (req, res) => {
  try {
    const RecipientOrganization = require("../models/RecipientOrganization");
    const org = await RecipientOrganization.findOne({ userId: req.user._id });
    if (!org) return res.status(403).json({ message: "Organization not found." });

    const donations = await Donation.find({
      matchedOrganization: org._id,
    })
      .populate("postedBy", "fullName email phone")
      .populate("donorId")
      .populate("matchedRequirement", "title category urgency quantity location unit")
      .sort({ createdAt: -1 });

    res.json({ donations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get Recommendations for a Donation (Workflow A) ─── */
exports.getDonationRecommendations = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Donation not found." });

    // Authorization: owner donor or admin
    if (req.user.role !== "admin" && donation.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view recommendations for this donation." });
    }

    const result = await findMatchingRequirementsForDonation(donation._id, { limit: 10 });
    res.json({
      donation: {
        _id: donation._id,
        donationName: donation.donationName,
        category: donation.category,
        quantity: donation.quantity,
        unit: donation.unit,
        status: donation.status,
      },
      recommendations: result.recommendations,
      totalEligible: result.totalEligible,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Allocate Donation to Requirement (Safe Concurrency & Quantity Management) ─── */
exports.allocateDonation = async (req, res) => {
  try {
    const { requirementId } = req.body;
    if (!requirementId) {
      return res.status(400).json({ message: "Requirement ID is required." });
    }

    // 1. Reload donation
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Donation not found." });

    // Check authorization: must be donor owner or admin
    if (req.user.role !== "admin" && donation.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to allocate this donation." });
    }

    // Idempotent guard: if this donation was already allocated to this requirement
    if (
      donation.matchedRequirement?.toString() === requirementId &&
      donation.status === "accepted"
    ) {
      const requirement = await Requirement.findById(requirementId);
      return res.json({
        message: "Donation is already allocated to this requirement.",
        donation,
        requirement,
        alreadyMatched: true,
      });
    }

    // Revalidate donation status: must be pending or matched
    if (!["pending", "matched"].includes(donation.status)) {
      return res.status(400).json({
        message: `Donation cannot be allocated because its current status is "${donation.status}".`,
      });
    }

    // 2. Reload requirement with organization details
    const requirement = await Requirement.findById(requirementId).populate("organizationId postedBy");
    if (!requirement) {
      return res.status(404).json({ message: "Requirement not found." });
    }

    // Revalidate organization verification
    const org = requirement.organizationId;
    if (!org || org.verificationStatus !== "verified") {
      return res.status(400).json({
        message: "Matches can only be allocated to verified recipient organizations.",
      });
    }

    // Revalidate requirement status
    if (!["open", "matched"].includes(requirement.status)) {
      return res.status(400).json({
        message: `Requirement is no longer open for donations (status: ${requirement.status}).`,
      });
    }

    // Revalidate deadline
    const now = new Date();
    const deadline = requirement.requiredBefore || requirement.expiresAt;
    if (deadline && new Date(deadline) < now) {
      return res.status(400).json({ message: "This requirement has expired." });
    }

    // 3. Concurrency check & Quantity allocation
    const remainingReq = Math.max(0, requirement.quantity - (requirement.fulfilledQuantity || 0));
    if (remainingReq <= 0) {
      return res.status(409).json({ message: "Conflict: This requirement has already been fulfilled." });
    }

    const allocatedQty = Math.min(donation.quantity, remainingReq);
    const newFulfilledQty = (requirement.fulfilledQuantity || 0) + allocatedQty;
    const isRequirementFullyFulfilled = newFulfilledQty >= requirement.quantity;

    // Run scoring calculation for explainable record
    const matchCalc = calculateMatch(donation, requirement);

    // Atomic update on requirement
    await Requirement.findByIdAndUpdate(requirement._id, {
      $inc: { fulfilledQuantity: allocatedQty },
      status: isRequirementFullyFulfilled ? "fulfilled" : "matched",
      matchedDonation: donation._id,
    });

    // Update donation
    donation.status = "matched";
    donation.matchedRequirement = requirement._id;
    donation.matchedOrganization = org._id;
    donation.matchScore = matchCalc.overallScore;
    donation.matchBreakdown = {
      factorScores: matchCalc.factorScores,
      reasons: matchCalc.reasons,
    };
    await donation.save();

    // 4. Send notification to organization
    if (requirement.postedBy?._id) {
      await createNotification(
        requirement.postedBy._id,
        "🎯 Relief Allocation Confirmed!",
        `Donor matched ${allocatedQty} ${donation.unit || "units"} of "${donation.donationName}" to your requirement "${requirement.title}" (Score: ${matchCalc.overallScore}%).`,
        "match",
        donation._id,
        "Donation"
      );
    }

    res.json({
      message: "Donation successfully matched and allocated to requirement!",
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

/* ─── AI Assist: Parse Free-Text Donation Description ─── */
exports.parseDescriptionWithAi = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || typeof description !== "string") {
      return res.status(400).json({ message: "Please provide a description text to parse." });
    }

    const result = await interpretDonationDescription(description);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

