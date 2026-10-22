const Delivery = require("../models/deliveryModel");
const Donation = require("../models/donationModel");
const Volunteer = require("../models/volunteerModel");
const Requirement = require("../models/requirementModel");
const Campaign = require("../models/campaignModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const User = require("../models/userModel");
const { createNotification } = require("../utils/resourceMatcher");

/* ─── Admin: Assign Volunteer to Donation ─── */
exports.assignVolunteer = async (req, res) => {
  try {
    const { donationId, volunteerId, scheduledTime } = req.body;

    const donation = await Donation.findById(donationId)
      .populate("postedBy", "_id fullName")
      .populate("matchedOrganization", "address");

    if (!donation) return res.status(404).json({ message: "Donation not found." });
    if (!donation.matchedOrganization) {
      return res.status(400).json({
        message: "Cannot assign volunteer: this donation has not been matched with a recipient NGO yet. Please match an NGO first so the volunteer has a delivery destination.",
      });
    }
    if (!["accepted", "matched", "pending"].includes(donation.status)) {
      return res.status(400).json({ message: "Donation is not available for volunteer assignment." });
    }

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) return res.status(404).json({ message: "Volunteer not found." });
    if (volunteer.verificationStatus !== "verified") {
      return res.status(400).json({ message: "Only verified volunteers can be assigned to deliveries." });
    }

    // Validate scheduled pickup time if provided
    let parsedScheduledTime = null;
    if (scheduledTime) {
      parsedScheduledTime = new Date(scheduledTime);
      if (isNaN(parsedScheduledTime.getTime())) {
        return res.status(400).json({ message: "Invalid scheduled pickup date and time format." });
      }
      // Allow 2 minutes grace period for network latency / clock skew
      if (parsedScheduledTime.getTime() < Date.now() - 2 * 60 * 1000) {
        return res.status(400).json({
          message: "Scheduled pickup time cannot be in the past. Please select a future date and time.",
        });
      }
    }

    // Prevent duplicate delivery assignment for the same donation
    const existingDelivery = await Delivery.findOne({ donationId });
    if (existingDelivery && ["assigned", "picked_up", "in_transit"].includes(existingDelivery.status)) {
      return res.status(409).json({ message: "A delivery is already in progress for this donation." });
    }

    // Create delivery record
    const delivery = await Delivery.create({
      donationId,
      volunteerId,
      assignedBy: req.user._id,
      pickupAddress: donation.pickupAddress,
      dropAddress: donation.matchedOrganization?.address || "",
      pickupLat: donation.latitude,
      pickupLng: donation.longitude,
      scheduledTime: parsedScheduledTime,
    });

    // Update donation status
    donation.status = "assigned";
    await donation.save();

    // Notify volunteer
    await createNotification(
      volunteer.userId,
      "📦 New Delivery Assigned",
      `You have been assigned to deliver "${donation.donationName}". Pickup: ${donation.pickupAddress}`,
      "delivery",
      delivery._id,
      "Delivery"
    );

    // Notify donor
    await createNotification(
      donation.postedBy._id,
      "🚗 Volunteer Assigned",
      `A volunteer has been assigned to pick up your donation "${donation.donationName}".`,
      "donation",
      donation._id,
      "Donation"
    );

    res.status(201).json({ message: "Volunteer assigned successfully.", delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Volunteer: Get My Assigned Deliveries ─── */
exports.getMyDeliveries = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) return res.status(403).json({ message: "Volunteer profile not found." });

    const deliveries = await Delivery.find({ volunteerId: volunteer._id })
      .populate({
        path: "donationId",
        populate: [
          { path: "postedBy", select: "_id fullName email phone" },
          { path: "matchedOrganization", select: "_id userId orgName address orgType" },
          { path: "matchedRequirement", select: "_id title category" },
        ],
      })
      .sort({ createdAt: -1 });

    const stats = {
      total: deliveries.length,
      assigned: deliveries.filter((d) => d.status === "assigned").length,
      inTransit: deliveries.filter((d) => ["picked_up", "in_transit"].includes(d.status)).length,
      delivered: deliveries.filter((d) => d.status === "delivered").length,
    };

    res.json({ deliveries, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Volunteer: Mark as Picked Up ─── */
exports.markPickedUp = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate("donationId");
    if (!delivery) return res.status(404).json({ message: "Delivery not found." });

    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) return res.status(403).json({ message: "Volunteer profile not found." });
    if (delivery.volunteerId.toString() !== volunteer._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (delivery.status !== "assigned") {
      return res.status(400).json({ message: "Delivery must be in assigned state." });
    }

    delivery.status = "picked_up";
    delivery.pickedUpAt = new Date();
    await delivery.save();

    // Update donation status
    await Donation.findByIdAndUpdate(delivery.donationId._id, { status: "picked_up" });

    // Notify donor
    await createNotification(
      delivery.donationId.postedBy,
      "📦 Donation Picked Up!",
      `Your donation "${delivery.donationId.donationName}" has been picked up by the volunteer.`,
      "donation",
      delivery.donationId._id,
      "Donation"
    );

    res.json({ message: "Marked as picked up.", delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Volunteer: Mark as Delivered ─── */
exports.markDelivered = async (req, res) => {
  try {
    const { proofNote } = req.body;
    const delivery = await Delivery.findById(req.params.id)
      .populate({ path: "donationId", populate: { path: "postedBy", select: "_id" } });

    if (!delivery) return res.status(404).json({ message: "Delivery not found." });

    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) return res.status(403).json({ message: "Volunteer profile not found." });
    if (delivery.volunteerId.toString() !== volunteer._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (!["picked_up", "in_transit"].includes(delivery.status)) {
      return res.status(400).json({ message: "Delivery must be picked up first." });
    }

    delivery.status = "delivered";
    delivery.deliveredAt = new Date();
    if (proofNote) delivery.proofNote = proofNote;
    await delivery.save();

    const donation = delivery.donationId;

    // Update donation status
    await Donation.findByIdAndUpdate(donation._id, {
      status: "delivered",
      deliveredAt: new Date(),
    });

    // Update Campaign raised quantity ONLY on delivery
    if (donation.campaignId) {
      const campaign = await Campaign.findById(donation.campaignId);
      if (campaign) {
        campaign.raisedQuantity = (campaign.raisedQuantity || 0) + (donation.quantity || 1);
        if (campaign.targetQuantity > 0 && campaign.raisedQuantity >= campaign.targetQuantity) {
          campaign.status = "COMPLETED";
        }
        await campaign.save();
      }
    }

    // Update Requirement received quantity ONLY on delivery
    if (donation.matchedRequirement) {
      const reqDoc = await Requirement.findById(donation.matchedRequirement);
      if (reqDoc) {
        reqDoc.receivedQuantity = (reqDoc.receivedQuantity || 0) + (donation.quantity || 1);
        if (reqDoc.receivedQuantity >= reqDoc.quantity) {
          reqDoc.status = "fulfilled";
        }
        await reqDoc.save();
      }
    }

    // Increment volunteer completed deliveries
    volunteer.completedDeliveries = (volunteer.completedDeliveries || 0) + 1;
    await volunteer.save();

    // Notify Community Shelter / Organization
    const targetOrgId = donation.organizationId || donation.matchedOrganization;
    if (targetOrgId) {
      const org = await RecipientOrganization.findById(targetOrgId);
      if (org && org.userId) {
        await createNotification(
          org.userId,
          "📦 Relief Items Delivered to Shelter!",
          `Volunteer has delivered ${donation.quantity} ${donation.unit || "units"} of "${donation.donationName}".`,
          "donation",
          donation._id,
          "Donation"
        );
      }
    }

    // Notify donor
    if (donation.postedBy?._id) {
      await createNotification(
        donation.postedBy._id,
        "🎉 Donation Delivered!",
        `Your donation "${donation.donationName}" has been successfully delivered to the shelter!`,
        "donation",
        donation._id,
        "Donation"
      );
    }

    res.json({ message: "Delivery marked as completed.", delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Volunteer: Upload Proof Images ─── */
exports.uploadProof = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ message: "Delivery not found." });

    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (delivery.volunteerId.toString() !== volunteer._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const filePaths = req.files ? req.files.map((f) => `uploads/${f.filename}`) : [];
    delivery.proofImages = [...(delivery.proofImages || []), ...filePaths];
    if (req.body.proofNote) delivery.proofNote = req.body.proofNote;
    await delivery.save();

    res.json({ message: "Proof uploaded.", delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Admin: Get All Deliveries ─── */
exports.getAllDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const deliveries = await Delivery.find(filter)
      .populate({ path: "donationId", select: "donationName category status pickupAddress" })
      .populate({ path: "volunteerId", populate: { path: "userId", select: "fullName email" } })
      .populate("assignedBy", "fullName")
      .sort({ createdAt: -1 });

    const stats = {
      total: await Delivery.countDocuments(),
      assigned: await Delivery.countDocuments({ status: "assigned" }),
      inTransit: await Delivery.countDocuments({ status: { $in: ["picked_up", "in_transit"] } }),
      delivered: await Delivery.countDocuments({ status: "delivered" }),
    };

    res.json({ deliveries, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
