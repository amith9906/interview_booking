const express = require('express');
const authenticate = require('../middlewares/authenticate');
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  verifyResetCode,
  resendVerificationCode
} = require('../controllers/authController');

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticate, changePassword);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.post('/verify-reset-code', verifyResetCode);
router.post('/resend-verification', resendVerificationCode);
module.exports = router;
