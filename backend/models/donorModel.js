const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    donorType: {
      type: String,
      enum: ["individual", "small_business", "educational_institution"],
      default: "individual",
    },
    preferredCategories: { type: [String], default: [] },
    address: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    totalDonations: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Donor", donorSchema);
