/**
 * ReliefSphere AI — Comprehensive Final Review Demonstration Data Seeder
 * =======================================================================
 * Populates a complete, realistic, interconnected dataset across all 4 user roles:
 *   1. Administrator: admin@reliefsphere.com / admin123
 *   2. Recipient Org (Community Shelter - Campaign Enabled): metro.shelter@reliefsphere.org / Password123
 *   3. Recipient Org (NGO - Beneficiary & Requirement Focused): keralacare@reliefsphere.org / Password123
 *   4. Pending Org (For Admin Verification Demo): greenvalley@charity.org / Password123
 *   5. Active Donor: anita.donor@reliefsphere.org / Password123
 *   6. Verified Volunteer: rohith.volunteer@reliefsphere.org / Password123
 *   7. Pending Volunteer (For Admin Verification Demo): arjun.volunteer@reliefsphere.org / Password123
 *
 * Populates:
 *   - 4 Active & Completed Disaster Campaigns (Food Kits, Medicines, Blankets, School Kits)
 *   - 3 Beneficiary Cases (Verified, Pending Review, Assistance In Progress)
 *   - 4 Open Requirements across categories (Food, Clothes, Medicine, Books)
 *   - Multiple Donations across states (Pending for matching demo, Matched, In-Transit, Delivered)
 *   - Active Deliveries assigned to volunteer with real GPS coordinates and proof notes
 *   - Verified Assistance Distribution for end-to-end audit traceability
 *
 * Usage:
 *   Local DB:  node scripts/seedFullReviewData.js
 *   Cloud DB:  node scripts/seedFullReviewData.js "mongodb+srv://user:pass@cluster.mongodb.net/reliefsphere"
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/userModel");
const Donor = require("../models/donorModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const Volunteer = require("../models/volunteerModel");
const Requirement = require("../models/requirementModel");
const Donation = require("../models/donationModel");
const Campaign = require("../models/campaignModel");
const Delivery = require("../models/deliveryModel");
const BeneficiaryCase = require("../models/BeneficiaryCase");
const AssistanceDistribution = require("../models/AssistanceDistribution");

async function seedData() {
  const targetUri =
    process.argv[2] ||
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/reliefsphere";

  console.log("\n=======================================================");
  console.log("  RELIEFSPHERE AI — FINAL REVIEW DEMO DATA SEEDER");
  console.log("=======================================================");
  console.log("Connecting to MongoDB target:", targetUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@"));

  await mongoose.connect(targetUri);
  console.log("Connected successfully to database.\n");

  const hashedPassword = await bcrypt.hash("Password123", 10);
  const adminHashedPassword = await bcrypt.hash("admin123", 10);

  // ─────────────────────────────────────────────────────────────
  // 1. SYSTEM ADMINISTRATOR
  // ─────────────────────────────────────────────────────────────
  let admin = await User.findOne({ email: "admin@reliefsphere.com" });
  if (!admin) {
    admin = await User.create({
      fullName: "Platform Administrator",
      email: "admin@reliefsphere.com",
      password: adminHashedPassword,
      phone: "+91 98400 00001",
      role: "admin",
      isVerified: true,
    });
    console.log("✔ Admin account created: admin@reliefsphere.com (Password: admin123)");
  } else {
    admin.password = adminHashedPassword;
    admin.isVerified = true;
    await admin.save();
    console.log("✔ Admin account verified & ready: admin@reliefsphere.com (Password: admin123)");
  }

  // ─────────────────────────────────────────────────────────────
  // 2. RECIPIENT ORGANIZATIONS
  // ─────────────────────────────────────────────────────────────
  // Org A: Community Shelter (Eligible to create Campaigns)
  let shelterUser = await User.findOne({ email: "metro.shelter@reliefsphere.org" });
  if (!shelterUser) {
    shelterUser = await User.create({
      fullName: "Metro Disaster Relief Shelter",
      email: "metro.shelter@reliefsphere.org",
      password: hashedPassword,
      phone: "+91 98471 11222",
      role: "recipient_org",
      isVerified: true,
    });
  }
  let shelterOrg = await RecipientOrganization.findOne({ userId: shelterUser._id });
  if (!shelterOrg) {
    shelterOrg = await RecipientOrganization.create({
      userId: shelterUser._id,
      orgName: "Metro Disaster Relief Shelter",
      orgType: "community_shelter",
      registrationNumber: "SHELTER-KL-2024-101",
      address: "Marine Drive Community Complex, Kochi, Kerala",
      latitude: 9.9816,
      longitude: 76.2799,
      verificationStatus: "verified",
      approvedBy: admin._id,
      approvedAt: new Date(),
    });
  } else {
    shelterOrg.verificationStatus = "verified";
    shelterOrg.orgType = "community_shelter";
    await shelterOrg.save();
  }
  console.log("✔ Verified Community Shelter created (Campaign-enabled): metro.shelter@reliefsphere.org");

  // Org B: NGO (Specializing in Field Beneficiaries & Requirements)
  let ngoUser = await User.findOne({ email: "keralacare@reliefsphere.org" });
  if (!ngoUser) {
    ngoUser = await User.create({
      fullName: "Kerala Care Disaster Relief Trust",
      email: "keralacare@reliefsphere.org",
      password: hashedPassword,
      phone: "+91 98470 33445",
      role: "recipient_org",
      isVerified: true,
    });
  }
  let ngoOrg = await RecipientOrganization.findOne({ userId: ngoUser._id });
  if (!ngoOrg) {
    ngoOrg = await RecipientOrganization.create({
      userId: ngoUser._id,
      orgName: "Kerala Care Disaster Relief Trust",
      orgType: "ngo",
      registrationNumber: "NGO-KL-2023-554",
      address: "Fort Kochi Relief Zone, Kochi, Kerala",
      latitude: 9.9656,
      longitude: 76.2421,
      verificationStatus: "verified",
      approvedBy: admin._id,
      approvedAt: new Date(),
    });
  } else {
    ngoOrg.verificationStatus = "verified";
    await ngoOrg.save();
  }
  console.log("✔ Verified NGO created: keralacare@reliefsphere.org");

  // Org C: Pending Org (for Admin Verification demonstration)
  let pendingOrgUser = await User.findOne({ email: "greenvalley@charity.org" });
  if (!pendingOrgUser) {
    pendingOrgUser = await User.create({
      fullName: "Green Valley Welfare Society",
      email: "greenvalley@charity.org",
      password: hashedPassword,
      phone: "+91 94460 77889",
      role: "recipient_org",
      isVerified: false,
    });
  }
  let pendingOrg = await RecipientOrganization.findOne({ userId: pendingOrgUser._id });
  if (!pendingOrg) {
    pendingOrg = await RecipientOrganization.create({
      userId: pendingOrgUser._id,
      orgName: "Green Valley Welfare Society",
      orgType: "ngo",
      registrationNumber: "NGO-KL-2026-PENDING",
      address: "Vyttila Mobility Hub Sector, Kochi, Kerala",
      latitude: 9.9698,
      longitude: 76.3182,
      verificationStatus: "pending",
    });
  }
  console.log("✔ Pending Organization created (For Admin Approval Demo): greenvalley@charity.org");

  // ─────────────────────────────────────────────────────────────
  // 3. DONORS
  // ─────────────────────────────────────────────────────────────
  let donorUser = await User.findOne({ email: "anita.donor@reliefsphere.org" });
  if (!donorUser) {
    donorUser = await User.create({
      fullName: "Anita Menon",
      email: "anita.donor@reliefsphere.org",
      password: hashedPassword,
      phone: "+91 98765 43210",
      role: "donor",
      isVerified: true,
    });
  }
  let donorProfile = await Donor.findOne({ userId: donorUser._id });
  if (!donorProfile) {
    donorProfile = await Donor.create({
      userId: donorUser._id,
      donorType: "individual",
      address: "Kaloor, Kochi, Kerala",
      latitude: 9.9984,
      longitude: 76.2925,
      preferredCategories: ["food", "clothes", "medicine"],
    });
  }
  console.log("✔ Verified Donor created: anita.donor@reliefsphere.org");

  // ─────────────────────────────────────────────────────────────
  // 4. VOLUNTEERS
  // ─────────────────────────────────────────────────────────────
  let volUser = await User.findOne({ email: "rohith.volunteer@reliefsphere.org" });
  if (!volUser) {
    volUser = await User.create({
      fullName: "Rohith Nair",
      email: "rohith.volunteer@reliefsphere.org",
      password: hashedPassword,
      phone: "+91 97455 66778",
      role: "volunteer",
      isVerified: true,
    });
  }
  let volProfile = await Volunteer.findOne({ userId: volUser._id });
  if (!volProfile) {
    volProfile = await Volunteer.create({
      userId: volUser._id,
      dob: new Date("1998-05-14"),
      phone: "+91 97455 66778",
      address: "Palarivattom, Kochi, Kerala",
      skills: ["Driving", "Logistics & Delivery", "First Aid"],
      latitude: 10.0033,
      longitude: 76.3075,
      completedDeliveries: 4,
      verificationStatus: "verified",
      approvedBy: admin._id,
      approvedAt: new Date(),
    });
  } else {
    volProfile.verificationStatus = "verified";
    await volProfile.save();
  }
  console.log("✔ Verified Volunteer created: rohith.volunteer@reliefsphere.org");

  // Volunteer B: Pending Volunteer (for Admin Verification demonstration)
  let pendingVolUser = await User.findOne({ email: "arjun.volunteer@reliefsphere.org" });
  if (!pendingVolUser) {
    pendingVolUser = await User.create({
      fullName: "Arjun K",
      email: "arjun.volunteer@reliefsphere.org",
      password: hashedPassword,
      phone: "+91 98460 55112",
      role: "volunteer",
      isVerified: false,
    });
  }
  let pendingVolProfile = await Volunteer.findOne({ userId: pendingVolUser._id });
  if (!pendingVolProfile) {
    pendingVolProfile = await Volunteer.create({
      userId: pendingVolUser._id,
      dob: new Date("2000-09-20"),
      phone: "+91 98460 55112",
      address: "Edappally, Kochi, Kerala",
      skills: ["Loading & Unloading", "Community Support"],
      latitude: 10.0236,
      longitude: 76.3116,
      verificationStatus: "pending",
    });
  }
  console.log("✔ Pending Volunteer created (For Admin Approval Demo): arjun.volunteer@reliefsphere.org");

  // ─────────────────────────────────────────────────────────────
  // 5. DISASTER RELIEF CAMPAIGNS (Shelter Created)
  // ─────────────────────────────────────────────────────────────
  const campaignsData = [
    {
      title: "Wayanad Landslide Emergency Food & Ration Drive",
      disasterType: "Landslide",
      reliefGoal: "Food Kits",
      category: "Disaster Response",
      description:
        "Emergency supply mobilization providing dry rations, cooking oil, and nutritious food kits to 200 displaced families in temporary landslide rehabilitation centers.",
      targetBeneficiaries: "Displaced families in Chooralmala and Meppadi camps",
      affectedPeopleCount: 650,
      affectedFamiliesCount: 180,
      coordinatorName: "Camp Officer Ramesh",
      coordinatorContact: "+91 94470 11999",
      distributionPlan: "Direct camp distribution via verified volunteer teams",
      estimatedBudget: 150000,
      targetQuantity: 200,
      raisedQuantity: 145,
      location: "Chooralmala & Meppadi Relief Camps, Wayanad",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      urgency: "Critical",
      organizationId: shelterOrg._id,
      createdBy: shelterUser._id,
      status: "ACTIVE",
    },
    {
      title: "Monsoon Flood Community Medical Relief Camp",
      disasterType: "Flood",
      reliefGoal: "Medicines",
      category: "Medical Assistance",
      description:
        "Mobilizing antiseptic solutions, ORS sachets, insulin cooling packs, and water purification tablets for flood waterlogged coastal wards.",
      targetBeneficiaries: "Elderly, children, and waterborne disease vulnerable residents",
      affectedPeopleCount: 420,
      affectedFamiliesCount: 95,
      coordinatorName: "Dr. Lakshmi S",
      coordinatorContact: "+91 94471 22334",
      distributionPlan: "Stationary medical unit and mobile health boat dispensary",
      estimatedBudget: 95000,
      targetQuantity: 120,
      raisedQuantity: 70,
      location: "Marine Drive Coastal Relief Camp, Kochi",
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      urgency: "High",
      organizationId: shelterOrg._id,
      createdBy: shelterUser._id,
      status: "ACTIVE",
    },
    {
      title: "Coastal Fishermen Community Warmth & Blanket Drive",
      disasterType: "Community Crisis",
      reliefGoal: "Blankets",
      category: "Shelter & Warmth",
      description:
        "Providing warm wool blankets, clean sleeping mats, and bedsheets for families displaced by coastal high tide surge.",
      targetBeneficiaries: "Coastal fishermen households in temporary community halls",
      affectedPeopleCount: 300,
      affectedFamiliesCount: 75,
      coordinatorName: "Fr. Joseph Varghese",
      coordinatorContact: "+91 98472 44556",
      distributionPlan: "Evenly allocated during evening camp roll call",
      estimatedBudget: 60000,
      targetQuantity: 150,
      raisedQuantity: 110,
      location: "Fort Kochi Coastal Shelter, Kochi",
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      urgency: "Medium",
      organizationId: shelterOrg._id,
      createdBy: shelterUser._id,
      status: "ACTIVE",
    },
    {
      title: "Post-Disaster Student Educational Kits & School Drive",
      disasterType: "Flood",
      reliefGoal: "School Kits",
      category: "Education",
      description:
        "Restoring school backpacks, notebooks, geometry boxes, and textbooks for schoolchildren who lost their study materials during inundation.",
      targetBeneficiaries: "Primary and secondary school students returning to classes",
      affectedPeopleCount: 100,
      affectedFamiliesCount: 60,
      coordinatorName: "Headmistress Mary K",
      coordinatorContact: "+91 94473 88990",
      distributionPlan: "Direct distribution in renovated community school halls",
      estimatedBudget: 45000,
      targetQuantity: 80,
      raisedQuantity: 80,
      location: "Aluva Disaster Relief Hub, Kochi",
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      urgency: "Low",
      organizationId: shelterOrg._id,
      createdBy: shelterUser._id,
      status: "COMPLETED",
    },
  ];

  for (const cData of campaignsData) {
    const existing = await Campaign.findOne({ title: cData.title });
    if (!existing) {
      await Campaign.create(cData);
    }
  }
  console.log(`✔ Created ${campaignsData.length} Disaster Relief Campaigns (3 Active, 1 Completed)`);

  // ─────────────────────────────────────────────────────────────
  // 6. REQUIREMENTS (Open Needs Posted by Organizations)
  // ─────────────────────────────────────────────────────────────
  const reqData = [
    {
      organizationId: shelterOrg._id,
      postedBy: shelterUser._id,
      category: "food",
      title: "Emergency Flood Kitchen Grocery Kits",
      description:
        "Immediate need for dry ration grocery kits (5kg rice, 2kg dal, 1L cooking oil) for community relief kitchen.",
      quantity: 50,
      fulfilledQuantity: 20,
      unit: "Packets",
      urgency: "critical",
      location: "Marine Drive Community Relief Center, Kochi",
      latitude: 9.9816,
      longitude: 76.2799,
      requiredBefore: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: "open",
    },
    {
      organizationId: ngoOrg._id,
      postedBy: ngoUser._id,
      category: "clothes",
      title: "Warm Woolen Blankets for Night Shelter",
      description:
        "Blankets and clean bedsheets needed for 40 individuals sheltered at Fort Kochi camp.",
      quantity: 40,
      fulfilledQuantity: 15,
      unit: "Pieces",
      urgency: "high",
      location: "Fort Kochi Coastal Camp, Kochi",
      latitude: 9.9656,
      longitude: 76.2421,
      requiredBefore: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      status: "open",
    },
    {
      organizationId: shelterOrg._id,
      postedBy: shelterUser._id,
      category: "medicine",
      title: "Pediatric First Aid & ORS Hydration Packs",
      description:
        "Emergency requirement of pediatric electrolyte ORS packets and basic antiseptic first aid supplies.",
      quantity: 30,
      fulfilledQuantity: 0,
      unit: "Kits",
      urgency: "critical",
      location: "Marine Drive Community Relief Center, Kochi",
      latitude: 9.9816,
      longitude: 76.2799,
      requiredBefore: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "open",
    },
    {
      organizationId: ngoOrg._id,
      postedBy: ngoUser._id,
      category: "books",
      title: "Primary School Notebooks & Stationery Bundles",
      description:
        "Exercise books, pens, pencils, and geometry sets for flood affected students resuming classes.",
      quantity: 60,
      fulfilledQuantity: 0,
      unit: "Packs",
      urgency: "medium",
      location: "Kaloor Youth Resource Center, Kochi",
      latitude: 9.9984,
      longitude: 76.2925,
      requiredBefore: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "open",
    },
  ];

  const createdReqs = [];
  for (const r of reqData) {
    let reqDoc = await Requirement.findOne({ title: r.title });
    if (!reqDoc) {
      reqDoc = await Requirement.create(r);
    }
    createdReqs.push(reqDoc);
  }
  console.log(`✔ Created ${createdReqs.length} Open NGO Requirements (Food, Clothes, Medicine, Books)`);

  // ─────────────────────────────────────────────────────────────
  // 7. BENEFICIARY CASES (Traceability & Verification Engine)
  // ─────────────────────────────────────────────────────────────
  const beneficiaryCases = [
    {
      caseNumber: "BEN-2026-KL-001",
      organizationId: ngoOrg._id,
      createdBy: ngoUser._id,
      assignedStaff: ngoUser._id,
      requestSource: "ngo_field_assessment",
      beneficiaryType: "household",
      headOfHouseholdName: "Suresh Kumar",
      contactPhone: "+91 98471 00221",
      householdSize: 5,
      vulnerableMembers: { children: 2, elderly: 1, disabled: 0, pregnantOrLactating: 1 },
      area: "Marine Drive Coastal Relief Zone",
      address: "House 14, Ward 4, Coastal Fishermen Enclave, Kochi",
      latitude: 9.9825,
      longitude: 76.279,
      priority: "critical",
      assessmentRationale: "Ground floor completely flooded; primary earner disabled from injury during evacuation.",
      neededItems: [
        {
          category: "food",
          itemName: "Dry Ration Grocery Kit",
          quantityNeeded: 3,
          quantityDistributed: 1,
          unit: "Packets",
          urgency: "critical",
        },
        {
          category: "clothes",
          itemName: "Warm Blanket Set",
          quantityNeeded: 2,
          quantityDistributed: 1,
          unit: "Pieces",
          urgency: "high",
        },
      ],
      status: "assistance_in_progress",
    },
    {
      caseNumber: "BEN-2026-KL-002",
      organizationId: ngoOrg._id,
      createdBy: ngoUser._id,
      requestSource: "community_referral",
      beneficiaryType: "household",
      headOfHouseholdName: "Fatima Beevi",
      contactPhone: "+91 97455 11234",
      householdSize: 4,
      vulnerableMembers: { children: 1, elderly: 2, disabled: 1, pregnantOrLactating: 0 },
      area: "Fort Kochi West Coast Shelter",
      address: "Tent B-12, Fort Kochi Community Relief Ground",
      latitude: 9.966,
      longitude: 76.2415,
      priority: "high",
      assessmentRationale: "Elderly diabetic patients require medical supplies and dry food rations.",
      neededItems: [
        {
          category: "food",
          itemName: "Nutritional Emergency Grocery",
          quantityNeeded: 2,
          quantityDistributed: 0,
          unit: "Packets",
          urgency: "high",
        },
        {
          category: "medicine",
          itemName: "Diabetic Care & First Aid Kit",
          quantityNeeded: 1,
          quantityDistributed: 0,
          unit: "Kits",
          urgency: "critical",
        },
      ],
      status: "pending_review", // For Admin Live Verification Demonstration!
    },
    {
      caseNumber: "BEN-2026-KL-003",
      organizationId: shelterOrg._id,
      createdBy: shelterUser._id,
      requestSource: "household_reported",
      beneficiaryType: "household",
      headOfHouseholdName: "Rajan Pillai",
      contactPhone: "+91 98460 33441",
      householdSize: 3,
      vulnerableMembers: { children: 0, elderly: 2, disabled: 0, pregnantOrLactating: 0 },
      area: "Marine Drive Central Camp",
      address: "Shelter Block C, Room 4",
      latitude: 9.9818,
      longitude: 76.2805,
      priority: "high",
      assessmentRationale: "Displaced senior citizens awaiting water recedence.",
      neededItems: [
        {
          category: "clothes",
          itemName: "Thermal Fleece Blankets",
          quantityNeeded: 2,
          quantityDistributed: 2,
          unit: "Pieces",
          urgency: "high",
        },
      ],
      status: "verified",
    },
  ];

  const createdCases = [];
  for (const b of beneficiaryCases) {
    let caseDoc = await BeneficiaryCase.findOne({ caseNumber: b.caseNumber });
    if (!caseDoc) {
      caseDoc = await BeneficiaryCase.create(b);
    }
    createdCases.push(caseDoc);
  }
  console.log(`✔ Created ${createdCases.length} Beneficiary Cases (Verified, Pending Admin Review, Assistance in Progress)`);

  // ─────────────────────────────────────────────────────────────
  // 8. DONATIONS & DELIVERIES (End-to-End Workflow Stages)
  // ─────────────────────────────────────────────────────────────
  const foodReq = createdReqs[0];
  const clothesReq = createdReqs[1];

  // Donation 1: Pending Donation (Ready for Live Match Recommendation Demo)
  let pendingDonation = await Donation.findOne({ donationName: "Family Meal Rations (Rice & Pulses)" });
  if (!pendingDonation) {
    pendingDonation = await Donation.create({
      donorId: donorProfile._id,
      postedBy: donorUser._id,
      category: "food",
      donationName: "Family Meal Rations (Rice & Pulses)",
      quantity: 30,
      unit: "Packets",
      description: "Dry rations including basmati rice, toor dal, and salt packets ready for pickup.",
      pickupAddress: "Kaloor Metro Station Exit 2, Kochi",
      latitude: 9.9984,
      longitude: 76.2925,
      contactNumber: "+91 98765 43210",
      status: "pending",
    });
  }

  // Donation 2: Matched Donation (Accepted & Assigned to Delivery)
  let inTransitDonation = await Donation.findOne({ donationName: "High Quality Winter Woolen Blankets" });
  if (!inTransitDonation) {
    inTransitDonation = await Donation.create({
      donorId: donorProfile._id,
      postedBy: donorUser._id,
      category: "clothes",
      donationName: "High Quality Winter Woolen Blankets",
      quantity: 15,
      unit: "Pieces",
      description: "Brand new double-ply blankets suitable for night shelters.",
      pickupAddress: "Panampilly Nagar Park Road, Kochi",
      latitude: 9.9578,
      longitude: 76.2934,
      contactNumber: "+91 98765 43210",
      status: "assigned",
      organizationId: ngoOrg._id,
      matchedRequirement: clothesReq._id,
      matchedOrganization: ngoOrg._id,
      matchScore: 92,
      acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });
  }

  // Delivery for Donation 2 (In Transit with Volunteer Rohith)
  let activeDelivery = await Delivery.findOne({ donationId: inTransitDonation._id });
  if (!activeDelivery) {
    activeDelivery = await Delivery.create({
      donationId: inTransitDonation._id,
      volunteerId: volProfile._id,
      assignedBy: admin._id,
      pickupAddress: inTransitDonation.pickupAddress,
      dropAddress: "Fort Kochi Coastal Camp, Kochi, Kerala",
      pickupLat: inTransitDonation.latitude,
      pickupLng: inTransitDonation.longitude,
      dropLat: 9.9656,
      dropLng: 76.2421,
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: "in_transit",
      pickedUpAt: new Date(Date.now() - 30 * 60 * 1000),
    });
  }

  // Donation 3: Successfully Delivered Donation (With Photo & Receipt Notes)
  let deliveredDonation = await Donation.findOne({ donationName: "Emergency First Aid & Antiseptic Kits" });
  if (!deliveredDonation) {
    deliveredDonation = await Donation.create({
      donorId: donorProfile._id,
      postedBy: donorUser._id,
      category: "medicine",
      donationName: "Emergency First Aid & Antiseptic Kits",
      quantity: 20,
      unit: "Kits",
      description: "Sterile gauze, povidone-iodine, cotton, band-aids, and paracetamol strips.",
      pickupAddress: "Kochi Infopark Gate 1, Kakkanad",
      latitude: 10.0125,
      longitude: 76.3575,
      contactNumber: "+91 98765 43210",
      status: "delivered",
      organizationId: shelterOrg._id,
      matchScore: 95,
      acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });
  }

  let completedDelivery = await Delivery.findOne({ donationId: deliveredDonation._id });
  if (!completedDelivery) {
    completedDelivery = await Delivery.create({
      donationId: deliveredDonation._id,
      volunteerId: volProfile._id,
      assignedBy: admin._id,
      pickupAddress: deliveredDonation.pickupAddress,
      dropAddress: "Marine Drive Community Complex, Kochi, Kerala",
      pickupLat: deliveredDonation.latitude,
      pickupLng: deliveredDonation.longitude,
      dropLat: 9.9816,
      dropLng: 76.2799,
      status: "delivered",
      pickedUpAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      proofNote: "Safely delivered to Shelter Coordinator Suresh. Stock verified against inventory manifest.",
      proofImages: [],
    });
  }
  console.log("✔ Created Complete Donation Lifecycle (Pending, Matched/In-Transit, Delivered with Proof)");

  // ─────────────────────────────────────────────────────────────
  // 9. ASSISTANCE DISTRIBUTION (Traceability Audit Event)
  // ─────────────────────────────────────────────────────────────
  const targetCase = createdCases[0]; // Case BEN-2026-KL-001
  let existingDist = await AssistanceDistribution.findOne({
    distributionReference: "DIST-2026-KL-001",
  });

  if (!existingDist) {
    existingDist = await AssistanceDistribution.create({
      distributionReference: "DIST-2026-KL-001",
      beneficiaryCaseId: targetCase._id,
      organizationId: ngoOrg._id,
      category: "food",
      itemName: "Dry Ration Grocery Kit",
      quantityDistributed: 1,
      unit: "Packets",
      distributionDate: new Date(),
      recordedBy: ngoUser._id,
      relatedDonationId: deliveredDonation._id,
      relatedDeliveryId: completedDelivery._id,
      headOfHouseholdName: targetCase.headOfHouseholdName,
      contactPhone: targetCase.contactPhone,
      recipientArea: targetCase.area,
      householdSize: targetCase.householdSize,
      notes: "First emergency grocery kit delivered to temporary shelter doorstep.",
    });
  }
  console.log("✔ Recorded Verified Household Assistance Distribution (Reference: DIST-2026-KL-001)");

  console.log("\n=======================================================");
  console.log("       FINAL REVIEW DEMO SEEDING COMPLETE! 🎉");
  console.log("=======================================================");
  console.log("All dashboards (Admin, NGO, Shelter, Donor, Volunteer) are now populated with rich live data.");
  console.log("\n🔑 DEMO LOGIN CREDENTIALS:");
  console.log("----------------------------------------------------------------------------------");
  console.log("1. System Admin:     admin@reliefsphere.com           / admin123");
  console.log("2. Community Shelter: metro.shelter@reliefsphere.org   / Password123 (Campaign Creator)");
  console.log("3. Standard NGO:      keralacare@reliefsphere.org      / Password123 (Beneficiary Cases)");
  console.log("4. Individual Donor:  anita.donor@reliefsphere.org     / Password123");
  console.log("5. Volunteer Driver:  rohith.volunteer@reliefsphere.org / Password123");
  console.log("6. Pending Org:       greenvalley@charity.org          / Password123 (For Admin Approval)");
  console.log("7. Pending Volunteer: arjun.volunteer@reliefsphere.org / Password123 (For Admin Approval)");
  console.log("----------------------------------------------------------------------------------");

  process.exit(0);
}

seedData().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
