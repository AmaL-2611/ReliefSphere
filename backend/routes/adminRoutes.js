const express = require("express");

const router = express.Router();

const adminController = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect);
router.use(adminOnly);
router.get("/volunteers", adminController.getVolunteers);
router.get("/organizations", adminController.getOrganizations);
router.get("/donors", adminController.getDonors);

router.put("/volunteer/:id/approve", adminController.approveVolunteer);

router.put("/organizations/:id/approve", adminController.approveOrganization);

router.put("/volunteer/:id/reject", adminController.rejectVolunteer);

router.put("/organizations/:id/reject", adminController.rejectOrganization);

module.exports = router;
