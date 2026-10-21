/**
 * ReliefSphere — AI Smart Donation Matching Service
 * ==================================================
 * Provides explainable, two-way matching between Donations and Requirements.
 *
 * Scoring model (Total: 100 points):
 *   - Category Compatibility:  40 points
 *   - Quantity Compatibility:  20 points
 *   - Geographic Proximity:    20 points
 *   - Urgency and Deadline:    20 points
 *
 * Two-way workflows:
 *   - Workflow A: findMatchingRequirementsForDonation(donation)
 *   - Workflow B: findMatchingDonationsForRequirement(requirement)
 *
 * Shared deterministic scoring engine with transparent explanations.
 */

const Requirement = require("../models/requirementModel");
const Donation = require("../models/donationModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const Notification = require("../models/notificationModel");

// ─── Configurable Scoring Weights ───
const DEFAULT_WEIGHTS = {
  category: 40,
  quantity: 20,
  proximity: 20,
  urgencyDeadline: 20,
};

// ─── Related/Compatible Cross-Categories ───
// Exact category gets full 40 points. Compatible cross-categories get partial 20 points.
const COMPATIBLE_CATEGORIES = {
  food: ["food"],
  clothes: ["clothes", "essentials"],
  books: ["books"],
  medicine: ["medicine", "essentials"],
  essentials: ["essentials", "clothes", "medicine"],
};

// ─── Urgency Scores (out of 12) ───
const URGENCY_POINTS = {
  critical: 12,
  high: 9,
  medium: 6,
  low: 3,
};

// ─── Unit Normalization & Compatibility ───
const UNIT_GROUPS = {
  count: ["packets", "packet", "pieces", "piece", "boxes", "box", "sets", "set", "items", "item", "kits", "kit"],
  weight: ["kg", "kgs", "kilogram", "kilograms", "grams", "g"],
  volume: ["liters", "liter", "l", "ml"],
};

function normalizeUnit(unit) {
  if (!unit || typeof unit !== "string") return "items";
  return unit.trim().toLowerCase();
}

function areUnitsCompatible(unitA, unitB) {
  const uA = normalizeUnit(unitA);
  const uB = normalizeUnit(unitB);
  if (uA === uB) return true;

  for (const group of Object.values(UNIT_GROUPS)) {
    if (group.includes(uA) && group.includes(uB)) {
      return true;
    }
  }
  return false;
}

// ─── Haversine Distance (km) ───
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return null;
  }
  if (nLat1 < -90 || nLat1 > 90 || nLat2 < -90 || nLat2 > 90 ||
      nLon1 < -180 || nLon1 > 180 || nLon2 < -180 || nLon2 > 180) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ─── Proximity Scoring ───
// Max 20 points. <=5 km = 20 pts, linearly decays to 0 at 200 km.
function calculateProximityScore(distKm, maxPoints = 20) {
  if (distKm == null) {
    return {
      score: Math.round(maxPoints * 0.5), // Neutral fallback
      isFallback: true,
      explanation: `Distance unknown (location coordinates not provided, neutral fallback +${Math.round(maxPoints * 0.5)} pts)`,
    };
  }
  if (distKm <= 5) {
    return {
      score: maxPoints,
      isFallback: false,
      explanation: `Nearby organization: ${distKm} km away (+${maxPoints} pts)`,
    };
  }
  if (distKm >= 200) {
    return {
      score: 0,
      isFallback: false,
      explanation: `Distant location: ${distKm} km away (>200 km limit, +0 pts)`,
    };
  }
  const score = Math.max(0, Math.round(maxPoints * (1 - (distKm - 5) / 195)));
  return {
    score,
    isFallback: false,
    explanation: `Proximity: ${distKm} km away (+${score} pts)`,
  };
}

// ─── Core Deterministic Match Calculator ───
/**
 * Calculates match compatibility and explanation between a single donation and requirement.
 * @param {Object} donation - Donation document or plain object
 * @param {Object} requirement - Requirement document or plain object (with populated organizationId)
 * @param {Object} weights - Custom weight overrides (optional)
 * @returns {Object} { eligible: boolean, overallScore: number, factorScores: {}, reasons: [] }
 */
function calculateMatch(donation, requirement, weights = DEFAULT_WEIGHTS) {
  const reasons = [];

  // 1. Eligibility: Check Organization Verification
  const org = requirement.organizationId;
  if (!org) {
    return {
      eligible: false,
      ineligibleReason: "Recipient organization is missing.",
      overallScore: 0,
      factorScores: null,
      reasons: ["Excluded: Recipient organization reference is missing."],
    };
  }

  const orgStatus = typeof org === "object" && org.verificationStatus !== undefined
    ? org.verificationStatus
    : "verified";
  if (orgStatus !== "verified") {
    return {
      eligible: false,
      ineligibleReason: "Recipient organization is unverified.",
      overallScore: 0,
      factorScores: null,
      reasons: ["Excluded: Organization is not verified by admin."],
    };
  }

  // 2. Eligibility: Requirement Status
  if (requirement.status && !["open", "matched"].includes(requirement.status)) {
    return {
      eligible: false,
      ineligibleReason: `Requirement status is "${requirement.status}" (not open).`,
      overallScore: 0,
      factorScores: null,
      reasons: [`Excluded: Requirement is ${requirement.status}.`],
    };
  }

  // 3. Eligibility: Deadline & Expiration Check
  const now = new Date();
  const deadline = requirement.requiredBefore
    ? new Date(requirement.requiredBefore)
    : requirement.expiresAt
    ? new Date(requirement.expiresAt)
    : null;

  if (deadline && deadline < now) {
    return {
      eligible: false,
      ineligibleReason: "Requirement has expired.",
      overallScore: 0,
      factorScores: null,
      reasons: ["Excluded: Requirement deadline has expired."],
    };
  }

  // 4. Eligibility: Remaining Requirement Quantity
  const fulfilledQty = requirement.fulfilledQuantity || 0;
  const remainingReqQty = Math.max(0, (requirement.quantity || 0) - fulfilledQty);
  if (remainingReqQty <= 0) {
    return {
      eligible: false,
      ineligibleReason: "Requirement has already been completely fulfilled.",
      overallScore: 0,
      factorScores: null,
      reasons: ["Excluded: Requirement is already 100% fulfilled."],
    };
  }

  // 5. Eligibility: Donation Quantity
  const donAvailableQty = Number(donation.quantity) || 0;
  if (donAvailableQty <= 0) {
    return {
      eligible: false,
      ineligibleReason: "Donation quantity must be greater than zero.",
      overallScore: 0,
      factorScores: null,
      reasons: ["Excluded: Donation quantity is zero or invalid."],
    };
  }

  // ── Factor 1: Category Compatibility (Max 40) ──
  const donCat = (donation.category || "").toLowerCase();
  const reqCat = (requirement.category || "").toLowerCase();
  let categoryScore = 0;
  let categoryExplanation = "";

  if (donCat && reqCat && donCat === reqCat) {
    categoryScore = weights.category;
    categoryExplanation = `Exact category match: "${reqCat}" (+${categoryScore} pts)`;
  } else if (COMPATIBLE_CATEGORIES[donCat]?.includes(reqCat)) {
    categoryScore = Math.round(weights.category * 0.5);
    categoryExplanation = `Compatible category: "${donCat}" matches related need "${reqCat}" (+${categoryScore} pts)`;
  } else {
    // Incompatible category -> Ineligible
    return {
      eligible: false,
      ineligibleReason: `Incompatible category ("${donCat}" does not match "${reqCat}").`,
      overallScore: 0,
      factorScores: null,
      reasons: [`Incompatible category: "${donCat}" does not match "${reqCat}".`],
    };
  }
  reasons.push(categoryExplanation);

  // ── Factor 2: Quantity Compatibility (Max 20) ──
  const donUnit = donation.unit || "Packets";
  const reqUnit = requirement.unit || "Packets";
  const unitsMatch = areUnitsCompatible(donUnit, reqUnit);

  let quantityScore = 0;
  let coverageRatio = 0;
  let coveragePercent = 0;

  if (unitsMatch) {
    coverageRatio = Math.min(donAvailableQty / remainingReqQty, 1.0);
    coveragePercent = Math.round((donAvailableQty / remainingReqQty) * 100);
    quantityScore = Math.round(coverageRatio * weights.quantity);

    if (donAvailableQty >= remainingReqQty) {
      reasons.push(
        `Can satisfy 100% of remaining requirement (${donAvailableQty} ${donUnit} offered vs ${remainingReqQty} needed, +${quantityScore} pts)`
      );
    } else {
      reasons.push(
        `Partial fulfillment: covers ${coveragePercent}% of remaining need (${donAvailableQty} of ${remainingReqQty} ${reqUnit}, +${quantityScore} pts)`
      );
    }
  } else {
    // Different measurement units: safe neutral score with caution
    quantityScore = Math.round(weights.quantity * 0.25);
    reasons.push(
      `Different units ("${donUnit}" vs "${reqUnit}") — partial score (+${quantityScore} pts, manual quantity verification needed)`
    );
  }

  // ── Factor 3: Geographic Proximity (Max 20) ──
  // Use donation coordinates and requirement or organization coordinates
  const donLat = donation.latitude != null ? donation.latitude : null;
  const donLon = donation.longitude != null ? donation.longitude : null;
  const reqLat = requirement.latitude != null ? requirement.latitude : org?.latitude;
  const reqLon = requirement.longitude != null ? requirement.longitude : org?.longitude;

  const distKm = haversineDistance(donLat, donLon, reqLat, reqLon);
  const proximityResult = calculateProximityScore(distKm, weights.proximity);
  const proximityScore = proximityResult.score;
  reasons.push(proximityResult.explanation);

  // ── Factor 4: Urgency and Deadline (Max 20) ──
  // Sub-part A: Urgency (Max 12)
  const reqUrgency = (requirement.urgency || "medium").toLowerCase();
  const urgencyPts = URGENCY_POINTS[reqUrgency] != null ? URGENCY_POINTS[reqUrgency] : 6;

  // Sub-part B: Approaching Deadline (Max 8)
  let deadlinePts = 4; // default neutral
  let deadlineDesc = "standard timeline";

  if (deadline) {
    const msRemaining = deadline.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    if (daysRemaining <= 2) {
      deadlinePts = 8;
      deadlineDesc = `critical deadline approaching in ${daysRemaining} day(s)`;
    } else if (daysRemaining <= 5) {
      deadlinePts = 6;
      deadlineDesc = `deadline in ${daysRemaining} days`;
    } else if (daysRemaining <= 10) {
      deadlinePts = 4;
      deadlineDesc = `deadline in ${daysRemaining} days`;
    } else {
      deadlinePts = 2;
      deadlineDesc = `deadline in ${daysRemaining} days`;
    }
  }

  const urgencyDeadlineScore = Math.min(weights.urgencyDeadline, urgencyPts + deadlinePts);
  reasons.push(
    `Urgency & deadline: ${reqUrgency.toUpperCase()} urgency (+${urgencyPts} pts), ${deadlineDesc} (+${deadlinePts} pts)`
  );

  // ── Total Overall Score ──
  const overallScore = Math.min(
    100,
    Math.max(0, categoryScore + quantityScore + proximityScore + urgencyDeadlineScore)
  );

  return {
    eligible: true,
    overallScore,
    factorScores: {
      category: {
        score: categoryScore,
        max: weights.category,
        donCategory: donCat,
        reqCategory: reqCat,
      },
      quantity: {
        score: quantityScore,
        max: weights.quantity,
        donQuantity: donAvailableQty,
        reqRemainingQuantity: remainingReqQty,
        coveragePercent,
        unitsMatch,
      },
      proximity: {
        score: proximityScore,
        max: weights.proximity,
        distanceKm: distKm,
        isFallback: proximityResult.isFallback,
      },
      urgencyDeadline: {
        score: urgencyDeadlineScore,
        max: weights.urgencyDeadline,
        urgency: reqUrgency,
        urgencyScore: urgencyPts,
        deadlineScore: deadlinePts,
      },
    },
    reasons,
  };
}

// ─── Workflow A: Find Matching Requirements for a Donation ───
/**
 * Retrieves eligible, verified requirements and ranks them for a given donation.
 * @param {string|Object} donationOrId - Donation document, object, or ID
 * @param {Object} options - { limit: number, minScore: number }
 */
async function findMatchingRequirementsForDonation(donationOrId, options = {}) {
  const limit = options.limit || 10;
  const minScore = options.minScore || 10;

  let donation = donationOrId;
  if (typeof donationOrId === "string" || donationOrId instanceof require("mongoose").Types.ObjectId) {
    donation = await Donation.findById(donationOrId).populate("donorId");
  }

  if (!donation) {
    return { recommendations: [], totalEligible: 0 };
  }

  const now = new Date();

  // Find candidate requirements:
  // - Open or partially matched
  // - Not expired
  const candidates = await Requirement.find({
    status: { $in: ["open", "matched"] },
    $or: [
      { requiredBefore: null },
      { requiredBefore: { $gte: now } },
    ],
  })
    .populate({
      path: "organizationId",
      select: "orgName orgType address latitude longitude verificationStatus",
    })
    .populate("postedBy", "fullName email");

  const matches = [];

  for (const req of candidates) {
    const match = calculateMatch(donation, req);
    if (match.eligible && match.overallScore >= minScore) {
      matches.push({
        requirementId: req._id,
        title: req.title,
        category: req.category,
        urgency: req.urgency,
        quantityNeeded: req.quantity,
        fulfilledQuantity: req.fulfilledQuantity || 0,
        remainingQuantity: Math.max(0, (req.quantity || 0) - (req.fulfilledQuantity || 0)),
        unit: req.unit || "Packets",
        location: req.location || req.organizationId?.address || "",
        organization: {
          _id: req.organizationId?._id,
          orgName: req.organizationId?.orgName || "Verified Organization",
          orgType: req.organizationId?.orgType,
          address: req.organizationId?.address,
          verificationStatus: req.organizationId?.verificationStatus,
        },
        postedBy: req.postedBy ? { _id: req.postedBy._id, fullName: req.postedBy.fullName } : null,
        overallScore: match.overallScore,
        factorScores: match.factorScores,
        reasons: match.reasons,
        createdAt: req.createdAt,
      });
    }
  }

  // Sort descending by match score
  matches.sort((a, b) => b.overallScore - a.overallScore);

  return {
    recommendations: matches.slice(0, limit),
    totalEligible: matches.length,
    donation: {
      _id: donation._id,
      category: donation.category,
      donationName: donation.donationName,
      quantity: donation.quantity,
      unit: donation.unit,
      status: donation.status,
    },
  };
}

// ─── Workflow B: Find Matching Donations for a Requirement ───
/**
 * Retrieves eligible available donations and ranks them for an organization's requirement.
 * @param {string|Object} requirementOrId - Requirement document, object, or ID
 * @param {Object} options - { limit: number, minScore: number }
 */
async function findMatchingDonationsForRequirement(requirementOrId, options = {}) {
  const limit = options.limit || 10;
  const minScore = options.minScore || 10;

  let requirement = requirementOrId;
  if (typeof requirementOrId === "string" || requirementOrId instanceof require("mongoose").Types.ObjectId) {
    requirement = await Requirement.findById(requirementOrId).populate("organizationId postedBy");
  }

  if (!requirement) {
    return { recommendations: [], totalEligible: 0 };
  }

  // Verify the organization is verified
  const org = requirement.organizationId;
  if (org && org.verificationStatus !== "verified") {
    return {
      recommendations: [],
      totalEligible: 0,
      unverified: true,
      message: "Organization must be verified to view recommendation matches.",
    };
  }

  // Find candidate donations:
  // - status "pending" or "matched"
  // - quantity > 0
  const candidateDonations = await Donation.find({
    status: { $in: ["pending", "matched"] },
    quantity: { $gt: 0 },
  })
    .populate("postedBy", "fullName email phone avatar")
    .populate("donorId", "donorType address totalDonations");

  const matches = [];

  for (const don of candidateDonations) {
    const match = calculateMatch(don, requirement);
    if (match.eligible && match.overallScore >= minScore) {
      matches.push({
        donationId: don._id,
        donationName: don.donationName,
        category: don.category,
        quantity: don.quantity,
        unit: don.unit || "Packets",
        pickupAddress: don.pickupAddress,
        image: don.image,
        description: don.description,
        status: don.status,
        donor: {
          fullName: don.postedBy?.fullName || "Anonymous Donor",
          email: don.postedBy?.email,
          phone: don.contactNumber || don.postedBy?.phone,
          donorType: don.donorId?.donorType || "individual",
        },
        overallScore: match.overallScore,
        factorScores: match.factorScores,
        reasons: match.reasons,
        createdAt: don.createdAt,
      });
    }
  }

  matches.sort((a, b) => b.overallScore - a.overallScore);

  return {
    recommendations: matches.slice(0, limit),
    totalEligible: matches.length,
    requirement: {
      _id: requirement._id,
      title: requirement.title,
      category: requirement.category,
      quantity: requirement.quantity,
      remainingQuantity: Math.max(0, (requirement.quantity || 0) - (requirement.fulfilledQuantity || 0)),
      unit: requirement.unit,
      urgency: requirement.urgency,
      status: requirement.status,
    },
  };
}

module.exports = {
  DEFAULT_WEIGHTS,
  haversineDistance,
  calculateProximityScore,
  calculateMatch,
  findMatchingRequirementsForDonation,
  findMatchingDonationsForRequirement,
  areUnitsCompatible,
};
