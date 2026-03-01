const express = require('express');
const authRoutes = require('./auth');
const studentRoutes = require('./student');
const interviewerRoutes = require('./interviewer');
const hrRoutes = require('./hr');
const adminRoutes = require('./admin');
const uploadRoutes = require('./upload');
const profileRoutes = require('./profile');
const notificationRoutes = require('./notifications');
const quizRoutes = require('./quiz');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();
router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/interviewer', interviewerRoutes);
router.use('/hr', hrRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/profiles', profileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/quizzes', quizRoutes);
router.get('/health', getHealth);

module.exports = router;
