const Donation = require("../models/donationModel");
const Donor = require("../models/donorModel");
const Requirement = require("../models/requirementModel");
const Delivery = require("../models/deliveryModel");
const User = require("../models/userModel");
const { matchDonationToRequirements, createNotification } = require("../utils/aiMatcher");
const upload = require("../middleware/upload");

/* ─── Create Donation (Donor) ─── */
exports.createDonation = async (req, res) => {
  try {
    const { category, donationName, quantity, description, pickupAddress, latitude, longitude } = req.body;

    // Find donor profile
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) return res.status(403).json({ message: "Donor profile not found." });

    const imagePath = req.file ? req.file.path : "";

    const donation = await Donation.create({
      donorId: donor._id,
      postedBy: req.user._id,
      category,
      donationName,
      quantity: Number(quantity),
      description,
      pickupAddress,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      image: imagePath,
    });

    // ── Run AI Matching Engine ──
    const { bestMatch, topMatches } = await matchDonationToRequirements(donation);

    if (bestMatch && bestMatch.score >= 40) {
      // Update donation with best match
      donation.matchedRequirement = bestMatch.requirementId;
      donation.matchedOrganization = bestMatch.organizationId;
      donation.matchScore = bestMatch.score;
      donation.status = "matched";
      await donation.save();

      // Mark requirement as matched
      await Requirement.findByIdAndUpdate(bestMatch.requirementId, {
        status: "matched",
        matchedDonation: donation._id,
      });

      // Notify the organization
      const orgUser = await User.findOne({ _id: { $exists: true } }).populate("_id");
      const req_doc = await Requirement.findById(bestMatch.requirementId).populate("postedBy");
      if (req_doc?.postedBy?._id) {
        await createNotification(
          req_doc.postedBy._id,
          "🎁 New Donation Matched!",
          `A donation of ${quantity} ${category} has been matched to your requirement "${bestMatch.title}". Match score: ${bestMatch.score}%.`,
          "match",
          donation._id,
          "Donation"
        );
      }

      return res.status(201).json({
        message: "Donation submitted and matched!",
        donation,
        aiMatch: {
          matched: true,
          bestMatch,
          topMatches,
        },
      });
    }

    // No strong match found — donation stays pending
    await donation.save();

    res.status(201).json({
      message: "Donation submitted. AI will match when a suitable requirement is posted.",
      donation,
      aiMatch: { matched: false, bestMatch: null, topMatches },
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
      .populate("matchedOrganization", "orgName orgType address")
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

    // If matched, reopen the requirement
    if (donation.matchedRequirement) {
      await Requirement.findByIdAndUpdate(donation.matchedRequirement, {
        status: "open",
        matchedDonation: null,
      });
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

    let donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      donor = await Donor.create({
        userId: req.user._id,
        address: pickupAddress || "",
        phone: contactNumber || "",
      });
    }

    const requirement = await Requirement.findById(requirementId).populate("organizationId");
    if (!requirement) return res.status(404).json({ message: "Requirement not found." });

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
      status: "pending", // Pending NGO Approval
    });

    // Notify organization
    if (requirement.postedBy) {
      await createNotification(
        requirement.postedBy,
        "🎁 New Direct Donation Pledged!",
        `A donor pledged ${quantity} ${unit || "units"} for your requirement "${requirement.title}".`,
        "donation",
        donation._id,
        "Donation"
      );
    }

    res.status(201).json({
      message: "Pledge submitted successfully. Awaiting NGO approval.",
      donation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Organization: Accept Donation ─── */
exports.acceptDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("matchedOrganization")
      .populate("matchedRequirement")
      .populate("postedBy", "_id fullName");

    if (!donation) return res.status(404).json({ message: "Donation not found." });
    if (!["pending", "matched"].includes(donation.status)) {
      return res.status(400).json({ message: "Only pending or matched donations can be accepted." });
    }

    donation.status = "accepted";
    donation.acceptedAt = new Date();
    await donation.save();

    // If linked to requirement, update requirement fulfillment progress
    if (donation.matchedRequirement) {
      const reqDoc = await Requirement.findById(donation.matchedRequirement._id);
      if (reqDoc) {
        reqDoc.receivedQuantity = (reqDoc.receivedQuantity || 0) + donation.quantity;
        if (reqDoc.receivedQuantity >= reqDoc.quantity) {
          reqDoc.status = "fulfilled";
        }
        await reqDoc.save();
      }
    }

    const orgName = donation.matchedOrganization?.orgName || "Hope Foundation";

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
    const donation = await Donation.findById(req.params.id)
      .populate("matchedOrganization")
      .populate("postedBy", "_id");

    if (!donation) return res.status(404).json({ message: "Donation not found." });

    donation.status = "rejected";
    donation.rejectionReason = reason || "Declined by organization";
    await donation.save();

    const orgName = donation.matchedOrganization?.orgName || "Organization";

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

/* ─── Admin: Re-run AI Match for a Donation ─── */
exports.runAIMatch = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Donation not found." });
    if (!["pending", "matched"].includes(donation.status)) {
      return res.status(400).json({ message: "Can only re-match pending or matched donations." });
    }

    const { bestMatch, topMatches } = await matchDonationToRequirements(donation);

    if (bestMatch && bestMatch.score >= 40) {
      // Revert old match if any
      if (donation.matchedRequirement) {
        await Requirement.findByIdAndUpdate(donation.matchedRequirement, {
          status: "open",
          matchedDonation: null,
        });
      }

      donation.matchedRequirement = bestMatch.requirementId;
      donation.matchedOrganization = bestMatch.organizationId;
      donation.matchScore = bestMatch.score;
      donation.status = "matched";
      await donation.save();

      await Requirement.findByIdAndUpdate(bestMatch.requirementId, {
        status: "matched",
        matchedDonation: donation._id,
      });

      return res.json({ message: "AI match found.", bestMatch, topMatches, donation });
    }

    res.json({ message: "No suitable match found yet.", bestMatch: null, topMatches, donation });
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
