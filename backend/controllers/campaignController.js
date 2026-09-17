const Campaign = require("../models/campaignModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const Donation = require("../models/donationModel");
const Donor = require("../models/donorModel");
const User = require("../models/userModel");
const { createNotification } = require("../utils/aiMatcher");

/* ─── CREATE HUMANITARIAN CAMPAIGN (Community Shelter ONLY) ─── */
exports.createCampaign = async (req, res) => {
  try {
    // 1. Verify organization eligibility
    if (req.user.role !== "recipient_org") {
      return res.status(403).json({
        success: false,
        message: "Only recipient organizations can create campaigns.",
      });
    }

    const org = await RecipientOrganization.findOne({ userId: req.user.id });
    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization profile not found.",
      });
    }

    // Business Rule: ONLY Community Shelters can create disaster relief campaigns
    const allowedOrgTypes = ["community_shelter"];
    if (!allowedOrgTypes.includes(org.orgType)) {
      return res.status(403).json({
        success: false,
        message:
          "Campaign creation is strictly restricted to Community Shelters for disaster relief response. Other organizations use the Requirement Module for daily needs.",
      });
    }

    const {
      title,
      disasterType,
      reliefGoal,
      category,
      description,
      targetBeneficiaries,
      affectedPeopleCount,
      affectedFamiliesCount,
      coordinatorName,
      coordinatorContact,
      distributionPlan,
      estimatedBudget,
      targetQuantity,
      location,
      startDate,
      endDate,
      urgency,
      isDraft,
    } = req.body;

    // Validation Rules
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Campaign Title is required." });
    }
    if (!disasterType) {
      return res.status(400).json({ success: false, message: "Disaster/Event Type is required." });
    }
    if (!reliefGoal) {
      return res.status(400).json({ success: false, message: "Relief Goal is required." });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: "Location is required." });
    }
    if (!coordinatorName || !coordinatorContact) {
      return res.status(400).json({ success: false, message: "Coordinator Name and Contact Number are required." });
    }

    const affectedPeople = Number(affectedPeopleCount) || 0;
    const affectedFamilies = Number(affectedFamiliesCount) || 0;
    if (affectedPeople <= 0) {
      return res.status(400).json({ success: false, message: "Affected People Count must be greater than 0." });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Campaign Start Date and End Date are required." });
    }

    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    const startD = new Date(startDate);
    const endD = new Date(endDate);

    if (startD < todayZero) {
      return res.status(400).json({ success: false, message: "Campaign Start Date cannot be in the past." });
    }
    if (endD < startD) {
      return res.status(400).json({ success: false, message: "Campaign End Date must be on or after Start Date." });
    }

    // Process uploaded files
    let coverImage = "";
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      coverImage = req.files.coverImage[0].path.replace(/\\/g, "/");
    } else if (req.body.coverImage) {
      coverImage = req.body.coverImage;
    }

    let evidenceFiles = [];
    if (req.files && req.files.evidenceFiles && req.files.evidenceFiles.length > 0) {
      evidenceFiles = req.files.evidenceFiles.map((f) =>
        f.path.replace(/\\/g, "/")
      );
    } else if (req.body.evidenceFiles) {
      evidenceFiles = Array.isArray(req.body.evidenceFiles)
        ? req.body.evidenceFiles
        : [req.body.evidenceFiles];
    }

    // Validation: At least one supporting document required for final submission
    const isSavingDraft = String(isDraft) === "true";
    if (!isSavingDraft && evidenceFiles.length === 0 && !coverImage) {
      return res.status(400).json({
        success: false,
        message: "At least one supporting document or evidence file is required for campaign submission.",
      });
    }

    const targetStatus = isSavingDraft ? "DRAFT" : "PENDING_APPROVAL";

    const campaign = await Campaign.create({
      title,
      disasterType,
      reliefGoal,
      category: category || disasterType || "Disaster Response",
      description: description || "",
      targetBeneficiaries: targetBeneficiaries || `${affectedFamilies} families (${affectedPeople} people)`,
      affectedPeopleCount: affectedPeople,
      affectedFamiliesCount: affectedFamilies,
      coordinatorName: coordinatorName || "",
      coordinatorContact: coordinatorContact || "",
      distributionPlan: distributionPlan || "",
      estimatedBudget: Number(estimatedBudget) || 0,
      targetQuantity: Number(targetQuantity) || 0,
      location,
      startDate,
      endDate,
      urgency: urgency || "High",
      coverImage,
      evidenceFiles,
      organizationId: org._id,
      createdBy: req.user.id,
      status: targetStatus,
    });

    const populatedCampaign = await Campaign.findById(campaign._id)
      .populate("organizationId", "orgName orgType address registrationNumber")
      .populate("createdBy", "fullName email");

    res.status(201).json({
      success: true,
      message: isSavingDraft
        ? "Campaign saved as Draft."
        : "Humanitarian Relief Campaign submitted successfully! Pending Admin verification.",
      campaign: populatedCampaign,
    });
  } catch (err) {
    console.error("Create Campaign Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── GET PUBLIC ACTIVE CAMPAIGNS (Donor side) ─── */
exports.getPublicCampaigns = async (req, res) => {
  try {
    const { disasterType, reliefGoal, search } = req.query;

    const query = { status: { $in: ["APPROVED", "ACTIVE"] } };

    if (disasterType && disasterType !== "All") {
      query.disasterType = disasterType;
    }

    if (reliefGoal && reliefGoal !== "All") {
      query.reliefGoal = reliefGoal;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { coordinatorName: { $regex: search, $options: "i" } },
      ];
    }

    const campaigns = await Campaign.find(query)
      .populate("organizationId", "orgName orgType address registrationNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      campaigns,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── GET MY CAMPAIGNS (Organization side) ─── */
exports.getMyCampaigns = async (req, res) => {
  try {
    const org = await RecipientOrganization.findOne({ userId: req.user.id });
    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization profile not found.",
      });
    }

    const campaigns = await Campaign.find({ organizationId: org._id })
      .populate("organizationId", "orgName orgType address")
      .sort({ createdAt: -1 });

    const now = new Date();
    const stats = {
      total: campaigns.length,
      draft: campaigns.filter((c) => c.status === "DRAFT").length,
      pending: campaigns.filter((c) => c.status === "PENDING_APPROVAL").length,
      active: campaigns.filter(
        (c) =>
          (c.status === "APPROVED" || c.status === "ACTIVE") &&
          now >= new Date(c.startDate) &&
          now <= new Date(c.endDate)
      ).length,
      completed: campaigns.filter((c) => c.status === "COMPLETED").length,
      rejected: campaigns.filter((c) => c.status === "REJECTED").length,
    };

    res.status(200).json({
      success: true,
      campaigns,
      stats,
      orgType: org.orgType,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── GET ORGANIZATION CAMPAIGN STATS ─── */
exports.getOrgCampaignStats = async (req, res) => {
  try {
    const org = await RecipientOrganization.findOne({ userId: req.user.id });
    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization profile not found.",
      });
    }

    const campaigns = await Campaign.find({ organizationId: org._id });
    const campaignIds = campaigns.map((c) => c._id);

    const donations = await Donation.find({
      campaignId: { $in: campaignIds },
    });

    const now = new Date();

    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(
        (c) =>
          (c.status === "APPROVED" || c.status === "ACTIVE") &&
          now >= new Date(c.startDate) &&
          now <= new Date(c.endDate)
      ).length,
      completedCampaigns: campaigns.filter((c) => c.status === "COMPLETED").length,
      totalDonationsReceived: donations.length,
    };

    res.status(200).json({
      success: true,
      stats,
      orgType: org.orgType,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── GET ALL CAMPAIGNS (Admin & General read) ─── */
exports.getCampaigns = async (req, res) => {
  try {
    const { status, disasterType } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (disasterType && disasterType !== "all") {
      query.disasterType = disasterType;
    }

    const campaigns = await Campaign.find(query)
      .populate("organizationId", "orgName orgType address registrationNumber")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    const now = new Date();
    const stats = {
      total: campaigns.length,
      draft: campaigns.filter((c) => c.status === "DRAFT").length,
      pending: campaigns.filter((c) => c.status === "PENDING_APPROVAL").length,
      approved: campaigns.filter((c) => c.status === "APPROVED" || c.status === "ACTIVE").length,
      rejected: campaigns.filter((c) => c.status === "REJECTED").length,
      completed: campaigns.filter((c) => c.status === "COMPLETED").length,
      active: campaigns.filter(
        (c) =>
          (c.status === "APPROVED" || c.status === "ACTIVE") &&
          now >= new Date(c.startDate) &&
          now <= new Date(c.endDate)
      ).length,
    };

    res.status(200).json({
      success: true,
      campaigns,
      stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── GET SINGLE CAMPAIGN BY ID ─── */
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("organizationId", "orgName orgType address registrationNumber")
      .populate("createdBy", "fullName email");

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const donations = await Donation.find({ campaignId: campaign._id })
      .populate("donorId")
      .populate("postedBy", "fullName email");

    res.status(200).json({ success: true, campaign, donations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── UPDATE CAMPAIGN STATUS (Admin Only) ─── */
exports.updateCampaignStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const validStatuses = [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "ACTIVE",
      "REJECTED",
      "COMPLETED",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    campaign.status = status;
    if (rejectionReason !== undefined) {
      campaign.rejectionReason = rejectionReason;
    }

    await campaign.save();

    const updatedCampaign = await Campaign.findById(campaign._id)
      .populate("organizationId", "orgName orgType address registrationNumber")
      .populate("createdBy", "fullName email");

    res.status(200).json({
      success: true,
      message: `Campaign status updated to ${status}.`,
      campaign: updatedCampaign,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── MARK CAMPAIGN COMPLETED (Organization or Admin) ─── */
exports.markCampaignCompleted = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    if (req.user.role === "recipient_org") {
      const org = await RecipientOrganization.findOne({ userId: req.user.id });
      if (!org || String(campaign.organizationId) !== String(org._id)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to manage this campaign.",
        });
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    campaign.status = "COMPLETED";
    await campaign.save();

    res.status(200).json({
      success: true,
      message: "Campaign marked as COMPLETED!",
      campaign,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─── DONATE RESOURCES TO CAMPAIGN (Donor side) ─── */
exports.donateToCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const {
      donationName,
      category,
      quantity,
      unit,
      pickupAddress,
      contactNumber,
      notes,
      image,
    } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    if (campaign.status !== "APPROVED" && campaign.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Donations are only accepted for active approved campaigns.",
      });
    }

    const donor = await Donor.findOne({ userId: req.user.id });
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor profile not found.",
      });
    }

    const qty = Number(quantity) || 1;

    const donation = await Donation.create({
      donorId: donor._id,
      postedBy: req.user.id,
      category: (category || campaign.reliefGoal || "essentials")
        .toLowerCase()
        .includes("food")
        ? "food"
        : (category || "").toLowerCase().includes("cloth") || (category || "").toLowerCase().includes("blanket")
        ? "clothes"
        : (category || "").toLowerCase().includes("book") || (category || "").toLowerCase().includes("school")
        ? "books"
        : (category || "").toLowerCase().includes("med")
        ? "medicine"
        : "essentials",
      donationName: donationName || `Relief Donation for ${campaign.title}`,
      quantity: qty,
      unit: unit || "Packets",
      pickupAddress: pickupAddress || donor.address || "Not specified",
      contactNumber: contactNumber || req.user.phone || "",
      notes: notes || "",
      image: image || "",
      campaignId: campaign._id,
      organizationId: campaign.organizationId,
      matchedOrganization: campaign.organizationId,
      status: "pending",
    });

    // Notify all Admin users to assign a volunteer for pickup
    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "📦 New Donation Pledged - Assign Volunteer",
          `A donor pledged ${qty} ${unit || "units"} for campaign "${campaign.title}". Please assign a volunteer for pickup.`,
          "donation",
          donation._id,
          "Donation"
        );
      }
    } catch (notifErr) {
      console.error("Admin notification error:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Relief donation pledged successfully! Pending volunteer pickup assignment.",
      donation,
      campaign,
    });
  } catch (err) {
    console.error("Donate to Campaign Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
