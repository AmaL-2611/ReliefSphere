const BeneficiaryCase = require("../models/BeneficiaryCase");
const AssistanceDistribution = require("../models/AssistanceDistribution");

/**
 * Generates a unique, human-friendly case reference code (e.g. BEN-2026-0001).
 */
async function generateCaseNumber() {
  const year = new Date().getFullYear();
  const count = await BeneficiaryCase.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BEN-${year}-${String(count + 1).padStart(4, "0")}-${randomSuffix}`;
}

/**
 * Generates a unique distribution reference code (e.g. DIST-2026-0001).
 */
async function generateDistributionReference() {
  const year = new Date().getFullYear();
  const count = await AssistanceDistribution.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DIST-${year}-${String(count + 1).padStart(4, "0")}-${randomSuffix}`;
}

/**
 * Computes exact item-by-item remaining needs and fulfillment summary for a beneficiary case.
 */
function calculateCaseFulfillment(neededItems = [], distributions = [], linkedDonations = []) {
  // Only count confirmed distributions
  const confirmedDistributions = (distributions || []).filter(
    (d) => d.confirmationStatus === "confirmed"
  );

  // Active donations (exclude cancelled/rejected)
  const activeDonations = (linkedDonations || []).filter(
    (d) => !["cancelled", "rejected"].includes(d.status)
  );

  let totalNeededUnits = 0;
  let totalDistributedUnits = 0;
  let totalDonatedUnits = 0;
  let totalSourcedUnits = 0;

  const itemBreakdown = neededItems.map((item) => {
    // 1. Distributions for this specific item or category
    const matchingDists = confirmedDistributions.filter((d) => {
      const matchName =
        d.itemName &&
        item.itemName &&
        d.itemName.trim().toLowerCase() === item.itemName.trim().toLowerCase();
      const matchCatUnit =
        d.category &&
        item.category &&
        d.unit &&
        item.unit &&
        d.category.trim().toLowerCase() === item.category.trim().toLowerCase() &&
        d.unit.trim().toLowerCase() === item.unit.trim().toLowerCase();
      return matchName || matchCatUnit;
    });

    const distributedQty = matchingDists.reduce(
      (sum, d) => sum + (Number(d.quantityDistributed) || 0),
      0
    );

    // 2. Donations pledged/sourced from donors for this item/category
    const normalizeCat = (cat = "") => {
      const c = cat.trim().toLowerCase();
      if (c === "clothing" || c === "clothes") return "clothing";
      if (c === "medical" || c === "medicine") return "medical";
      if (c === "education" || c === "books") return "education";
      if (c === "shelter" || c === "essentials") return "essentials";
      return c;
    };

    const matchingDonations = activeDonations.filter((d) => {
      const dName = (d.donationName || "").toLowerCase();
      const iName = (item.itemName || "").toLowerCase();
      const matchName = iName && (dName.includes(iName) || iName.includes(dName));
      const matchCat =
        d.category &&
        item.category &&
        normalizeCat(d.category) === normalizeCat(item.category);
      const singleItemMatch = neededItems.length === 1;

      return matchName || matchCat || singleItemMatch;
    });

    const donatedQty = matchingDonations.reduce(
      (sum, d) => sum + (Number(d.quantity) || 0),
      0
    );

    const neededQty = Number(item.quantityNeeded) || 0;
    // Sourced is at least the donated quantity or distributed quantity
    const sourcedQty = Math.max(distributedQty, Math.min(neededQty, donatedQty));
    const remainingQty = Math.max(0, neededQty - sourcedQty);

    totalNeededUnits += neededQty;
    totalDistributedUnits += Math.min(neededQty, distributedQty);
    totalDonatedUnits += Math.min(neededQty, donatedQty);
    totalSourcedUnits += Math.min(neededQty, sourcedQty);

    const fulfillmentPercentage =
      neededQty > 0
        ? Math.min(100, Math.round((sourcedQty / neededQty) * 100))
        : 100;

    return {
      _id: item._id,
      category: item.category,
      itemName: item.itemName,
      unit: item.unit,
      urgency: item.urgency,
      quantityNeeded: neededQty,
      quantityDonated: donatedQty,
      quantityDistributed: distributedQty,
      quantitySourced: sourcedQty,
      quantityRemaining: remainingQty,
      remainingQuantity: remainingQty, // Compatibility alias
      fulfillmentPercentage,
      isFulfilled: remainingQty === 0,
      distributionCount: matchingDists.length,
      donationCount: matchingDonations.length,
    };
  });

  const allItemsFulfilled =
    itemBreakdown.length > 0 && itemBreakdown.every((i) => i.isFulfilled);
  const overallPercentage =
    totalNeededUnits > 0
      ? Math.min(100, Math.round((totalSourcedUnits / totalNeededUnits) * 100))
      : 100;

  return {
    itemBreakdown,
    itemsFulfillment: itemBreakdown, // Compatibility alias
    totalNeededUnits,
    totalDonatedUnits,
    totalDistributedUnits,
    totalSourcedUnits,
    overallPercentage,
    allItemsFulfilled,
    hasPartialFulfillment:
      totalSourcedUnits > 0 && !allItemsFulfilled,
  };
}

/**
 * Enforces privacy and data minimization by masking private beneficiary details
 * for unauthorized users, donors, or volunteers.
 */
function sanitizeBeneficiaryForViewer(caseDoc, viewerUser, isOwnerNgo) {
  if (!caseDoc) return null;
  const doc = typeof caseDoc.toObject === "function" ? caseDoc.toObject() : { ...caseDoc };

  const isAdmin = viewerUser?.role === "admin";
  const hasFullAccess = isAdmin || isOwnerNgo;

  if (!hasFullAccess) {
    // Mask head of household name (e.g., "Anita Sharma" -> "A**** S*****")
    if (doc.headOfHouseholdName) {
      doc.headOfHouseholdName = doc.headOfHouseholdName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0] + "*".repeat(Math.max(1, part.length - 1)))
        .join(" ");
    }
    // Mask sensitive contact phone
    if (doc.contactPhone) {
      doc.contactPhone = undefined;
    }
    // Conceal specific house address, only reveal generalized area
    doc.address = undefined;
    doc.latitude = undefined;
    doc.longitude = undefined;
    doc.assessmentNotes = undefined;
    // Omit sensitive supporting documents (ration card, personal forms)
    doc.supportingEvidence = [];
  }

  return doc;
}

module.exports = {
  generateCaseNumber,
  generateDistributionReference,
  calculateCaseFulfillment,
  sanitizeBeneficiaryForViewer,
};
