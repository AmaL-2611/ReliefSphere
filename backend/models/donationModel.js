const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["food", "clothes", "books", "medicine", "essentials"],
      required: true,
    },
    donationName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      default: "",
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      default: "Packets",
    },
    contactNumber: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "matched",
        "accepted",
        "rejected",
        "assigned",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    matchedRequirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      default: null,
    },
    matchedOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipientOrganization",
      default: null,
    },
    matchScore: {
      type: Number,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
