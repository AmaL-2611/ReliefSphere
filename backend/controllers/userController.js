const User = require("../models/userModel");
const Donor = require("../models/donorModel");
const Volunteer = require("../models/volunteerModel");
const RecipientOrganization = require("../models/RecipientOrganization");

/* ===========================
   GET MY PROFILE
=========================== */
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) return res.status(404).json({ message: "User not found" });

    let roleDetails = null;

    if (user.role === "donor") {
      roleDetails = await Donor.findOne({ userId: user._id });
    } else if (user.role === "volunteer") {
      roleDetails = await Volunteer.findOne({ userId: user._id });
    } else if (user.role === "recipient_org") {
      roleDetails = await RecipientOrganization.findOne({ userId: user._id });
    }

    res.json({ user, roleDetails });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   UPDATE MY PROFILE
=========================== */
exports.updateMyProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        user_id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   UPLOAD AVATAR
=========================== */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const avatarPath = req.file.path.replace(/\\/g, "/");

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.avatar = avatarPath;
    await user.save();

    res.json({
      message: "Avatar uploaded successfully",
      avatar: avatarPath,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
