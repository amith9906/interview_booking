const express = require('express');
const {
  getMyProfile,
  updateMyProfile
} = require('../controllers/profileController');
const { requestEmailChange, verifyEmailChange } = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = express.Router();
router.use(authenticate);
router.get('/me', getMyProfile);
router.put('/me', authorize('student', 'interviewer'), updateMyProfile);
router.post('/email-change', requestEmailChange);
router.post('/email-change/verify', verifyEmailChange);

module.exports = router;
