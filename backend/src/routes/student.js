const express = require('express');
const {
  searchInterviews,
  bookSlot,
  feedbackDashboard,
  listCourses,
  enrollCourses,
  verifySession,
  getStudentAnalytics,
  downloadFeedbackReport,
  emailFeedbackReport,
  listCompanies,
  listInternships,
  enrollInternship,
  submitStudentFeedback,
  listStudentBookings,
  cancelBooking
} = require('../controllers/studentController');
const { listStudentResources, downloadStudentResource } = require('../controllers/resourceController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const ensureProfileComplete = require('../middlewares/ensureProfileComplete');
const { validateBody } = require('../middlewares/validate');
const {
  bookSlotSchema,
  enrollCoursesSchema,
  enrollInternshipSchema,
  verifySessionSchema,
  submitInterviewFeedbackSchema
} = require('../schemas/studentSchemas');

const router = express.Router();
router.use(authenticate, authorize('student'), ensureProfileComplete());
router.get('/search', searchInterviews);
router.get('/companies', listCompanies);
router.get('/bookings', listStudentBookings);
router.post('/bookings', validateBody(bookSlotSchema), bookSlot);
router.get('/feedback', feedbackDashboard);
router.get('/feedback/:bookingId/report', downloadFeedbackReport);
router.post('/feedback/:bookingId', validateBody(submitInterviewFeedbackSchema), submitStudentFeedback);
router.post('/feedback/:bookingId/report/email', emailFeedbackReport);
router.get('/courses', listCourses);
router.post('/courses', validateBody(enrollCoursesSchema), enrollCourses);
router.get('/internships', listInternships);
router.post('/internships', validateBody(enrollInternshipSchema), enrollInternship);
router.post('/sessions/verify', validateBody(verifySessionSchema), verifySession);
router.get('/analytics', getStudentAnalytics);
router.get('/resources', listStudentResources);
router.get('/resources/:id/download', downloadStudentResource);

router.post('/cancel-booking/:bookingId', cancelBooking);

module.exports = router;
