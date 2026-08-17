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
function calculateMatchScore(donation, requirement) {
  let score = 0;

  // Factor 1: Category Match (40 pts)
  if (donation.category === requirement.category) {
    score += 40;
  }

  // Factor 2: Quantity Adequacy (25 pts)
  if (requirement.quantity > 0) {
    const ratio = donation.quantity / requirement.quantity;
    if (ratio >= 1.0)       score += 25;
    else if (ratio >= 0.75) score += 18;
    else if (ratio >= 0.5)  score += 10;
    else if (ratio >= 0.25) score += 5;
  }

  // Factor 3: Urgency Bonus (20 pts)
  const urgencyScore = { low: 5, medium: 10, high: 15, critical: 20 };
  score += urgencyScore[requirement.urgency] || 5;

  // Factor 4: Distance Score (15 pts)
  const distKm = haversineDistance(
    donation.latitude,
    donation.longitude,
    requirement.latitude,
    requirement.longitude
  );
  if (distKm <= 5)        score += 15;
  else if (distKm <= 20)  score += 10;
  else if (distKm <= 50)  score += 5;
  else if (distKm <= 100) score += 2;

  return Math.min(Math.round(score), 100);
}

/* ─── Main Matcher: finds best requirements for a donation ─── */
async function matchDonationToRequirements(donation) {
  try {
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
        const score = calculateMatchScore(donation, req);
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
          score,
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
