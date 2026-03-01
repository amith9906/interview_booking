const express = require('express');
const { listResumes, downloadResume, subscribe, getHrAnalytics, getResumeCost } = require('../controllers/hrController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = express.Router();
router.use(authenticate, authorize('hr'));
router.get('/resumes', listResumes);
router.post('/resumes/:id/download', downloadResume);
router.get('/resumes/:id/cost', getResumeCost);
router.post('/subscribe', subscribe);
router.get('/analytics', getHrAnalytics);

module.exports = router;
