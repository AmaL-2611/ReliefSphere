const Delivery = require("../models/deliveryModel");
const Donation = require("../models/donationModel");
const Volunteer = require("../models/volunteerModel");
const Requirement = require("../models/requirementModel");
const User = require("../models/userModel");
const { createNotification } = require("../utils/aiMatcher");

/* ─── Admin: Assign Volunteer to Donation ─── */
exports.assignVolunteer = async (req, res) => {
  try {
    const { donationId, volunteerId, scheduledTime } = req.body;

    const donation = await Donation.findById(donationId)
      .populate("postedBy", "_id fullName")
      .populate("matchedOrganization", "address");

    if (!donation) return res.status(404).json({ message: "Donation not found." });
    if (!["accepted", "matched"].includes(donation.status)) {
      return res.status(400).json({ message: "Donation must be accepted before assigning a volunteer." });
    }

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) return res.status(404).json({ message: "Volunteer not found." });

    // Create delivery record
    const delivery = await Delivery.create({
      donationId,
      volunteerId,
      assignedBy: req.user._id,
      pickupAddress: donation.pickupAddress,
      dropAddress: donation.matchedOrganization?.address || "",
      pickupLat: donation.latitude,
      pickupLng: donation.longitude,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
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
          { path: "postedBy", select: "fullName email" },
          { path: "matchedOrganization", select: "orgName address" },
          { path: "matchedRequirement", select: "title category" },
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

    // Update donation and requirement statuses
    await Donation.findByIdAndUpdate(donation._id, {
      status: "delivered",
      deliveredAt: new Date(),
    });

    if (donation.matchedRequirement) {
      await Requirement.findByIdAndUpdate(donation.matchedRequirement, { status: "fulfilled" });
    }

    // Increment volunteer completed deliveries
    volunteer.completedDeliveries = (volunteer.completedDeliveries || 0) + 1;
    await volunteer.save();

    // Notify donor
    if (donation.postedBy?._id) {
      await createNotification(
        donation.postedBy._id,
        "🎉 Donation Delivered!",
        `Your donation "${donation.donationName}" has been successfully delivered!`,
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

    const filePaths = req.files ? req.files.map((f) => f.path) : [];
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
