const Notification = require("../models/notificationModel");

/* ─── Get User Notifications ─── */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Mark Single Notification as Read ─── */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found." });
    res.json({ message: "Marked as read.", notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Mark All Notifications as Read ─── */
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Delete Read Notifications ─── */
exports.clearReadNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id, isRead: true });
    res.json({ message: "Read notifications cleared." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
