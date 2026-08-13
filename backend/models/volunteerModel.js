const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      enum: [
        "Driving",
        "Loading & Unloading",
        "Inventory Handling",
        "Logistics & Delivery",
        "First Aid",
        "Community Support",
      ],
      default: [],
    },

    latitude: Number,

    longitude: Number,

    completedDeliveries: {
      type: Number,
      default: 0,
    },

    idDocument: {
      type: String,
      default: "",
    },

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
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Volunteer", volunteerSchema);
