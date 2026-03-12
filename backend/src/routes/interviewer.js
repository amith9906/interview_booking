const express = require('express');
const {
  getBookings,
  rateInterview,
  getInterviewerAnalytics,
  startInterview,
  acknowledgeBooking,
  rescheduleBooking,
  rejectBooking,
  downloadResumeForInterviewer
} = require('../controllers/interviewerController');
const {
  createResource,
  listResources,
  assignResourceToStudents,
  downloadResource,
  resourceUpload
} = require('../controllers/resourceController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ensureProfileComplete = require('../middlewares/ensureProfileComplete');

const router = express.Router();
router.use(authenticate, authorize('interviewer'), ensureProfileComplete());
router.get('/bookings', getBookings);
router.patch('/bookings/:id/start', startInterview);
router.post('/bookings/:id/acknowledge', acknowledgeBooking);
router.post('/bookings/:id/reschedule', rescheduleBooking);
router.post('/bookings/:id/reject', rejectBooking);
router.post('/rate', rateInterview);
router.get('/resumes/:id', downloadResumeForInterviewer);
router.get('/analytics', getInterviewerAnalytics);
router.get('/resources', listResources);
router.post('/resources', resourceUpload.single('file'), createResource);
router.post('/resources/:id/assign', assignResourceToStudents);
router.get('/resources/:id/download', downloadResource);

module.exports = router;
