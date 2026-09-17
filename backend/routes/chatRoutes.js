const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.post("/messages", protect, chatController.sendMessage);
router.get("/conversations", protect, chatController.getUserConversations);
router.get("/messages/:conversationId", protect, chatController.getConversationMessages);
router.patch("/read/:conversationId", protect, chatController.markAsRead);

module.exports = router;
