/**
 * ReliefSphere — Resource Matching Engine
 * ========================================
 * Matches posted donations to open recipient organization requirements
 * based on category match, urgency level, and distance proximity.
 */

const Requirement = require("../models/requirementModel");
const Notification = require("../models/notificationModel");

/* ─── Haversine Distance (km) ─── */
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 9999;
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

/* ─── Standard Requirement Matcher ─── */
async function matchDonationToRequirements(donation) {
  try {
    const candidates = await Requirement.find({
      category: donation.category,
      status: "open",
    }).populate("organizationId").populate("postedBy", "fullName email");

    if (candidates.length === 0) {
      return { topMatches: [], bestMatch: null };
    }

    const scored = candidates
      .map((req) => {
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
          distanceKm: Math.round(distKm * 10) / 10,
          category: req.category,
          urgency: req.urgency,
          quantityNeeded: req.quantity,
          quantityOffered: donation.quantity,
          title: req.title,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      topMatches: scored.slice(0, 5),
      bestMatch: scored[0] || null,
    };
  } catch (err) {
    console.error("Resource Matcher error:", err.message);
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
  haversineDistance,
  createNotification,
};
