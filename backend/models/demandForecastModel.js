const mongoose = require("mongoose");

const demandForecastSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipientOrganization",
      required: true,
    },
    predictedCategory: {
      type: String,
      enum: ["food", "clothes", "books", "medicine", "essentials"],
      required: true,
    },
    predictedUrgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },
    predictionDate: {
      type: Date,
      default: Date.now,
    },
    actualOutcome: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DemandForecast", demandForecastSchema);
