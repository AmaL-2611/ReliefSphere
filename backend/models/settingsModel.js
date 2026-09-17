const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    aiWeights: {
      categoryMatch: { type: Number, default: 40, min: 0, max: 100 },
      quantityRatio: { type: Number, default: 25, min: 0, max: 100 },
      urgency: { type: Number, default: 20, min: 0, max: 100 },
      proximity: { type: Number, default: 15, min: 0, max: 100 },
      minMatchThreshold: { type: Number, default: 40, min: 0, max: 100 },
    },
    distanceThresholds: {
      localKm: { type: Number, default: 5 },
      districtKm: { type: Number, default: 20 },
      regionalKm: { type: Number, default: 50 },
      maxRadiusKm: { type: Number, default: 100 },
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      smsAlertsEnabled: { type: Boolean, default: false },
      autoAssignVolunteer: { type: Boolean, default: true },
    },
    system: {
      platformName: { type: String, default: "ReliefSphere AI" },
      supportEmail: { type: String, default: "support@reliefsphere.org" },
      maintenanceMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
