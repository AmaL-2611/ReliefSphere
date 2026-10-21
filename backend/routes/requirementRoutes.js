const express = require("express");
const router = express.Router();
const requirementController = require("../controllers/requirementController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Static paths MUST come before parameterized paths

// Organization — manage their own requirements (static path — must be before /:id)
router.get("/org/my", protect, requirementController.getMyRequirements);

// Admin — view all & update status (static path — must be before /:id)
router.get("/admin/all", protect, adminOnly, requirementController.getAllRequirements);

// Public — browse open requirements
router.get("/", protect, requirementController.getRequirements);

// Create requirement (organization)
router.post("/", protect, requirementController.createRequirement);

// Parameterized routes — must come AFTER static routes
router.get("/:id/recommendations", protect, requirementController.getRequirementRecommendations);
router.post("/:id/match-donation/:donationId", protect, requirementController.matchDonationForRequirement);
router.get("/:id", protect, requirementController.getRequirementById);
router.put("/:id", protect, requirementController.updateRequirement);
router.delete("/:id", protect, requirementController.deleteRequirement);
router.patch("/:id/status", protect, adminOnly, requirementController.updateRequirementStatus);

module.exports = router;
