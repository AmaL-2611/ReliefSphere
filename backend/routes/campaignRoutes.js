const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Public / Donor Read Routes
router.get("/public", campaignController.getPublicCampaigns);

// Organization Specific Routes (Must be logged in)
router.get("/my", protect, campaignController.getMyCampaigns);
router.get("/org-stats", protect, campaignController.getOrgCampaignStats);

// Create Campaign (NGO & Community Shelter ONLY, with file upload support)
router.post(
  "/",
  protect,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "evidenceFiles", maxCount: 5 },
  ]),
  campaignController.createCampaign
);

// Donor Donate to Campaign
router.post("/:campaignId/donate", protect, campaignController.donateToCampaign);

// Mark Campaign Completed (Owner Organization or Admin)
router.patch("/:id/complete", protect, campaignController.markCampaignCompleted);

// Admin Operations
router.get("/", protect, adminOnly, campaignController.getCampaigns);
router.patch("/:id/status", protect, adminOnly, campaignController.updateCampaignStatus);

// Single Campaign Details
router.get("/:id", campaignController.getCampaignById);

module.exports = router;
