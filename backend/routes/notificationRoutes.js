const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // all notification routes require login

router.get("/", notificationController.getNotifications);
// Static paths MUST come before parameterized paths to avoid mismatches
router.patch("/mark-all-read", notificationController.markAllRead);
router.delete("/clear", notificationController.clearReadNotifications);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
