const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { signup, login, googleSignIn, forgotPassword, resetPassword } = require('../controllers/authController');

router.post(
  '/signup',
  upload.fields([
    { name: 'verificationDoc', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
  ]),
  signup,
);

router.post('/login', login);
router.post('/google', googleSignIn);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
