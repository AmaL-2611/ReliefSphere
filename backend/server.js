const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// ── Routes ──
const authRoutes         = require("./routes/authRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const userRoutes         = require("./routes/userRoutes");
const requirementRoutes  = require("./routes/requirementRoutes");
const donationRoutes     = require("./routes/donationRoutes");
const deliveryRoutes     = require("./routes/deliveryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── API Endpoints ──
app.use("/api/auth",          authRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/user",          userRoutes);
app.use("/api/requirements",  requirementRoutes);
app.use("/api/donations",     donationRoutes);
app.use("/api/deliveries",    deliveryRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Static Files ──
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ ReliefSphere Server running on port ${PORT}`));
