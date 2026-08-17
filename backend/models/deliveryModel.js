const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pickupAddress: {
      type: String,
      default: "",
    },
    dropAddress: {
      type: String,
      default: "",
    },
    pickupLat: { type: Number, default: null },
    pickupLng: { type: Number, default: null },
    dropLat:   { type: Number, default: null },
    dropLng:   { type: Number, default: null },
    scheduledTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["assigned", "picked_up", "in_transit", "delivered", "failed"],
      default: "assigned",
    },
    proofImages: {
      type: [String],
      default: [],
    },
    proofNote: {
      type: String,
      default: "",
    },
    pickedUpAt: {
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

module.exports = mongoose.model("Delivery", deliverySchema);
