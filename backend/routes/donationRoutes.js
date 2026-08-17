const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Donor routes
router.post("/direct", protect, donationController.createDirectDonation);
router.post("/", protect, upload.single("image"), donationController.createDonation);
router.get("/my", protect, donationController.getMyDonations);

// Organization routes
router.get("/org/incoming", protect, donationController.getIncomingDonations);
router.post("/:id/accept", protect, donationController.acceptDonation);
router.post("/:id/reject", protect, donationController.rejectDonation);

// General & Parameter routes
router.get("/:id", protect, donationController.getDonationById);
router.delete("/:id", protect, donationController.deleteDonation);
router.patch("/:id/cancel", protect, donationController.cancelDonation);

// Admin routes
router.get("/admin/all", protect, adminOnly, donationController.getAllDonations);
router.post("/admin/:id/rematch", protect, adminOnly, donationController.runAIMatch);

module.exports = router;
