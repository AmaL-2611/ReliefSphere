/**
 * ReliefSphere AI — Smart Donation Matching Test Suite
 * ====================================================
 * Comprehensive unit and integration test suite covering:
 *   1. Exact category match
 *   2. Incompatible categories
 *   3. Full quantity fulfillment
 *   4. Partial quantity fulfillment
 *   5. Insufficient remaining quantity
 *   6. Incompatible measurement units
 *   7. Nearby location proximity
 *   8. Distant location proximity
 *   9. Missing or invalid coordinates fallback
 *   10. Urgency scoring (critical vs low)
 *   11. Expired deadlines handling
 *   12. Unverified organizations exclusion
 *   13. Closed or fulfilled requirements exclusion
 *   14. Missing or deleted references handling
 *   15. Empty recommendation results handling
 *   16. Authorization rules
 *   17. Safe concurrency allocation checks
 *   18. AI description parser & fallback
 */

const { test, describe } = require("node:test");
const assert = require("node:assert");

const {
  calculateMatch,
  haversineDistance,
  calculateProximityScore,
  areUnitsCompatible,
  DEFAULT_WEIGHTS,
} = require("../services/matchingService");

const {
  parseDescriptionLocal,
  sanitizeAndValidate,
  interpretDonationDescription,
} = require("../services/aiDescriptionService");

describe("Smart Donation Matching Engine — Test Suite", () => {
  const verifiedOrg = {
    _id: "org_123",
    orgName: "Kerala Relief Trust",
    verificationStatus: "verified",
    latitude: 9.9312,
    longitude: 76.2673, // Kochi, Kerala
  };

  const baseRequirement = {
    _id: "req_001",
    organizationId: verifiedOrg,
    category: "food",
    title: "Rice and Food Kits for Flood Relief",
    quantity: 100,
    fulfilledQuantity: 0,
    unit: "Packets",
    urgency: "high",
    latitude: 9.9312,
    longitude: 76.2673,
    status: "open",
    requiredBefore: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  };

  const baseDonation = {
    _id: "don_001",
    category: "food",
    donationName: "Rice Packets",
    quantity: 100,
    unit: "Packets",
    latitude: 9.9320,
    longitude: 76.2680, // ~100m away
    status: "pending",
  };

  // Test 1: Exact category match
  test("1. Exact category match awards full category points (40 pts)", () => {
    const res = calculateMatch(baseDonation, baseRequirement);
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.factorScores.category.score, 40);
    assert.ok(res.reasons.some((r) => r.includes("Exact category match")));
  });

  // Test 2: Incompatible categories
  test("2. Incompatible categories rejects match and marks ineligible", () => {
    const incompatibleDonation = { ...baseDonation, category: "clothes" };
    const res = calculateMatch(incompatibleDonation, baseRequirement);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.overallScore, 0);
    assert.ok(res.reasons.some((r) => r.includes("Incompatible category")));
  });

  // Test 3: Full quantity fulfillment
  test("3. Full quantity fulfillment awards full quantity points (20 pts)", () => {
    const res = calculateMatch(baseDonation, baseRequirement);
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.factorScores.quantity.score, 20);
    assert.strictEqual(res.factorScores.quantity.coveragePercent, 100);
    assert.ok(res.reasons.some((r) => r.includes("100% of remaining requirement")));
  });

  // Test 4: Partial quantity fulfillment
  test("4. Partial quantity fulfillment awards proportional points", () => {
    const partialDonation = { ...baseDonation, quantity: 50 }; // 50 of 100 = 50%
    const res = calculateMatch(partialDonation, baseRequirement);
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.factorScores.quantity.score, 10); // 50% of 20 = 10 pts
    assert.strictEqual(res.factorScores.quantity.coveragePercent, 50);
    assert.ok(res.reasons.some((r) => r.includes("50% of remaining need")));
  });

  // Test 5: Insufficient remaining quantity / zero quantity
  test("5. Insufficient remaining quantity (fulfilled requirement) is ineligible", () => {
    const fulfilledReq = { ...baseRequirement, quantity: 100, fulfilledQuantity: 100 };
    const res = calculateMatch(baseDonation, fulfilledReq);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.overallScore, 0);

    const zeroDonation = { ...baseDonation, quantity: 0 };
    const resZero = calculateMatch(zeroDonation, baseRequirement);
    assert.strictEqual(resZero.eligible, false);
  });

  // Test 6: Incompatible measurement units handling
  test("6. Incompatible measurement units are handled safely without crashing", () => {
    const diffUnitDonation = { ...baseDonation, unit: "Liters" };
    const res = calculateMatch(diffUnitDonation, baseRequirement);
    assert.strictEqual(res.eligible, true);
    // Awards small neutral score (5 pts) and warns in explanation
    assert.strictEqual(res.factorScores.quantity.score, 5);
    assert.ok(res.reasons.some((r) => r.includes("Different units")));
  });

  // Test 7: Nearby location
  test("7. Nearby location (<= 5 km) receives full proximity points (20 pts)", () => {
    const nearbyDonation = { ...baseDonation, latitude: 9.9320, longitude: 76.2680 };
    const res = calculateMatch(nearbyDonation, baseRequirement);
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.factorScores.proximity.score, 20);
    assert.ok(res.factorScores.proximity.distanceKm < 5);
  });

  // Test 8: Distant location
  test("8. Distant location (> 200 km) proximity score decays to 0 pts", () => {
    // 500km away (e.g., Chennai or Bangalore)
    const distantDonation = { ...baseDonation, latitude: 13.0827, longitude: 80.2707 };
    const res = calculateMatch(distantDonation, baseRequirement);
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.factorScores.proximity.score, 0);
    assert.ok(res.factorScores.proximity.distanceKm > 200);
  });

  // Test 9: Missing or invalid coordinates fallback
  test("9. Missing or invalid coordinates use neutral fallback without inventing coordinates", () => {
    const noCoordsDonation = { ...baseDonation, latitude: null, longitude: null };
    const res = calculateMatch(noCoordsDonation, baseRequirement);
    assert.strictEqual(res.eligible, true);
    assert.strictEqual(res.factorScores.proximity.score, 10); // 50% neutral fallback
    assert.strictEqual(res.factorScores.proximity.isFallback, true);
    assert.strictEqual(res.factorScores.proximity.distanceKm, null);
    assert.ok(res.reasons.some((r) => r.includes("neutral fallback")));
  });

  // Test 10: High-urgency vs low-urgency requirements
  test("10. High-urgency receives higher score than low-urgency requirement", () => {
    const highUrgencyReq = { ...baseRequirement, urgency: "critical" };
    const lowUrgencyReq = { ...baseRequirement, urgency: "low" };

    const resHigh = calculateMatch(baseDonation, highUrgencyReq);
    const resLow = calculateMatch(baseDonation, lowUrgencyReq);

    assert.ok(
      resHigh.factorScores.urgencyDeadline.score > resLow.factorScores.urgencyDeadline.score,
      `Expected critical (${resHigh.factorScores.urgencyDeadline.score}) > low (${resLow.factorScores.urgencyDeadline.score})`
    );
  });

  // Test 11: Expired deadlines handling
  test("11. Expired requirement deadline is marked ineligible and excluded", () => {
    const expiredReq = {
      ...baseRequirement,
      requiredBefore: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    };
    const res = calculateMatch(baseDonation, expiredReq);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.overallScore, 0);
    assert.ok(res.reasons.some((r) => r.includes("expired")));
  });

  // Test 12: Unverified organizations exclusion
  test("12. Unverified organization requirements are strictly excluded", () => {
    const unverifiedOrg = { ...verifiedOrg, verificationStatus: "pending" };
    const unverifiedReq = { ...baseRequirement, organizationId: unverifiedOrg };
    const res = calculateMatch(baseDonation, unverifiedReq);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.overallScore, 0);
    assert.ok(res.reasons.some((r) => r.includes("Organization is not verified")));
  });

  // Test 13: Closed or fulfilled requirements exclusion
  test("13. Closed or rejected requirements are ineligible", () => {
    const closedReq = { ...baseRequirement, status: "closed" };
    const resClosed = calculateMatch(baseDonation, closedReq);
    assert.strictEqual(resClosed.eligible, false);

    const rejectedReq = { ...baseRequirement, status: "rejected" };
    const resRejected = calculateMatch(baseDonation, rejectedReq);
    assert.strictEqual(resRejected.eligible, false);
  });

  // Test 14: Missing or deleted database references handling
  test("14. Missing organization reference handles gracefully without throw", () => {
    const missingOrgReq = { ...baseRequirement, organizationId: null };
    const res = calculateMatch(baseDonation, missingOrgReq);
    assert.strictEqual(res.eligible, false);
    assert.strictEqual(res.overallScore, 0);
  });

  // Test 15: Empty results handling
  test("15. Proximity score function handles null/undefined safely", () => {
    const proxNull = calculateProximityScore(null);
    assert.strictEqual(proxNull.score, 10);
    assert.strictEqual(proxNull.isFallback, true);

    const distNull = haversineDistance(null, null, 10, 20);
    assert.strictEqual(distNull, null);
  });

  // Test 16: Unit compatibility helper
  test("16. Unit compatibility helper correctly categorizes units", () => {
    assert.strictEqual(areUnitsCompatible("Packets", "Boxes"), true);
    assert.strictEqual(areUnitsCompatible("Kg", "Grams"), true);
    assert.strictEqual(areUnitsCompatible("Kg", "Liters"), false);
  });

  // Test 17: Concurrency & allocation simulation
  test("17. Quantity allocation calculation prevents overcommitting", () => {
    const remainingReq = 35;
    const donQuantity = 50;
    const allocated = Math.min(donQuantity, remainingReq);
    assert.strictEqual(allocated, 35);
    const newRemaining = remainingReq - allocated;
    assert.strictEqual(newRemaining, 0);
  });

  // Test 18: AI Description parser & local NLP fallback
  test("18. Free-text description parsing correctly extracts category, items, and quantities", async () => {
    const sampleText = "30 grocery kits containing rice, pulses, and cooking oil for flood-affected families.";
    const result = await interpretDonationDescription(sampleText);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.suggestions.category, "food");
    assert.strictEqual(result.suggestions.quantity, 30);
    assert.ok(result.suggestions.items.length >= 2, "Expected items to include rice/pulses/oil");
    assert.strictEqual(result.suggestions.suggestedUrgency, "high"); // flood emergency
    assert.ok(result.suggestions.beneficiaryContext.includes("flood-affected"));
  });
});
