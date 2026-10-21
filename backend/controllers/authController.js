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
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const resolvedFullName = role === "recipient_org" ? orgName : fullName;

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: resolvedFullName,
      email: normalizedEmail,
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
        verificationStatus: "pending",
      });
    }

    // Only donors receive a login token immediately.
    // Volunteers and organizations must await admin approval before logging in.
    if (role === "donor") {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );
      return res.status(201).json({
        token,
        user: {
          user_id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Org / volunteer: registration successful but no token — must await admin approval
    return res.status(201).json({
      message:
        role === "recipient_org"
          ? "Organization registered successfully. Awaiting admin approval."
          : "Volunteer registered successfully. Awaiting admin approval.",
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
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !user.password) return res.status(400).json({ message: "Invalid credentials" });

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

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        message: "Google Sign-In is not configured on this server. Please use email/password login.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error." });
    }

    let email, name;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return res.status(400).json({ message: "Invalid Google token payload." });
      }
      if (!payload.email_verified) {
        return res.status(400).json({ message: "Google account email is not verified." });
      }

      email = payload.email.toLowerCase().trim();
      name = payload.name;
    } catch (verifyErr) {
      return res.status(400).json({
        message: "Google token verification failed. Please try again.",
      });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const selectedRole = ["donor", "recipient_org", "volunteer"].includes(role)
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
        // Only donors are immediately verified; orgs and volunteers need admin approval
        isVerified: selectedRole === "donor",
      });

      if (selectedRole === "donor") {
        await Donor.create({
          userId: user._id,
          donorType: donorType || "individual",
          preferredCategories: preferredCategories || [],
          address: address || "",
          latitude: latitude || null,
          longitude: longitude || null,
        });
      } else if (selectedRole === "volunteer") {
        await Volunteer.create({
          userId: user._id,
          dob: dob ? new Date(dob) : new Date("2000-01-01"),
          phone: phone || "",
          address: address || "",
          skills: skills || [],
          latitude: latitude || null,
          longitude: longitude || null,
          verificationStatus: "pending",
        });
      } else if (selectedRole === "recipient_org") {
        // Organizations registered via Google still require admin approval
        await RecipientOrganization.create({
          userId: user._id,
          orgName: orgName || name || "Organization",
          orgType: orgType || "ngo",
          registrationNumber: registrationNumber || "",
          address: address || "",
          latitude: latitude || null,
          longitude: longitude || null,
          verificationStatus: "pending",
        });
      }

      // New non-donor users must await approval — return without a token
      if (selectedRole !== "donor") {
        return res.status(201).json({
          isNewUser: true,
          message:
            selectedRole === "recipient_org"
              ? "Organization registered via Google. Awaiting admin approval."
              : "Volunteer registered via Google. Awaiting admin approval.",
          user: {
            user_id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
        });
      }
    } else {
      // Existing user — enforce approval status
      if (user.role === "volunteer") {
        const volunteer = await Volunteer.findOne({ userId: user._id });
        if (volunteer && volunteer.verificationStatus === "pending") {
          return res.status(403).json({ message: "Your volunteer account is awaiting admin approval." });
        }
        if (volunteer && volunteer.verificationStatus === "rejected") {
          return res.status(403).json({ message: "Your volunteer registration was rejected." });
        }
      }
      if (user.role === "recipient_org") {
        const org = await RecipientOrganization.findOne({ userId: user._id });
        if (org && org.verificationStatus === "pending") {
          return res.status(403).json({ message: "Your organization is awaiting admin approval." });
        }
        if (org && org.verificationStatus === "rejected") {
          return res.status(403).json({ message: "Your organization registration was rejected." });
        }
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
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
    if (!email) {
      return res.status(400).json({ message: "Email address is required." });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

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

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    try {
      await sendEmail(
        user.email,
        "Reset your ReliefSphere password",
        `<p>Hi ${user.fullName},</p>
         <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
         <a href="${resetUrl}">${resetUrl}</a>`,
      );
    } catch (emailErr) {
      console.error("Password reset email failed:", emailErr.message);
      // Token is already saved — we respond success but log the failure
    }

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

exports.checkAvailability = async (req, res) => {
  try {
    const { field, value } = req.body;
    if (!field || !value) {
      return res.status(400).json({ available: true });
    }

    const trimmedValue = value.trim();

    if (field === "email") {
      const existingUser = await User.findOne({
        email: { $regex: new RegExp(`^${trimmedValue}$`, "i") },
      });
      if (existingUser) {
        return res.status(200).json({
          available: false,
          message: "This email address is already registered.",
        });
      }
    } else if (field === "phone") {
      const existingUser = await User.findOne({ phone: trimmedValue });
      if (existingUser) {
        return res.status(200).json({
          available: false,
          message: "This phone number is already registered.",
        });
      }
    } else if (field === "registrationNumber") {
      const existingOrg = await RecipientOrganization.findOne({
        registrationNumber: trimmedValue,
      });
      if (existingOrg) {
        return res.status(200).json({
          available: false,
          message: "This registration number is already registered.",
        });
      }
    }

    return res.status(200).json({ available: true, message: "Available" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

