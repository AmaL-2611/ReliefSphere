/**
 * ReliefSphere AI — Demo Seed Script
 * ==================================
 * Creates a verified test organization and a test donor with realistic
 * requirements and donations to make demonstrating the smart matching system
 * instantaneous and reliable.
 *
 * Credentials created:
 *   - Organization:  org.demo@reliefsphere.org   / Password123
 *   - Donor:         donor.demo@reliefsphere.org / Password123
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/userModel");
const Donor = require("../models/donorModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const Requirement = require("../models/requirementModel");
const Donation = require("../models/donationModel");

async function seed() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/reliefsphere";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const hashedPassword = await bcrypt.hash("Password123", 10);

  // 1. Create or Find Verified Organization User
  let orgUser = await User.findOne({ email: "org.demo@reliefsphere.org" });
  if (!orgUser) {
    orgUser = await User.create({
      fullName: "Kerala Care Relief Trust",
      email: "org.demo@reliefsphere.org",
      password: hashedPassword,
      phone: "+91 98470 12345",
      role: "recipient_org",
      isVerified: true,
    });
    console.log("✔ Created Demo Organization User: org.demo@reliefsphere.org");
  }

  let orgProfile = await RecipientOrganization.findOne({ userId: orgUser._id });
  if (!orgProfile) {
    orgProfile = await RecipientOrganization.create({
      userId: orgUser._id,
      orgName: "Kerala Care Relief Trust",
      orgType: "ngo",
      registrationNumber: "REG-KL-2024-897",
      address: "Marine Drive, Kochi, Kerala",
      latitude: 9.9816,
      longitude: 76.2799,
      verificationStatus: "verified",
    });
    console.log("✔ Created Demo Organization Profile (Verified)");
  } else {
    orgProfile.verificationStatus = "verified";
    orgProfile.latitude = 9.9816;
    orgProfile.longitude = 76.2799;
    await orgProfile.save();
  }

  // 2. Create or Find Demo Donor
  let donorUser = await User.findOne({ email: "donor.demo@reliefsphere.org" });
  if (!donorUser) {
    donorUser = await User.create({
      fullName: "Anita Menon",
      email: "donor.demo@reliefsphere.org",
      password: hashedPassword,
      phone: "+91 98765 43210",
      role: "donor",
      isVerified: true,
    });
    console.log("✔ Created Demo Donor User: donor.demo@reliefsphere.org");
  }

  let donorProfile = await Donor.findOne({ userId: donorUser._id });
  if (!donorProfile) {
    donorProfile = await Donor.create({
      userId: donorUser._id,
      donorType: "individual",
      address: "Kaloor, Kochi, Kerala",
      latitude: 9.9984,
      longitude: 76.2925,
      preferredCategories: ["food", "clothes"],
    });
    console.log("✔ Created Demo Donor Profile");
  }

  // 3. Create Sample Requirements for the Organization
  const existingReq = await Requirement.findOne({
    organizationId: orgProfile._id,
    title: "Emergency Flood Kitchen Grocery Kits",
  });

  if (!existingReq) {
    await Requirement.create({
      organizationId: orgProfile._id,
      postedBy: orgUser._id,
      category: "food",
      title: "Emergency Flood Kitchen Grocery Kits",
      description: "Dry food kits containing rice, lentils, and cooking oil for 50 displaced families in relief camps.",
      quantity: 50,
      fulfilledQuantity: 0,
      unit: "Packets",
      urgency: "critical",
      location: "Marine Drive Community Relief Center, Kochi",
      latitude: 9.9816,
      longitude: 76.2799,
      requiredBefore: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      status: "open",
    });
    console.log("✔ Created Open Requirement: 'Emergency Flood Kitchen Grocery Kits' (50 Packets, Critical Urgency)");
  }

  const existingReqClothes = await Requirement.findOne({
    organizationId: orgProfile._id,
    title: "Warm Blankets for Coastal Shelter",
  });

  if (!existingReqClothes) {
    await Requirement.create({
      organizationId: orgProfile._id,
      postedBy: orgUser._id,
      category: "clothes",
      title: "Warm Blankets for Coastal Shelter",
      description: "Winter blankets and bedsheets for night shelter residents.",
      quantity: 40,
      fulfilledQuantity: 0,
      unit: "Pieces",
      urgency: "high",
      location: "Fort Kochi Coastal Camp",
      latitude: 9.9656,
      longitude: 76.2421,
      requiredBefore: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "open",
    });
    console.log("✔ Created Open Requirement: 'Warm Blankets for Coastal Shelter' (40 Pieces, High Urgency)");
  }

  console.log("\n=======================================================");
  console.log("  DEMO SEEDING COMPLETE!");
  console.log("=======================================================");
  console.log("You can log in with either account:");
  console.log("  Donor:        donor.demo@reliefsphere.org / Password123");
  console.log("  Organization: org.demo@reliefsphere.org   / Password123");
  console.log("=======================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
