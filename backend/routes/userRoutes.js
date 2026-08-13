const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const { getMyProfile, updateMyProfile, uploadAvatar } = require("../controllers/userController");

router.use(protect);

router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.post("/profile/avatar", upload.single("avatar"), uploadAvatar);

module.exports = router;
