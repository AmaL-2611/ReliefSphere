const User = require("../models/userModel");
const Volunteer = require("../models/volunteerModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const sendEmail = require("../utils/sendEmail");

exports.getDonors = async (req, res) => {
  try {
    const donors = await User.find({
      role: "donor",
    }).sort({ createdAt: -1 });

    const stats = {
      total: donors.length,
      individual: donors.filter((d) => d.donorType === "individual").length,
      business: donors.filter((d) => d.donorType === "small_business").length,
      institution: donors.filter(
        (d) => d.donorType === "educational_institution",
      ).length,
    };

    res.json({
      donors,
      stats,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch donors",
    });
  }
};
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

    const volunteer = await Volunteer.findById(req.params.id).populate(
      "userId",
    );

    volunteer.verificationStatus = "rejected";
    volunteer.rejectionReason = reason;

    await volunteer.save();

    await sendEmail(
      volunteer.userId.email,
      "Volunteer Registration Rejected",
      `
      <h2>Registration Rejected</h2>

      <p>Reason:</p>

      <b>${reason}</b>

      <p>You may register again with valid documents.</p>
      `,
    );

    res.json({
      message: "Volunteer rejected.",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
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

      ReliefSphere AI Team
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
