const Message = require("../models/chatModel");
const User = require("../models/userModel");
const Donation = require("../models/donationModel");
const { createNotification } = require("../utils/resourceMatcher");

/* ─── Send Message ─── */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, message, donationId, deliveryId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message content cannot be empty." });
    }

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver user ID is required." });
    }

    // Resolve target User ID if receiverId is User, RecipientOrganization, or Donor ID
    let targetUserId = typeof receiverId === "object" ? receiverId._id || receiverId.userId || receiverId : receiverId;
    let receiver = await User.findById(targetUserId);

    if (!receiver) {
      const RecipientOrganization = require("../models/RecipientOrganization");
      const org = await RecipientOrganization.findById(targetUserId);
      if (org && org.userId) {
        targetUserId = org.userId;
        receiver = await User.findById(org.userId);
      }
    }

    if (!receiver) {
      const Donor = require("../models/donorModel");
      const donor = await Donor.findById(targetUserId);
      if (donor && donor.userId) {
        targetUserId = donor.userId;
        receiver = await User.findById(donor.userId);
      }
    }

    if (!receiver) {
      return res.status(404).json({ message: "Recipient user not found." });
    }

    const newMsg = await Message.create({
      conversationId: conversationId || `conv_${req.user._id}_${targetUserId}`,
      sender: req.user._id,
      receiver: targetUserId,
      message: message.trim(),
      donationId: donationId || null,
      deliveryId: deliveryId || null,
    });

    const populatedMsg = await Message.findById(newMsg._id)
      .populate("sender", "fullName email role")
      .populate("receiver", "fullName email role");

    // Send system notification to receiver
    const senderName = req.user.fullName || "User";
    await createNotification(
      targetUserId,
      "💬 New Logistics Message",
      `${senderName}: "${message.length > 50 ? message.substring(0, 50) + "..." : message}"`,
      "system",
      newMsg._id,
      "Message"
    );

    res.status(201).json({ success: true, message: populatedMsg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get Messages by Conversation ID / Donation ID ─── */
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .populate("sender", "fullName email role")
      .populate("receiver", "fullName email role")
      .sort({ createdAt: 1 });

    // Mark unread messages as read
    await Message.updateMany(
      { conversationId, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Get User's Active Conversations ─── */
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages involving user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "fullName email role")
      .populate("receiver", "fullName email role")
      .sort({ createdAt: -1 });

    // Group by conversationId
    const conversationsMap = {};

    messages.forEach((msg) => {
      if (!conversationsMap[msg.conversationId]) {
        const otherUser =
          msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;

        conversationsMap[msg.conversationId] = {
          conversationId: msg.conversationId,
          otherUser,
          lastMessage: msg.message,
          lastMessageDate: msg.createdAt,
          donationId: msg.donationId,
          deliveryId: msg.deliveryId,
          unreadCount: 0,
        };
      }

      if (msg.receiver._id.toString() === userId.toString() && !msg.read) {
        conversationsMap[msg.conversationId].unreadCount += 1;
      }
    });

    const conversations = Object.values(conversationsMap).sort(
      (a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate)
    );

    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Mark Conversation as Read ─── */
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      { conversationId, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: "Messages marked as read." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
