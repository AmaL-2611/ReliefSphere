const mongoose = require("mongoose");

const recipientOrganizationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orgName: {
      type: String,
      required: true,
    },

    orgType: {
      type: String,
      enum: ["ngo", "orphanage", "old_age_home", "government_school"],
      required: true,
    },

    registrationNumber: String,

    address: String,

    verificationDocs: {
      type: [String],
      default: [],
    },

    latitude: Number,

    longitude: Number,

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "RecipientOrganization",
  recipientOrganizationSchema,
);
