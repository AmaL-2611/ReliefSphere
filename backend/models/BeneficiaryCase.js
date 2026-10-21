const mongoose = require("mongoose");

const neededItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["food", "clothes", "clothing", "books", "education", "medicine", "medical", "essentials", "shelter", "hygiene", "other"],
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantityNeeded: {
      type: Number,
      required: true,
      min: 1,
    },
    quantityDistributed: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: "Items",
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
  },
  { _id: true }
);

const supportingEvidenceSchema = new mongoose.Schema(
  {
    evidenceType: {
      type: String,
      enum: ["field_photo", "assessment_form", "assessment_document", "community_leader_letter", "ration_card_copy", "other"],
      default: "field_photo",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const followUpNoteSchema = new mongoose.Schema(
  {
    noteDate: {
      type: Date,
      default: Date.now,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    findings: {
      type: String,
      required: true,
    },
    actionTaken: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const beneficiaryCaseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipientOrganization",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    requestSource: {
      type: String,
      enum: ["household_reported", "community_referral", "ngo_field_assessment"],
      required: true,
      default: "ngo_field_assessment",
    },
    beneficiaryType: {
      type: String,
      enum: ["individual", "household"],
      default: "household",
    },
    headOfHouseholdName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      default: "",
    },
    householdSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    vulnerableMembers: {
      children: { type: Number, default: 0, min: 0 },
      elderly: { type: Number, default: 0, min: 0 },
      disabled: { type: Number, default: 0, min: 0 },
      pregnantOrLactating: { type: Number, default: 0, min: 0 },
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    assessmentRationale: {
      type: String,
      default: "",
    },
    assessmentNotes: {
      type: String,
      default: "",
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
    },
    neededItems: [neededItemSchema],
    supportingEvidence: [supportingEvidenceSchema],
    status: {
      type: String,
      enum: [
        "draft",
        "pending_review",
        "additional_info_required",
        "verified",
        "rejected",
        "assistance_in_progress",
        "follow_up_required",
        "closed",
      ],
      default: "pending_review",
      index: true,
    },
    verificationDetails: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      decision: {
        type: String,
        enum: ["approved", "rejected", "additional_info_required", null],
        default: null,
      },
      decisionNotes: {
        type: String,
        default: "",
      },
      rejectionReason: {
        type: String,
        default: "",
      },
    },
    statusHistory: [statusHistorySchema],
    linkedRequirements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Requirement",
      },
    ],
    linkedDonations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donation",
      },
    ],
    linkedDeliveries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Delivery",
      },
    ],
    followUpNotes: [followUpNoteSchema],
    closureDetails: {
      closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      closedAt: {
        type: Date,
        default: null,
      },
      closureReason: {
        type: String,
        default: "",
      },
      unmetNeedsRationale: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BeneficiaryCase", beneficiaryCaseSchema);
