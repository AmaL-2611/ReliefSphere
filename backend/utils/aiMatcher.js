/**
 * ReliefSphere AI — Matching Engine
 * ====================================
 * Weighted multi-factor scoring algorithm that matches donations to requirements.
 *
 * Scoring Breakdown (100 pts total):
 *   Factor 1 — Category Match    : 40 pts  (KNN nearest-neighbour concept)
 *   Factor 2 — Quantity Adequacy : 25 pts  (constraint satisfaction)
 *   Factor 3 — Urgency Weighting : 20 pts  (EDF priority scheduling)
 *   Factor 4 — Distance Proximity: 15 pts  (VRP heuristic — Haversine formula)
 */

const Requirement = require("../models/requirementModel");
const Notification = require("../models/notificationModel");
const RecipientOrganization = require("../models/RecipientOrganization");
const Settings = require("../models/settingsModel");
const Campaign = require("../models/campaignModel");

/* ─── Haversine Distance (km) ─── */
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 9999; // treat unknown as very far
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Core Score Calculator ─── */
function calculateMatchScore(donation, requirement, customWeights = null, customDistances = null) {
  let score = 0;

  const weights = customWeights || {
    categoryMatch: 40,
    quantityRatio: 25,
    urgency: 20,
    proximity: 15,
  };

  const distances = customDistances || {
    localKm: 5,
    districtKm: 20,
    regionalKm: 50,
    maxRadiusKm: 100,
  };

  // Factor 1: Category Match
  if (donation.category === requirement.category) {
    score += weights.categoryMatch;
  }

  // Factor 2: Quantity Adequacy
  if (requirement.quantity > 0) {
    const ratio = donation.quantity / requirement.quantity;
    if (ratio >= 1.0)       score += weights.quantityRatio;
    else if (ratio >= 0.75) score += weights.quantityRatio * 0.72;
    else if (ratio >= 0.5)  score += weights.quantityRatio * 0.40;
    else if (ratio >= 0.25) score += weights.quantityRatio * 0.20;
  }

  // Factor 3: Urgency Bonus
  const urgencyRatios = { low: 0.25, medium: 0.50, high: 0.75, critical: 1.0 };
  const urgRatio = urgencyRatios[requirement.urgency] || 0.25;
  score += weights.urgency * urgRatio;

  // Factor 4: Distance Score
  const distKm = haversineDistance(
    donation.latitude,
    donation.longitude,
    requirement.latitude,
    requirement.longitude
  );

  if (distKm <= distances.localKm)         score += weights.proximity;
  else if (distKm <= distances.districtKm) score += weights.proximity * 0.66;
  else if (distKm <= distances.regionalKm) score += weights.proximity * 0.33;
  else if (distKm <= distances.maxRadiusKm) score += weights.proximity * 0.13;

  return Math.min(Math.round(score), 100);
}

/* ─── Main Matcher: finds best requirements for a donation ─── */
async function matchDonationToRequirements(donation) {
  try {
    let settings = null;
    try {
      settings = await Settings.findOne();
    } catch (e) {
      console.error("Could not fetch settings for AI matcher:", e.message);
    }

    const activeWeights = settings?.aiWeights || null;
    const activeDistances = settings?.distanceThresholds || null;
    const minThreshold = settings?.aiWeights?.minMatchThreshold || 40;

    // Fetch active priority campaigns
    const now = new Date();
    let activeCampaigns = [];
    try {
      activeCampaigns = await Campaign.find({
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
    } catch (e) {
      console.error("Could not fetch active campaigns for AI matcher:", e.message);
    }

    const campaignOrgIds = new Set();
    activeCampaigns.forEach((camp) => {
      if (camp.linkedOrgIds && Array.isArray(camp.linkedOrgIds)) {
        camp.linkedOrgIds.forEach((orgId) => campaignOrgIds.add(orgId.toString()));
      }
    });

    // Fetch all open requirements in the same category
    const candidates = await Requirement.find({
      category: donation.category,
      status: "open",
    }).populate("organizationId").populate("postedBy", "fullName email");

    if (candidates.length === 0) {
      return { topMatches: [], bestMatch: null };
    }

    // Score each requirement
    const scored = candidates
      .map((req) => {
        let baseScore = calculateMatchScore(donation, req, activeWeights, activeDistances);
        const orgIdStr = req.organizationId?._id ? req.organizationId._id.toString() : null;
        const isCampaignActive = orgIdStr && campaignOrgIds.has(orgIdStr);

        // Apply +15 Priority Campaign Bonus if org is linked to an active campaign
        if (isCampaignActive) {
          baseScore = Math.min(100, baseScore + 15);
        }

        const distKm = haversineDistance(
          donation.latitude,
          donation.longitude,
          req.latitude,
          req.longitude
        );
        return {
          requirement: req,
          requirementId: req._id,
          organizationId: req.organizationId?._id,
          organizationName: req.organizationId?.orgName || "Unknown Org",
          score: baseScore,
          isCampaignPriority: isCampaignActive,
          distanceKm: Math.round(distKm * 10) / 10,
          category: req.category,


          urgency: req.urgency,
          quantityNeeded: req.quantity,
          quantityOffered: donation.quantity,
          title: req.title,
        };
      })
      .sort((a, b) => b.score - a.score);

    return {
      topMatches: scored.slice(0, 5),
      bestMatch: scored[0] || null,
    };
  } catch (err) {
    console.error("AI Matcher error:", err.message);
    return { topMatches: [], bestMatch: null };
  }
}

/* ─── Create notification helper ─── */
async function createNotification(userId, title, message, type, relatedId, relatedModel) {
  try {
    await Notification.create({ userId, title, message, type, relatedId, relatedModel });
  } catch (err) {
    console.error("Notification create error:", err.message);
  }
}

module.exports = {
  matchDonationToRequirements,
  calculateMatchScore,
  haversineDistance,
  createNotification,
};
