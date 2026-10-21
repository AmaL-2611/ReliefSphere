const express = require("express");
const router = express.Router();
const beneficiaryController = require("../controllers/beneficiaryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// ── Case Management (NGO & Platform) ──
router.post("/", protect, beneficiaryController.createCase);
router.get("/", protect, beneficiaryController.getOrganizationCases);
router.get("/public/verified-needs", beneficiaryController.getPublicVerifiedNeeds);
router.get("/case-info/:refOrId", protect, beneficiaryController.getCaseDetailsByRefOrId);
router.get("/traceability-report", protect, beneficiaryController.getTraceabilityReport);

// ── Admin Review & Verification ──
router.get("/admin/pending", protect, adminOnly, beneficiaryController.adminGetPendingCases);
router.put("/:id/admin-review", protect, adminOnly, beneficiaryController.adminReviewCase);

// ── Supporting Evidence Upload ──
router.post("/upload-evidence", protect, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded or invalid file format." });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    message: "Evidence file uploaded successfully.",
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// ── Specific Case Operations ──
router.get("/:id", protect, beneficiaryController.getCaseDetails);
router.post("/:id/link", protect, beneficiaryController.linkResources);
router.post("/:id/publish", protect, beneficiaryController.publishCaseAsRequirement);
router.post("/:id/distribute", protect, beneficiaryController.recordDistribution);
router.put("/distributions/:distId/dispute", protect, beneficiaryController.flagDisputeDistribution);
router.post("/:id/follow-up", protect, beneficiaryController.addFollowUpNote);
router.put("/:id/close", protect, beneficiaryController.closeCase);

module.exports = router;
