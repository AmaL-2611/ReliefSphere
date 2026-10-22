const mongoose = require("mongoose");
const BeneficiaryCase = require("../models/BeneficiaryCase");
const AssistanceDistribution = require("../models/AssistanceDistribution");
const RecipientOrganization = require("../models/RecipientOrganization");
const Requirement = require("../models/requirementModel");
const Donation = require("../models/donationModel");
const Delivery = require("../models/deliveryModel");
const { createNotification } = require("../utils/resourceMatcher");
const {
  generateCaseNumber,
  generateDistributionReference,
  calculateCaseFulfillment,
  sanitizeBeneficiaryForViewer,
} = require("../services/beneficiaryTraceabilityService");

/* ─── Helper: Get Authorized NGO for Current User ─── */
async function getAuthorizedOrg(userId, role) {
  if (role === "admin") return null;
  const org = await RecipientOrganization.findOne({ userId });
  return org;
}

/* ─── 1. Register Beneficiary Case (NGO) ─── */
exports.createCase = async (req, res) => {
  try {
    const org = await getAuthorizedOrg(req.user._id, req.user.role);
    if (!org && req.user.role !== "admin") {
      return res.status(403).json({ message: "Organization profile not found." });
    }
    if (org && org.verificationStatus !== "verified") {
      return res.status(403).json({
        message: "Your organization must be verified by admin before managing beneficiary cases.",
      });
    }

    const {
      requestSource,
      beneficiaryType,
      headOfHouseholdName,
      contactPhone,
      householdSize,
      vulnerableMembers,
      area,
      address,
      latitude,
      longitude,
      priority,
      assessmentRationale,
      assessmentNotes,
      neededItems,
      supportingEvidence,
      linkedRequirementId,
      isDraft,
    } = req.body;

    if (!headOfHouseholdName || !headOfHouseholdName.trim()) {
      return res.status(400).json({ message: "Head of household / beneficiary name is required." });
    }
    if (contactPhone && contactPhone.trim()) {
      const cleanPhone = contactPhone.trim().replace(/\D/g, "");
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({ message: "Contact phone must be a valid 10-digit mobile number starting with 6, 7, 8, or 9." });
      }
    }
    if (!area || !area.trim()) {
      return res.status(400).json({ message: "General location/area is required." });
    }
    if (!neededItems || !Array.isArray(neededItems) || neededItems.length === 0) {
      return res.status(400).json({ message: "At least one needed item must be assessed." });
    }

    // Validate needed items
    for (const item of neededItems) {
      if (!item.itemName || !item.itemName.trim()) {
        return res.status(400).json({ message: "All needed items must have an item name." });
      }
      if (!item.quantityNeeded || Number(item.quantityNeeded) <= 0) {
        return res.status(400).json({ message: "Assessed quantity needed must be greater than zero." });
      }
    }

    const caseNumber = await generateCaseNumber();
    const initialStatus = isDraft ? "draft" : "pending_review";

    const newCase = await BeneficiaryCase.create({
      caseNumber,
      organizationId: org ? org._id : req.body.organizationId,
      createdBy: req.user._id,
      assignedStaff: req.user._id,
      requestSource: requestSource || "ngo_field_assessment",
      beneficiaryType: beneficiaryType || "household",
      headOfHouseholdName: headOfHouseholdName.trim(),
      contactPhone: contactPhone ? contactPhone.trim() : "",
      householdSize: Number(householdSize) || 1,
      vulnerableMembers: vulnerableMembers || { children: 0, elderly: 0, disabled: 0, pregnantOrLactating: 0 },
      area: area.trim(),
      address: address ? address.trim() : "",
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      priority: priority || "medium",
      assessmentRationale: assessmentRationale || "",
      assessmentNotes: assessmentNotes || "",
      assessmentDate: req.body.assessmentDate ? new Date(req.body.assessmentDate) : new Date(),
      neededItems: neededItems.map((item) => ({
        category: item.category || "food",
        itemName: item.itemName.trim(),
        quantityNeeded: Number(item.quantityNeeded),
        quantityDistributed: 0,
        unit: item.unit || "Items",
        urgency: item.urgency || priority || "medium",
      })),
      supportingEvidence: Array.isArray(supportingEvidence) ? supportingEvidence : [],
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          changedBy: req.user._id,
          changedAt: new Date(),
          notes: isDraft ? "Case saved as draft." : "Case registered and submitted for admin review.",
        },
      ],
      linkedRequirements: linkedRequirementId ? [linkedRequirementId] : [],
    });

    res.status(201).json({
      message: isDraft
        ? "Beneficiary case saved as draft."
        : "Beneficiary case registered and submitted for verification.",
      case: newCase,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 2. Get Organization Cases (NGO Portal) ─── */
exports.getOrganizationCases = async (req, res) => {
  try {
    const org = await getAuthorizedOrg(req.user._id, req.user.role);
    if (!org && req.user.role !== "admin") {
      return res.status(403).json({ message: "Organization profile not found." });
    }

    const filter = {};
    if (req.user.role !== "admin") {
      filter.organizationId = org._id;
    } else if (req.query.organizationId) {
      filter.organizationId = req.query.organizationId;
    }

    const { status, priority, requestSource, search } = req.query;
    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (requestSource && requestSource !== "all") filter.requestSource = requestSource;

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { caseNumber: { $regex: q, $options: "i" } },
        { headOfHouseholdName: { $regex: q, $options: "i" } },
        { area: { $regex: q, $options: "i" } },
      ];
    }

    const cases = await BeneficiaryCase.find(filter)
      .populate("organizationId", "orgName orgType address")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    // Compute live summary stats
    const allOrgCases = await BeneficiaryCase.find({
      organizationId: org ? org._id : { $exists: true },
    }).select("status priority");

    const stats = {
      totalCases: allOrgCases.length,
      pendingReview: allOrgCases.filter((c) => c.status === "pending_review").length,
      verified: allOrgCases.filter((c) => c.status === "verified").length,
      inProgress: allOrgCases.filter((c) => c.status === "assistance_in_progress").length,
      followUpRequired: allOrgCases.filter((c) => c.status === "follow_up_required").length,
      closed: allOrgCases.filter((c) => c.status === "closed").length,
      rejected: allOrgCases.filter((c) => c.status === "rejected").length,
    };

    res.json({ cases, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 3. Get Case Details with Traceability & Fulfillment ─── */
exports.getCaseDetails = async (req, res) => {
  try {
    const caseDoc = await BeneficiaryCase.findById(req.params.id)
      .populate("organizationId", "orgName orgType address verificationStatus")
      .populate("createdBy", "fullName email")
      .populate("assignedStaff", "fullName email")
      .populate("verificationDetails.reviewedBy", "fullName email")
      .populate("closureDetails.closedBy", "fullName email")
      .populate("linkedRequirements", "title category quantity fulfilledQuantity unit status")
      .populate("linkedDonations", "donationName category quantity unit status acceptedAt")
      .populate("linkedDeliveries", "status scheduledTime deliveredAt pickupAddress dropAddress proofImages");

    if (!caseDoc) {
      return res.status(404).json({ message: "Beneficiary case not found." });
    }

    const org = await getAuthorizedOrg(req.user._id, req.user.role);
    const isOwnerNgo = org && caseDoc.organizationId?._id?.toString() === org._id.toString();
    const isAdmin = req.user.role === "admin";
    const isPublicVerified = ["verified", "assistance_in_progress", "follow_up_required", "closed"].includes(caseDoc.status);

    if (!isOwnerNgo && !isAdmin && !isPublicVerified) {
      return res.status(403).json({ message: "Not authorized to access this private beneficiary case." });
    }

    // Retrieve all recorded distributions for this case
    const distributions = await AssistanceDistribution.find({
      beneficiaryCaseId: caseDoc._id,
    })
      .populate("recordedBy", "fullName email")
      .populate("relatedDonationId", "donationName category")
      .populate("relatedDeliveryId", "status deliveredAt")
      .sort({ distributionDate: -1 });

    // Retrieve all requirements associated with this beneficiary case
    const Requirement = require("../models/requirementModel");
    const matchingReqs = await Requirement.find({
      $or: [
        { beneficiaryCaseId: caseDoc._id },
        { _id: { $in: (caseDoc.linkedRequirements || []).map((r) => r._id || r) } },
        { description: new RegExp(caseDoc.caseNumber, "i") },
      ],
    }).select("_id");

    const allReqIds = [
      ...new Set([
        ...(caseDoc.linkedRequirements || []).map((r) => (r._id || r).toString()),
        ...matchingReqs.map((r) => r._id.toString()),
      ]),
    ];

    const reqObjIds = allReqIds.map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id));

    // Retrieve all donations linked to this case or its linked requirements
    const relatedDonations = await Donation.find({
      $or: [
        { _id: { $in: caseDoc.linkedDonations || [] } },
        { matchedRequirement: { $in: [...reqObjIds, ...allReqIds] } },
      ],
      status: { $nin: ["cancelled", "rejected"] },
    }).populate("donorId", "fullName email");

    // Auto-sync links back to caseDoc
    if (allReqIds.length > (caseDoc.linkedRequirements || []).length || relatedDonations.length > (caseDoc.linkedDonations || []).length) {
      await BeneficiaryCase.updateOne(
        { _id: caseDoc._id },
        {
          $addToSet: {
            linkedRequirements: { $each: reqObjIds },
            linkedDonations: { $each: relatedDonations.map((d) => d._id) },
          },
        }
      );
    }

    const fulfillment = calculateCaseFulfillment(caseDoc.neededItems, distributions, relatedDonations);
    const sanitizedCase = sanitizeBeneficiaryForViewer(caseDoc, req.user, isOwnerNgo);

    res.json({
      case: sanitizedCase,
      distributions,
      fulfillment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 4. Admin: List Pending Cases for Verification ─── */
exports.adminGetPendingCases = async (req, res) => {
  try {
    const { status = "pending_review" } = req.query;
    const filter = {};
    if (status !== "all") filter.status = status;

    const cases = await BeneficiaryCase.find(filter)
      .populate("organizationId", "orgName orgType address verificationStatus")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ cases, count: cases.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 5. Admin: Review Beneficiary Case (Approve / Reject / Request Info) ─── */
exports.adminReviewCase = async (req, res) => {
  try {
    const { decision, decisionNotes, rejectionReason } = req.body;
    if (!["approved", "rejected", "additional_info_required"].includes(decision)) {
      return res.status(400).json({ message: "Invalid review decision." });
    }
    if (decision === "rejected" && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({ message: "A rejection reason is required." });
    }
    if (decision === "additional_info_required" && (!decisionNotes || !decisionNotes.trim())) {
      return res.status(400).json({ message: "Please specify what additional information is required." });
    }

    const caseDoc = await BeneficiaryCase.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ message: "Beneficiary case not found." });
    }

    let newStatus = "verified";
    if (decision === "rejected") newStatus = "rejected";
    if (decision === "additional_info_required") newStatus = "additional_info_required";

    caseDoc.status = newStatus;
    caseDoc.verificationDetails = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      decision,
      decisionNotes: decisionNotes || "",
      rejectionReason: rejectionReason || "",
    };

    caseDoc.statusHistory.push({
      status: newStatus,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: `Admin Review Decision: ${decision.toUpperCase()}. ${decisionNotes || rejectionReason || ""}`.trim(),
    });

    await caseDoc.save();

    // When approved, automatically publish open Requirements so donors can immediately see & donate supplies!
    if (decision === "approved") {
      await publishNeedsToRequirements(caseDoc);
    }

    // Notify organization
    if (caseDoc.createdBy) {
      await createNotification(
        caseDoc.createdBy,
        `Beneficiary Case ${decision === "approved" ? "Verified" : decision.replace(/_/g, " ")}`,
        `Case ${caseDoc.caseNumber} for "${caseDoc.headOfHouseholdName}" was reviewed: ${decision.toUpperCase()}.`,
        "system",
        caseDoc._id,
        "Requirement"
      );
    }

    res.json({
      message: `Beneficiary case status updated to ${newStatus}.`,
      case: caseDoc,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 6. Link Resources to Beneficiary Case (NGO) ─── */
exports.linkResources = async (req, res) => {
  try {
    const { requirementId, donationId, deliveryId } = req.body;
    const caseDoc = await BeneficiaryCase.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: "Case not found." });

    const org = await getAuthorizedOrg(req.user._id, req.user.role);
    if (req.user.role !== "admin" && caseDoc.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized for this case." });
    }

    if (requirementId) {
      const reqDoc = await Requirement.findById(requirementId);
      if (!reqDoc) return res.status(404).json({ message: "Requirement not found." });
      if (
        req.user.role !== "admin" &&
        reqDoc.organizationId.toString() !== org._id.toString()
      ) {
        return res.status(403).json({ message: "Requirement does not belong to your organization." });
      }
      if (!caseDoc.linkedRequirements.includes(requirementId)) {
        caseDoc.linkedRequirements.push(requirementId);
      }
    }

    if (donationId) {
      const donDoc = await Donation.findById(donationId);
      if (!donDoc) return res.status(404).json({ message: "Donation not found." });
      if (!caseDoc.linkedDonations.includes(donationId)) {
        caseDoc.linkedDonations.push(donationId);
      }
    }

    if (deliveryId) {
      const delDoc = await Delivery.findById(deliveryId);
      if (!delDoc) return res.status(404).json({ message: "Delivery not found." });
      if (!caseDoc.linkedDeliveries.includes(deliveryId)) {
        caseDoc.linkedDeliveries.push(deliveryId);
      }
    }

    await caseDoc.save();
    res.json({ message: "Resources linked to case successfully.", case: caseDoc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 7. Record Assistance Distribution (NGO Worker Handover) ─── */
exports.recordDistribution = async (req, res) => {
  try {
    const {
      category,
      itemName,
      quantityDistributed,
      unit,
      distributionDate,
      distributionMethod,
      relatedDonationId,
      relatedDeliveryId,
      relatedRequirementId,
      recipientAcknowledgement,
      notes,
    } = req.body;

    const caseDoc = await BeneficiaryCase.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: "Beneficiary case not found." });

    const org = await getAuthorizedOrg(req.user._id, req.user.role);
    if (req.user.role !== "admin" && caseDoc.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized to record distributions for this case." });
    }

    // Gate: Case MUST be verified or assistance in progress
    if (!["verified", "assistance_in_progress", "follow_up_required"].includes(caseDoc.status)) {
      return res.status(400).json({
        message: `Cannot distribute assistance: Case status is "${caseDoc.status}". The case must be verified by admin review before distribution.`,
      });
    }

    const distQty = Number(quantityDistributed);
    if (!distQty || distQty <= 0) {
      return res.status(400).json({ message: "Quantity distributed must be a positive number." });
    }

    // Locate matching needed item in the case
    const neededItem = caseDoc.neededItems.find(
      (item) => item.itemName.toLowerCase() === itemName.trim().toLowerCase()
    );

    if (neededItem) {
      neededItem.quantityDistributed = (neededItem.quantityDistributed || 0) + distQty;
    }

    const distRef = await generateDistributionReference();

    const distribution = await AssistanceDistribution.create({
      distributionReference: distRef,
      beneficiaryCaseId: caseDoc._id,
      organizationId: org ? org._id : caseDoc.organizationId,
      category: category || neededItem?.category || "food",
      itemName: itemName.trim(),
      quantityDistributed: distQty,
      unit: unit || neededItem?.unit || "Items",
      distributionDate: distributionDate ? new Date(distributionDate) : new Date(),
      recordedBy: req.user._id,
      relatedDonationId: relatedDonationId || null,
      relatedDeliveryId: relatedDeliveryId || null,
      relatedRequirementId: relatedRequirementId || null,
      distributionMethod: distributionMethod || "direct_ngo_handover",
      recipientAcknowledgement: recipientAcknowledgement || {
        recipientName: caseDoc.headOfHouseholdName,
        relationshipToHead: "Self",
        acknowledgementType: "worker_attestation",
        notes: "Direct distribution recorded by NGO worker.",
      },
      confirmationStatus: "confirmed",
      notes: notes || "",
    });

    // Auto-link references if provided
    if (relatedDonationId && !caseDoc.linkedDonations.includes(relatedDonationId)) {
      caseDoc.linkedDonations.push(relatedDonationId);
    }
    if (relatedDeliveryId && !caseDoc.linkedDeliveries.includes(relatedDeliveryId)) {
      caseDoc.linkedDeliveries.push(relatedDeliveryId);
    }
    if (relatedRequirementId && !caseDoc.linkedRequirements.includes(relatedRequirementId)) {
      caseDoc.linkedRequirements.push(relatedRequirementId);
    }

    // Re-evaluate fulfillment status
    const allDists = await AssistanceDistribution.find({ beneficiaryCaseId: caseDoc._id });
    const fulfillment = calculateCaseFulfillment(caseDoc.neededItems, allDists);

    if (fulfillment.allItemsFulfilled) {
      caseDoc.status = "closed";
      caseDoc.statusHistory.push({
        status: "closed",
        changedBy: req.user._id,
        changedAt: new Date(),
        notes: `All assessed needs fulfilled via distribution ${distRef}. Case closed automatically.`,
      });
    } else {
      caseDoc.status = "assistance_in_progress";
      caseDoc.statusHistory.push({
        status: "assistance_in_progress",
        changedBy: req.user._id,
        changedAt: new Date(),
        notes: `Recorded distribution of ${distQty} ${unit || "units"} (${distRef}). Fulfillment: ${fulfillment.overallPercentage}%.`,
      });
    }

    await caseDoc.save();

    res.status(201).json({
      message: "Assistance distribution recorded successfully.",
      distribution,
      case: caseDoc,
      fulfillment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 8. Flag Dispute on Assistance Distribution ─── */
exports.flagDisputeDistribution = async (req, res) => {
  try {
    const { disputeNotes } = req.body;
    if (!disputeNotes || !disputeNotes.trim()) {
      return res.status(400).json({ message: "Dispute explanation notes are required." });
    }

    const dist = await AssistanceDistribution.findById(req.params.distId);
    if (!dist) return res.status(404).json({ message: "Distribution record not found." });

    dist.confirmationStatus = "disputed";
    dist.disputeNotes = disputeNotes.trim();
    dist.disputedBy = req.user._id;
    dist.disputedAt = new Date();
    dist.followUpRequired = true;
    await dist.save();

    // Update case status to follow_up_required
    await BeneficiaryCase.findByIdAndUpdate(dist.beneficiaryCaseId, {
      status: "follow_up_required",
      $push: {
        statusHistory: {
          status: "follow_up_required",
          changedBy: req.user._id,
          changedAt: new Date(),
          notes: `Distribution ${dist.distributionReference} was disputed: ${disputeNotes}`,
        },
      },
    });

    res.json({ message: "Distribution marked as disputed. Case flagged for follow-up.", distribution: dist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 9. Record Follow-Up Findings & Monitoring (NGO) ─── */
exports.addFollowUpNote = async (req, res) => {
  try {
    const { findings, actionTaken } = req.body;
    if (!findings || !findings.trim()) {
      return res.status(400).json({ message: "Follow-up findings are required." });
    }

    const caseDoc = await BeneficiaryCase.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: "Case not found." });

    const org = await getAuthorizedOrg(req.user._id, req.user.role);
    if (req.user.role !== "admin" && caseDoc.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    caseDoc.followUpNotes.push({
      noteDate: new Date(),
      staffId: req.user._id,
      findings: findings.trim(),
      actionTaken: actionTaken ? actionTaken.trim() : "",
    });

    await caseDoc.save();
    res.json({ message: "Follow-up note recorded successfully.", case: caseDoc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 10. Close Case (with Mandatory Rationale if Unmet) ─── */
exports.closeCase = async (req, res) => {
  try {
    const { closureReason, unmetNeedsRationale } = req.body;
    if (!closureReason || !closureReason.trim()) {
      return res.status(400).json({ message: "A case closure reason is required." });
    }

    const caseDoc = await BeneficiaryCase.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: "Case not found." });

    const org = await getAuthorizedOrg(req.user._id, req.user.role);
    if (req.user.role !== "admin" && caseDoc.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: "Not authorized to close this case." });
    }

    // Check if there are outstanding unmet needs
    const distributions = await AssistanceDistribution.find({ beneficiaryCaseId: caseDoc._id });
    const fulfillment = calculateCaseFulfillment(caseDoc.neededItems, distributions);

    if (!fulfillment.allItemsFulfilled && (!unmetNeedsRationale || !unmetNeedsRationale.trim())) {
      return res.status(400).json({
        message: "This case has outstanding unmet needs. Please provide an unmet needs rationale before closing.",
      });
    }

    caseDoc.status = "closed";
    caseDoc.closureDetails = {
      closedBy: req.user._id,
      closedAt: new Date(),
      closureReason: closureReason.trim(),
      unmetNeedsRationale: unmetNeedsRationale ? unmetNeedsRationale.trim() : "",
    };

    caseDoc.statusHistory.push({
      status: "closed",
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: `Case closed by staff. Reason: ${closureReason.trim()}`,
    });

    await caseDoc.save();
    res.json({ message: "Beneficiary case closed successfully.", case: caseDoc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 11. Traceability Audit: Trace Donation or Delivery to Beneficiaries ─── */
exports.getTraceabilityReport = async (req, res) => {
  try {
    const { donationId, deliveryId } = req.query;
    const filter = {};
    if (donationId) filter.relatedDonationId = donationId;
    if (deliveryId) filter.relatedDeliveryId = deliveryId;

    if (!donationId && !deliveryId) {
      return res.status(400).json({ message: "Please provide a donationId or deliveryId to trace." });
    }

    const distributions = await AssistanceDistribution.find(filter)
      .populate("beneficiaryCaseId", "caseNumber headOfHouseholdName area priority status")
      .populate("organizationId", "orgName address")
      .populate("recordedBy", "fullName email")
      .sort({ distributionDate: -1 });

    const totalUnits = distributions.reduce((sum, d) => sum + (d.quantityDistributed || 0), 0);

    res.json({
      query: { donationId, deliveryId },
      totalDistributedUnits: totalUnits,
      distributionEventsCount: distributions.length,
      distributions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── Helper: Publish Beneficiary Case Needs to Open NGO Requirements ─── */
async function publishNeedsToRequirements(caseDoc) {
  const createdReqs = [];
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

    // Extract exact latest image uploaded during beneficiary case creation
    let evidenceImg = "";
    if (caseDoc.supportingEvidence && caseDoc.supportingEvidence.length > 0) {
      const foundImg =
        caseDoc.supportingEvidence.slice().reverse().find((e) =>
          e.fileUrl && /\.(jpe?g|png|webp|gif|svg)$/i.test(e.fileUrl)
        ) || caseDoc.supportingEvidence[caseDoc.supportingEvidence.length - 1];
      if (foundImg && foundImg.fileUrl) {
        evidenceImg = foundImg.fileUrl;
      }
    }

    // Check if requirement already exists for this beneficiary case or title
    let existing = await Requirement.findOne({
      beneficiaryCaseId: caseDoc._id,
      title,
      status: { $in: ["open", "pending", "matched"] },
    });

    if (!existing) {
      existing = await Requirement.findOne({
        organizationId: caseDoc.organizationId,
        title,
        status: { $in: ["open", "pending", "matched"] },
      });
    }

    if (existing) {
      // Sync image, case reference, and demographic details
      existing.beneficiaryCaseId = caseDoc._id;
      existing.beneficiaryType = "Verified Beneficiary Household";
      existing.beneficiaryCount = caseDoc.householdSize || existing.beneficiaryCount || 1;
      if (evidenceImg) existing.imageUrl = evidenceImg;
      if (caseDoc.assessmentRationale) {
        existing.description = `${caseDoc.assessmentRationale} (Case Ref: ${caseDoc.caseNumber})`;
      }
      await existing.save();
      createdReqs.push(existing);
    } else {
      const newReq = await Requirement.create({
        organizationId: caseDoc.organizationId,
        postedBy: caseDoc.createdBy || caseDoc.assignedStaff,
        category: cat,
        title,
        description: caseDoc.assessmentRationale
          ? `${caseDoc.assessmentRationale} (Case Ref: ${caseDoc.caseNumber})`
          : `Verified relief requirement assessed for a household (${caseDoc.householdSize} members) in ${caseDoc.area}. Case Ref: ${caseDoc.caseNumber}.`,
        quantity: remaining,
        fulfilledQuantity: 0,
        unit: item.unit || "Items",
        urgency: item.urgency || caseDoc.priority || "high",
        location: caseDoc.area,
        latitude: caseDoc.latitude,
        longitude: caseDoc.longitude,
        imageUrl: evidenceImg,
        beneficiaryType: "Verified Beneficiary Household",
        beneficiaryCount: caseDoc.householdSize || 1,
        beneficiaryCaseId: caseDoc._id,
        status: "open",
      });

      createdReqs.push(newReq);
      if (!caseDoc.linkedRequirements.includes(newReq._id)) {
        caseDoc.linkedRequirements.push(newReq._id);
      }
    }
  }

  if (createdReqs.length > 0) {
    await caseDoc.save();
  }
  return createdReqs;
}

/* ─── 12. Manual Publish Needs as Open Requirements (NGO / Admin) ─── */
exports.publishCaseAsRequirement = async (req, res) => {
  try {
    const caseDoc = await BeneficiaryCase.findById(req.params.id);
    if (!caseDoc) return res.status(404).json({ message: "Case not found." });
    if (!["verified", "assistance_in_progress", "follow_up_required"].includes(caseDoc.status)) {
      return res.status(400).json({ message: "Case must be verified before publishing donor requirements." });
    }

    const createdReqs = await publishNeedsToRequirements(caseDoc);
    res.json({
      message: `Published ${createdReqs.length} requirement(s) for donor contributions.`,
      requirements: createdReqs,
      case: caseDoc,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 13. Public / Donor View: Verified Beneficiary Needs ─── */
exports.getPublicVerifiedNeeds = async (req, res) => {
  try {
    const cases = await BeneficiaryCase.find({
      status: { $in: ["verified", "assistance_in_progress", "follow_up_required"] },
    })
      .populate("organizationId", "orgName address verificationStatus")
      .select("caseNumber area priority neededItems status createdAt organizationId")
      .sort({ priority: 1, createdAt: -1 });

    // Filter to only cases that have unmet remaining quantities
    const verifiedNeeds = cases.map((c) => {
      const remainingItems = (c.neededItems || []).filter(
        (i) => (i.quantityNeeded || 0) > (i.quantityDistributed || 0)
      );
      return {
        _id: c._id,
        caseNumber: c.caseNumber,
        area: c.area,
        priority: c.priority,
        organization: c.organizationId?.orgName || "Verified NGO",
        organizationAddress: c.organizationId?.address || "",
        neededItems: remainingItems.map((i) => ({
          itemName: i.itemName,
          category: i.category,
          quantityNeeded: i.quantityNeeded,
          quantityDistributed: i.quantityDistributed,
          remainingQuantity: Math.max(0, (i.quantityNeeded || 0) - (i.quantityDistributed || 0)),
          unit: i.unit,
        })),
        createdAt: c.createdAt,
      };
    }).filter((c) => c.neededItems.length > 0);

    res.json({ verifiedNeeds, count: verifiedNeeds.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─── 14. Get Public/Donor Verified Case Details by Case Number or ID ─── */
exports.getCaseDetailsByRefOrId = async (req, res) => {
  try {
    const { refOrId } = req.params;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(refOrId)) {
      query._id = refOrId;
    } else {
      query.caseNumber = refOrId;
    }

    const caseDoc = await BeneficiaryCase.findOne(query)
      .populate("organizationId", "orgName orgType address verificationStatus")
      .populate("createdBy", "fullName")
      .populate("assignedStaff", "fullName")
      .populate("verificationDetails.reviewedBy", "fullName");

    if (!caseDoc) {
      return res.status(404).json({ message: "Beneficiary case not found." });
    }

    const distributions = await AssistanceDistribution.find({ beneficiaryCaseId: caseDoc._id })
      .select("distributionReference distributionDate itemName category quantityDistributed unit confirmationStatus");

    const Requirement = require("../models/requirementModel");
    const matchingReqs = await Requirement.find({
      $or: [
        { beneficiaryCaseId: caseDoc._id },
        { _id: { $in: (caseDoc.linkedRequirements || []).map((r) => r._id || r) } },
        { description: new RegExp(caseDoc.caseNumber, "i") },
      ],
    }).select("_id");

    const allReqIds = [
      ...new Set([
        ...(caseDoc.linkedRequirements || []).map((r) => (r._id || r).toString()),
        ...matchingReqs.map((r) => r._id.toString()),
      ]),
    ];

    const reqObjIds = allReqIds.map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id));

    const relatedDonations = await Donation.find({
      $or: [
        { _id: { $in: caseDoc.linkedDonations || [] } },
        { matchedRequirement: { $in: [...reqObjIds, ...allReqIds] } },
      ],
      status: { $nin: ["cancelled", "rejected"] },
    });

    const fulfillment = calculateCaseFulfillment(caseDoc.neededItems, distributions, relatedDonations);
    const sanitized = sanitizeBeneficiaryForViewer(caseDoc, req.user || {}, false);

    res.json({
      case: sanitized,
      distributions,
      fulfillment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


