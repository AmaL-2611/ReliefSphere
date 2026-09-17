const mongoose = require("mongoose");

const recommendationLogSchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
    },
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      default: null,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipientOrganization",
      required: true,
    },
    urgencyScore: {
      type: Number,
      default: 0,
    },
    proximityScore: {
      type: Number,
      default: 0,
    },
    capacityScore: {
      type: Number,
      default: 0,
    },
    categoryMatchScore: {
      type: Number,
      default: 0,
    },
    finalScore: {
      type: Number,
      required: true,
    },
    wasAccepted: {
      type: Boolean,
      default: false,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecommendationLog", recommendationLogSchema);
