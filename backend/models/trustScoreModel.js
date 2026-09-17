const mongoose = require("mongoose");

const trustScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    userRole: {
      type: String,
      enum: ["donor", "recipient_org", "volunteer"],
      required: true,
    },
    verificationWeight: {
      type: Number,
      default: 1.0,
    },
    trustScore: {
      type: Number,
      default: 50.0,
      min: 0,
      max: 100,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrustScore", trustScoreSchema);
