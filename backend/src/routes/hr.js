const express = require('express');
const hrController = require('../controllers/hrController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = express.Router();
router.use(authenticate, authorize('hr'));

router.get('/resumes', hrController.listResumes);
router.get('/resumes/:id', hrController.downloadResume);
router.get('/resumes/:id/cost', hrController.getResumeCost);
router.post('/subscription/subscribe', hrController.subscribe);
router.get('/analytics', hrController.getHrAnalytics);
router.post('/resumes/bulk-download', hrController.bulkDownloadResumes);

// Feedback Review (DEF-025, DEF-032)
router.get('/feedback/pending', hrController.listPendingFeedback);
router.post('/feedback/:id/approve', hrController.approveFeedback);

module.exports = router;
