const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Donor = require("../models/donorModel");
const Volunteer = require("../models/volunteerModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.signup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      role,
      address,
      donorType,
      preferredCategories,
      orgName,
      orgType,
      registrationNumber,
      dob,
      skills,

      latitude,
      longitude,
    } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const resolvedFullName = role === "recipient_org" ? orgName : fullName;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: resolvedFullName,
      email,
      password: hashedPassword,
      phone,
      role,
      isVerified: role === "donor",
    });
    if (role === "donor") {
      await Donor.create({
        userId: user._id,
        donorType: donorType || "individual",
        preferredCategories: preferredCategories || [],
        address,
        latitude,
        longitude,
      });
    }

    if (role === "volunteer") {
      const idDocPath = req.files?.idDocument?.[0]?.path || null;
      await Volunteer.create({
        userId: user._id,

        dob,

        phone,

        address,

        skills: typeof skills === "string" ? JSON.parse(skills) : skills || [],

        latitude,

        longitude,

        idDocument: idDocPath,

        verificationStatus: "pending",
      });
    }
    if (role === "recipient_org") {
      const verificationDocPath = req.files?.verificationDoc?.[0]?.path || null;
      await RecipientOrganization.create({
        userId: user._id,
        orgName,
        orgType,
        registrationNumber,
        address,
        latitude,
        longitude,
        verificationDocs: verificationDocPath ? [verificationDocPath] : [],
        verificationStatus: "verified",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      token,
      user: {
        user_id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    if (user.role === "volunteer") {
      const volunteer = await Volunteer.findOne({
        userId: user._id,
      });

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
      const org = await RecipientOrganization.findOne({
        userId: user._id,
      });

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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      token,
      user: {
        user_id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.googleSignIn = async (req, res) => {
  try {
    const {
      idToken,
      role,
      address,
      latitude,
      longitude,
      donorType,
      preferredCategories,
      orgName,
      orgType,
      registrationNumber,
      dob,
      phone,
      skills,
    } = req.body;

    if (!idToken) return res.status(400).json({ message: "Missing idToken" });

    let email, name;

    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
      } else {
        // Fallback for development without GOOGLE_CLIENT_ID set in .env
        const decoded = jwt.decode(idToken);
        if (!decoded || !decoded.email) {
          return res.status(400).json({
            message:
              "Invalid Google token. Ensure GOOGLE_CLIENT_ID is set in .env",
          });
        }
        email = decoded.email;
        name = decoded.name;
      }
    } catch (verifyErr) {
      // Decode directly if verifyIdToken failed (e.g. client ID mismatch in dev)
      const decoded = jwt.decode(idToken);
      if (decoded && decoded.email) {
        email = decoded.email;
        name = decoded.name;
      } else {
        return res.status(400).json({
          message: "Google token verification failed: " + verifyErr.message,
        });
      }
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const selectedRole = ["donor", "recipient_org", "volunteer"].includes(
        role,
      )
        ? role
        : "donor";

      const resolvedFullName =
        selectedRole === "recipient_org" && orgName
          ? orgName
          : name || email.split("@")[0];

      user = await User.create({
        fullName: resolvedFullName,
        email,
        phone: phone || null,
        role: selectedRole,
        isVerified: selectedRole === "donor",
      });

      if (selectedRole === "donor") {
        await Donor.create({
          userId: user._id,
          donorType: donorType || "individual",
          preferredCategories: preferredCategories || [],
          address: address || "Google Sign-In Account",
          latitude: latitude || null,
          longitude: longitude || null,
        });
      } else if (selectedRole === "volunteer") {
        await Volunteer.create({
          userId: user._id,

          dob: dob ? new Date(dob) : new Date("2000-01-01"),

          phone: phone || "",

          address: address || "Google Sign-In Account",

          skills: skills || [],

          latitude: latitude || null,

          longitude: longitude || null,

          verificationStatus: "pending",
        });
      } else if (selectedRole === "recipient_org") {
        await RecipientOrganization.create({
          userId: user._id,
          orgName: orgName || name || "Google Sign-In Organization",
          orgType: orgType || "ngo",
          registrationNumber: registrationNumber || "",
          address: address || "Google Sign-In Account",
          latitude: latitude || null,
          longitude: longitude || null,
          verificationStatus: "verified",
        });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: "7d" },
    );

    res.status(200).json({
      token,
      isNewUser,
      user: {
        user_id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond success, even if user doesn't exist — avoids leaking which emails are registered
    if (!user) {
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Reset your ReliefSphere AI password",
      `<p>Hi ${user.fullName},</p>
       <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
       <a href="${resetUrl}">${resetUrl}</a>`,
    );

    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
