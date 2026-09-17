const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    disasterType: {
      type: String,
      enum: [
        "Flood",
        "Landslide",
        "Cyclone",
        "Earthquake",
        "Fire Accident",
        "Medical Emergency",
        "Community Crisis",
        "Other",
      ],
      required: true,
    },
    reliefGoal: {
      type: String,
      enum: [
        "Food Kits",
        "Medicines",
        "Blankets",
        "Hygiene Kits",
        "Shelter Materials",
        "School Kits",
        "Mixed Relief Supplies",
      ],
      required: true,
    },
    category: {
      type: String,
      default: "Disaster Response",
    },
    description: {
      type: String,
      default: "",
    },
    targetBeneficiaries: {
      type: String,
      default: "",
    },
    affectedPeopleCount: {
      type: Number,
      default: 0,
    },
    affectedFamiliesCount: {
      type: Number,
      default: 0,
    },
    coordinatorName: {
      type: String,
      default: "",
    },
    coordinatorContact: {
      type: String,
      default: "",
    },
    distributionPlan: {
      type: String,
      default: "",
    },
    estimatedBudget: {
      type: Number,
      default: 0,
    },
    targetQuantity: {
      type: Number,
      default: 0,
    },
    raisedQuantity: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    urgency: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "High",
    },
    coverImage: {
      type: String,
      default: "",
    },
    evidenceFiles: {
      type: [String],
      default: [],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipientOrganization",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "ACTIVE",
        "COMPLETED",
        "REJECTED",
      ],
      default: "PENDING_APPROVAL",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Virtual field for backwards compatibility with name / title
campaignSchema.virtual("name").get(function () {
  return this.title;
});

// Virtual field for dynamic isActive status
campaignSchema.virtual("isActive").get(function () {
  const now = new Date();
  return (
    (this.status === "APPROVED" || this.status === "ACTIVE") &&
    now >= new Date(this.startDate) &&
    now <= new Date(this.endDate)
  );
});

campaignSchema.set("toJSON", { virtuals: true });
campaignSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Campaign", campaignSchema);
