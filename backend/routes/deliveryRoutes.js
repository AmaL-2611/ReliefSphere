const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Volunteer routes
router.get("/my", protect, deliveryController.getMyDeliveries);
router.patch("/:id/pickup", protect, deliveryController.markPickedUp);
router.patch("/:id/deliver", protect, deliveryController.markDelivered);
router.post("/:id/proof", protect, upload.array("proofImages", 5), deliveryController.uploadProof);

// Admin routes
router.get("/admin/all", protect, adminOnly, deliveryController.getAllDeliveries);
router.post("/admin/assign", protect, adminOnly, deliveryController.assignVolunteer);

module.exports = router;
