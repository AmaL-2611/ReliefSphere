const mongoose = require("mongoose");

const assistanceDistributionSchema = new mongoose.Schema(
  {
    distributionReference: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    beneficiaryCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BeneficiaryCase",
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipientOrganization",
      required: true,
      index: true,
    },
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
    quantityDistributed: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
    },
    distributionDate: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relatedDonationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      default: null,
    },
    relatedDeliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      default: null,
    },
    relatedRequirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      default: null,
    },
    distributionMethod: {
      type: String,
      enum: ["direct_ngo_handover", "doorstep_delivery", "relief_camp_distribution"],
      default: "direct_ngo_handover",
    },
    recipientAcknowledgement: {
      recipientName: {
        type: String,
        default: "",
      },
      relationshipToHead: {
        type: String,
        default: "Self",
      },
      acknowledgementType: {
        type: String,
        enum: ["signature", "thumbprint", "photo_proof", "sms_otp", "worker_attestation"],
        default: "worker_attestation",
      },
      proofUrl: {
        type: String,
        default: "",
      },
      notes: {
        type: String,
        default: "",
      },
    },
    confirmationStatus: {
      type: String,
      enum: ["confirmed", "pending_confirmation", "disputed"],
      default: "confirmed",
    },
    disputeNotes: {
      type: String,
      default: "",
    },
    disputedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    disputedAt: {
      type: Date,
      default: null,
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssistanceDistribution", assistanceDistributionSchema);
