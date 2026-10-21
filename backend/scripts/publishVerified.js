require("dotenv").config();
const mongoose = require("mongoose");
const BeneficiaryCase = require("../models/BeneficiaryCase");
const Requirement = require("../models/requirementModel");

async function main() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/reliefsphere");
  const verifiedCases = await BeneficiaryCase.find({
    status: { $in: ["verified", "assistance_in_progress"] },
  });
  console.log("Found verified cases:", verifiedCases.length);

  for (const caseDoc of verifiedCases) {
    for (const item of caseDoc.neededItems || []) {
      const remaining = (item.quantityNeeded || 0) - (item.quantityDistributed || 0);
      if (remaining <= 0) continue;

      let cat = (item.category || "essentials").toLowerCase();
      if (cat === "shelter") cat = "essentials";
      if (cat === "clothing") cat = "clothes";
      if (cat === "education") cat = "books";
      if (cat === "medical") cat = "medicine";
      if (!["food", "clothes", "books", "medicine", "essentials"].includes(cat)) {
        cat = "essentials";
      }

      const title = `${item.itemName} for Verified Household (${caseDoc.area})`;
      
      const evidenceImg =
        caseDoc.supportingEvidence?.slice()?.reverse()?.find((e) =>
          e.fileUrl && /\.(jpe?g|png|webp|gif|svg)$/i.test(e.fileUrl)
        )?.fileUrl || caseDoc.supportingEvidence?.[0]?.fileUrl || "";

      let req = await Requirement.findOne({ organizationId: caseDoc.organizationId, title });

      if (!req) {
        req = await Requirement.create({
          organizationId: caseDoc.organizationId,
          postedBy: caseDoc.createdBy || caseDoc.assignedStaff,
          category: cat,
          title,
          description: caseDoc.assessmentRationale
            ? `${caseDoc.assessmentRationale} (Case Ref: ${caseDoc.caseNumber})`
            : `Audited and verified relief requirement for a household in ${caseDoc.area}. Case Ref: ${caseDoc.caseNumber}.`,
          quantity: remaining,
          fulfilledQuantity: 0,
          unit: item.unit || "Items",
          urgency: item.urgency || caseDoc.priority || "high",
          location: caseDoc.area,
          imageUrl: evidenceImg,
          beneficiaryType: "Verified Beneficiary Household",
          beneficiaryCount: caseDoc.householdSize || 1,
          beneficiaryCaseId: caseDoc._id,
          status: "open",
        });
        console.log("Published requirement for donor view:", req.title, "Qty:", req.quantity);
      } else {
        req.beneficiaryCaseId = caseDoc._id;
        if (evidenceImg) req.imageUrl = evidenceImg;
        req.beneficiaryCount = caseDoc.householdSize || 1;
        req.beneficiaryType = "Verified Beneficiary Household";
        await req.save();
      }

      if (!caseDoc.linkedRequirements.includes(req._id)) {
        caseDoc.linkedRequirements.push(req._id);
      }
    }
    await caseDoc.save();
  }

  console.log("Done publishing!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
