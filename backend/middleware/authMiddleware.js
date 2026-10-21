const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Volunteer = require("../models/volunteerModel");
const RecipientOrganization = require("../models/RecipientOrganization");

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized. Token missing.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("FATAL: JWT_SECRET is not set in environment variables.");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Enforce approval checks for volunteers and organizations on every protected request
    if (user.role === "volunteer") {
      const volunteer = await Volunteer.findOne({ userId: user._id });
      if (volunteer && volunteer.verificationStatus === "pending") {
        return res.status(403).json({
          message: "Your volunteer account is awaiting admin approval.",
        });
      }
      if (volunteer && volunteer.verificationStatus === "rejected") {
        return res.status(403).json({
          message: "Your volunteer registration was rejected.",
        });
      }
    }

    if (user.role === "recipient_org") {
      const org = await RecipientOrganization.findOne({ userId: user._id });
      if (org && org.verificationStatus === "pending") {
        return res.status(403).json({
          message: "Your organization is awaiting admin approval.",
        });
      }
      if (org && org.verificationStatus === "rejected") {
        return res.status(403).json({
          message: "Your organization registration was rejected.",
        });
      }
    }

    req.user = user;

    next();
  } catch (err) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access only",
    });
  }

  next();
};
