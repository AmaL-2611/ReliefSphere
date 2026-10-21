const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Static paths MUST come before parameterized paths

// Donor — static routes
router.post("/direct", protect, donationController.createDirectDonation);
router.post("/ai-parse", protect, donationController.parseDescriptionWithAi);
router.post("/", protect, upload.single("image"), donationController.createDonation);
router.get("/my", protect, donationController.getMyDonations);

// Organization — static routes
router.get("/org/incoming", protect, donationController.getIncomingDonations);

// Admin — static routes
router.get("/admin/all", protect, adminOnly, donationController.getAllDonations);
router.post("/admin/:id/rematch", protect, adminOnly, donationController.runMatch);

// Parameterized routes — must come AFTER all static routes
router.get("/:id/receipt", protect, donationController.downloadReceipt);
router.get("/:id/recommendations", protect, donationController.getDonationRecommendations);
router.post("/:id/allocate", protect, donationController.allocateDonation);
router.get("/:id", protect, donationController.getDonationById);
router.delete("/:id", protect, donationController.deleteDonation);
router.patch("/:id/cancel", protect, donationController.cancelDonation);
router.post("/:id/accept", protect, donationController.acceptDonation);
router.post("/:id/reject", protect, donationController.rejectDonation);

module.exports = router;
