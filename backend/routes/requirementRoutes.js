const express = require("express");
const router = express.Router();
const requirementController = require("../controllers/requirementController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public — browse open requirements (donors can see)
router.get("/", protect, requirementController.getRequirements);
router.get("/:id", protect, requirementController.getRequirementById);

// Organization — manage their own requirements
router.post("/", protect, requirementController.createRequirement);
router.get("/org/my", protect, requirementController.getMyRequirements);
router.put("/:id", protect, requirementController.updateRequirement);
router.delete("/:id", protect, requirementController.deleteRequirement);

// Admin — view all & update status
router.get("/admin/all", protect, adminOnly, requirementController.getAllRequirements);
router.patch("/:id/status", protect, adminOnly, requirementController.updateRequirementStatus);

module.exports = router;
