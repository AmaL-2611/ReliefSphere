/**
 * ReliefSphere — Resource Matching Engine (Bridge & Notifications)
 * ===============================================================
 * Integrates with matchingService.js for deterministic, explainable scoring
 * and handles notification delivery.
 */

const {
  findMatchingRequirementsForDonation,
  haversineDistance,
  calculateMatch,
} = require("../services/matchingService");
const Notification = require("../models/notificationModel");

/**
 * Standard Requirement Matcher for backward compatibility with existing controllers.
 */
async function matchDonationToRequirements(donation) {
  try {
    const result = await findMatchingRequirementsForDonation(donation, { limit: 5 });
    const topMatches = result.recommendations.map((rec) => ({
      requirementId: rec.requirementId,
      organizationId: rec.organization._id,
      organizationName: rec.organization.orgName,
      distanceKm: rec.factorScores?.proximity?.distanceKm,
      category: rec.category,
      urgency: rec.urgency,
      quantityNeeded: rec.quantityNeeded,
      quantityOffered: donation.quantity,
      matchScore: rec.overallScore,
      matchReasons: rec.reasons,
      title: rec.title,
    }));

    return {
      topMatches,
      bestMatch: topMatches[0] || null,
    };
  } catch (err) {
    console.error("Resource Matcher error:", err.message);
    return { topMatches: [], bestMatch: null };
  }
}

/**
 * Create notification helper
 */
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
  calculateMatch,
  createNotification,
};
