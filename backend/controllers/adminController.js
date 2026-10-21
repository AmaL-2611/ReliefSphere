const User = require("../models/userModel");
const Volunteer = require("../models/volunteerModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const Settings = require("../models/settingsModel");
const sendEmail = require("../utils/sendEmail");



/* ===========================
   GET PENDING VOLUNTEERS
=========================== */

exports.getVolunteers = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};

    if (status && status !== "all") {
      filter.verificationStatus = status;
    }

    const volunteers = await Volunteer.find(filter)
      .populate("userId", "fullName email phone")
      .sort({ createdAt: -1 });

    const stats = {
      total: await Volunteer.countDocuments(),

      pending: await Volunteer.countDocuments({
        verificationStatus: "pending",
      }),

      verified: await Volunteer.countDocuments({
        verificationStatus: "verified",
      }),

      rejected: await Volunteer.countDocuments({
        verificationStatus: "rejected",
      }),
    };

    res.json({
      volunteers,
      stats,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
/* ==
/* ===========================
   APPROVE VOLUNTEER
=========================== */

exports.approveVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id).populate(
      "userId",
    );

    if (!volunteer)
      return res.status(404).json({
        message: "Volunteer not found",
      });

    volunteer.verificationStatus = "verified";
    volunteer.approvedAt = new Date();
    volunteer.approvedBy = req.user.id;

    await volunteer.save();

    await User.findByIdAndUpdate(volunteer.userId._id, {
      isVerified: true,
    });

    const loginUrl = `${process.env.CLIENT_URL}/login`;

    await sendEmail(
      volunteer.userId.email,
      "Volunteer Registration Approved",
      `
      <h2>Congratulations!</h2>

      <p>Hello ${volunteer.userId.fullName},</p>

      <p>Your volunteer registration has been approved.</p>

      <p>You may now login to ReliefSphere AI.</p>

      <a href="${loginUrl}"
      style="
      background:#0E7490;
      color:white;
      padding:12px 25px;
      text-decoration:none;
      border-radius:8px;
      display:inline-block;
      ">
      Login Now
      </a>

      <br><br>

      Regards,<br>
      ReliefSphere AI Team
      `,
    );

    res.json({
      message: "Volunteer approved successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ===========================
   APPROVE ORGANIZATION
=========================== */

/* ===========================
   APPROVE ORGANIZATION
=========================== */

exports.approveOrganization = async (req, res) => {
  try {
    const organization = await RecipientOrganization.findById(
      req.params.id,
    ).populate("userId");

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    organization.verificationStatus = "verified";
    organization.approvedBy = req.user.id;
    organization.approvedAt = new Date();

    await organization.save();

    await User.findByIdAndUpdate(organization.userId._id, {
      isVerified: true,
    });

    const loginUrl = `${process.env.CLIENT_URL}/login`;

    await sendEmail(
      organization.userId.email,
      "Organization Registration Approved",
      `
      <h2>Congratulations!</h2>

      <p>Hello <b>${organization.orgName}</b>,</p>

      <p>Your organization has been successfully verified by the ReliefSphere AI Administration Team.</p>

      <p>You can now log in and begin receiving donations.</p>

      <a
      href="${loginUrl}"
      style="
      background:#16A34A;
      color:white;
      padding:12px 24px;
      border-radius:8px;
      text-decoration:none;
      display:inline-block;
      ">
      Login Now
      </a>

      <br><br>

      Regards,<br>
      ReliefSphere AI Team
      `,
    );

    return res.status(200).json({
      success: true,
      message: "Organization approved successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to approve organization.",
    });
  }
};

/* ===========================
   GET ORGANIZATIONS
=========================== */

exports.getOrganizations = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};

    if (status && status !== "all") {
      filter.verificationStatus = status;
    }

    const organizations = await RecipientOrganization.find(filter)
      .populate("userId", "email role createdAt")
      .sort({ createdAt: -1 });

    const stats = {
      total: await RecipientOrganization.countDocuments(),
      pending: await RecipientOrganization.countDocuments({
        verificationStatus: "pending",
      }),
      verified: await RecipientOrganization.countDocuments({
        verificationStatus: "verified",
      }),
      rejected: await RecipientOrganization.countDocuments({
        verificationStatus: "rejected",
      }),
    };

    res.json({
      organizations,
      stats,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
/* ===========================
   GET DONORS
=========================== */

const Donor = require("../models/donorModel");

exports.getDonors = async (req, res) => {
  try {
    const { type } = req.query;

    let filter = {};

    if (type && type !== "all") {
      filter.donorType = type;
    }

    const donors = await Donor.find(filter)
      .populate("userId", "fullName email phone createdAt")
      .sort({ createdAt: -1 });

    const stats = {
      total: await Donor.countDocuments(),

      individual: await Donor.countDocuments({
        donorType: "individual",
      }),

      small_business: await Donor.countDocuments({
        donorType: "small_business",
      }),

      educational_institution: await Donor.countDocuments({
        donorType: "educational_institution",
      }),
    };

    res.json({
      donors,
      stats,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ===========================
   REJECT VOLUNTEER
=========================== */

exports.rejectVolunteer = async (req, res) => {
  try {
    const { reason } = req.body;

    const volunteer = await Volunteer.findById(req.params.id).populate("userId");

    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found." });
    }

    volunteer.verificationStatus = "rejected";
    volunteer.rejectionReason = reason || "Rejected by administrator";
    volunteer.approvedBy = req.user.id;
    volunteer.approvedAt = new Date();

    await volunteer.save();

    // Also mark the user as not verified
    await User.findByIdAndUpdate(volunteer.userId._id, { isVerified: false });

    try {
      await sendEmail(
        volunteer.userId.email,
        "Volunteer Registration Rejected",
        `
      <h2>Registration Rejected</h2>

      <p>Hello ${volunteer.userId.fullName},</p>

      <p>Reason:</p>

      <b>${reason || "Rejected by administrator"}</b>

      <p>You may register again with valid documents.</p>
      `,
      );
    } catch (emailErr) {
      console.error("Failed to send rejection email:", emailErr.message);
    }

    res.json({ message: "Volunteer rejected." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   REJECT ORGANIZATION
=========================== */

/* ===========================
   REJECT ORGANIZATION
=========================== */

exports.rejectOrganization = async (req, res) => {
  try {
    const { reason } = req.body;

    const organization = await RecipientOrganization.findById(
      req.params.id,
    ).populate("userId");

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    organization.verificationStatus = "rejected";
    organization.rejectionReason = reason;
    organization.approvedBy = req.user.id;
    organization.approvedAt = new Date();

    await organization.save();

    await sendEmail(
      organization.userId.email,
      "Organization Registration Rejected",
      `
      <h2>Registration Rejected</h2>

      <p>Hello <b>${organization.orgName}</b>,</p>

      <p>Unfortunately, your verification request has been rejected.</p>

      <p><strong>Reason:</strong></p>

      <p>${reason}</p>

      <p>Please correct the issue and submit your verification request again.</p>

      <br>

      Regards,<br>

      ReliefSphere Team
      `,
    );

    return res.status(200).json({
      success: true,
      message: "Organization rejected successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to reject organization.",
    });
  }
};

/* ===========================
   SETTINGS CONTROLLERS
=========================== */

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      if (req.body.matchingRules) settings.matchingRules = { ...settings.matchingRules, ...req.body.matchingRules };
      if (req.body.distanceThresholds) settings.distanceThresholds = { ...settings.distanceThresholds, ...req.body.distanceThresholds };
      if (req.body.notifications) settings.notifications = { ...settings.notifications, ...req.body.notifications };
      if (req.body.system) settings.system = { ...settings.system, ...req.body.system };
    }
    await settings.save();
    res.status(200).json({ success: true, message: "Settings updated successfully", settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===========================
   ADMIN DASHBOARD STATS
=========================== */
exports.getDashboardStats = async (req, res) => {
  try {
    const Donation = require("../models/donationModel");
    const Requirement = require("../models/requirementModel");
    const Delivery = require("../models/deliveryModel");
    const Donor = require("../models/donorModel");

    const [
      totalUsers,
      pendingOrgs,
      verifiedOrgs,
      rejectedOrgs,
      pendingVolunteers,
      verifiedVolunteers,
      rejectedVolunteers,
      totalDonors,
      totalDonations,
      pendingDonations,
      matchedDonations,
      acceptedDonations,
      deliveredDonations,
      cancelledDonations,
      totalRequirements,
      openRequirements,
      fulfilledRequirements,
      totalDeliveries,
      assignedDeliveries,
      inTransitDeliveries,
      completedDeliveries,
    ] = await Promise.all([
      User.countDocuments(),
      RecipientOrganization.countDocuments({ verificationStatus: "pending" }),
      RecipientOrganization.countDocuments({ verificationStatus: "verified" }),
      RecipientOrganization.countDocuments({ verificationStatus: "rejected" }),
      Volunteer.countDocuments({ verificationStatus: "pending" }),
      Volunteer.countDocuments({ verificationStatus: "verified" }),
      Volunteer.countDocuments({ verificationStatus: "rejected" }),
      Donor.countDocuments(),
      Donation.countDocuments(),
      Donation.countDocuments({ status: "pending" }),
      Donation.countDocuments({ status: "matched" }),
      Donation.countDocuments({ status: "accepted" }),
      Donation.countDocuments({ status: "delivered" }),
      Donation.countDocuments({ status: "cancelled" }),
      Requirement.countDocuments(),
      Requirement.countDocuments({ status: "open" }),
      Requirement.countDocuments({ status: "fulfilled" }),
      Delivery.countDocuments(),
      Delivery.countDocuments({ status: "assigned" }),
      Delivery.countDocuments({ status: { $in: ["picked_up", "in_transit"] } }),
      Delivery.countDocuments({ status: "delivered" }),
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, donors: totalDonors },
        organizations: {
          pending: pendingOrgs,
          verified: verifiedOrgs,
          rejected: rejectedOrgs,
          total: pendingOrgs + verifiedOrgs + rejectedOrgs,
        },
        volunteers: {
          pending: pendingVolunteers,
          verified: verifiedVolunteers,
          rejected: rejectedVolunteers,
          total: pendingVolunteers + verifiedVolunteers + rejectedVolunteers,
        },
        donations: {
          total: totalDonations,
          pending: pendingDonations,
          matched: matchedDonations,
          accepted: acceptedDonations,
          delivered: deliveredDonations,
          cancelled: cancelledDonations,
        },
        requirements: {
          total: totalRequirements,
          open: openRequirements,
          fulfilled: fulfilledRequirements,
        },
        deliveries: {
          total: totalDeliveries,
          assigned: assignedDeliveries,
          inTransit: inTransitDeliveries,
          completed: completedDeliveries,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
