const express = require('express');
const {
  createUser,
  createStudentProfile,
  createInterviewerProfile,
  updateStudentProfile,
  updateInterviewerProfile,
  getAnalytics,
  createCompany,
  listCompanies,
  createCourse,
  listCourses,
  toggleCoursePublish,
  getCourseAnalytics,
  createInternship,
  listInternships,
  toggleInternshipPublish,
  listInternshipRegistrations,
  getInternshipAnalytics,
  createSkill,
  listSkills,
  updateInterviewer,
  createBookingOnBehalf,
  listInterviewers,
  exportReports,
  listPendingProfiles,
  verifyProfile,
  toggleProfileActive,
  getConsultancyAnalytics,
  exportConsultancyAnalytics,
  addConsultancyCredits,
  updateConsultancyStatus,
  updateCompany,
  toggleCompanyPublish,
  updateSkill,
  toggleSkillPublish,
  listBookingsWithFeedback,
  listUsers,
  listStudentProfiles,
  downloadResumeForAdmin,
  publishResumeForAdmin,
  getResumeCostForAdmin,
  downloadFeedbackTemplate,
  getRoleAnalytics,
  exportRoleAnalytics,
  getAdminOverview,
  listPaymentAudits,
  getRoleTrend,
  exportCourseAnalytics,
  exportInternshipAnalytics,
  exportFeedbackHistory,
  createPointsRule,
  listPointsRules,
  listInterviewerFeedback,
  updateInterviewerRate,
  editInterviewFeedback,
  editStudentFeedback,
  publishInterviewFeedback,
  adminCompleteInterview,
  getStudentDetail,
  uploadStudentResume,
  getHrPipeline,
  moveHrPipelineStage,
  startInterview,
  getCourseRegistrations,
  getInternshipRegistrations
} = require('../controllers/adminController');
const {
  listQuizCatalog,
  createQuizCatalog,
  updateQuizCatalog,
  toggleQuizPublish,
  getQuizKpi
} = require('../controllers/quizController');
const {
  createResource,
  assignResourceToStudents,
  listResources,
  listAssignments,
  listResourceAudits,
  downloadResource,
  publishResourceToHr
} = require('../controllers/resourceController');
const { validateBody } = require('../middlewares/validate');
const {
  createUserSchema,
  createCompanySchema,
  updateCompanySchema,
  createCourseSchema,
  createInternshipSchema,
  createSkillSchema,
  updateSkillSchema,
  addConsultancyCreditsSchema,
  createResourceSchema,
  assignResourceSchema,
  createStudentProfileSchema,
  createInterviewerProfileSchema,
  updateStudentProfileSchema,
  updateInterviewerProfileSchema
} = require('../schemas/adminSchemas');
const { createQuizCatalogSchema, updateQuizCatalogSchema } = require('../schemas/quizSchemas');
const rateLimit = require('express-rate-limit');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { getOpsMetrics } = require('../controllers/opsController');

const router = express.Router();
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many admin requests in a short period.'
});
router.use(authenticate, authorize('admin'));
//router.use(adminLimiter);
router.post('/users', validateBody(createUserSchema), createUser);
router.post('/students', validateBody(createStudentProfileSchema), createStudentProfile);
router.post('/interviewers', validateBody(createInterviewerProfileSchema), createInterviewerProfile);
router.put('/students/:id', validateBody(updateStudentProfileSchema), updateStudentProfile);
router.put('/interviewers/:id', validateBody(updateInterviewerProfileSchema), updateInterviewerProfile);
router.get('/analytics', getAnalytics);
router.get('/ops/metrics', getOpsMetrics);
router.get('/analytics/role', getRoleAnalytics);
router.get('/analytics/role/trends', getRoleTrend);
router.get('/analytics/role/export', exportRoleAnalytics);
router.get('/analytics/detailed', getAdminOverview);
router.get('/payments/audit', listPaymentAudits);
router.post('/companies', validateBody(createCompanySchema), createCompany);
router.get('/companies', listCompanies);
router.post('/courses', validateBody(createCourseSchema), createCourse);
router.get('/courses', listCourses);
router.get('/courses/:id/students', getCourseRegistrations);
router.patch('/courses/:id/publish', toggleCoursePublish);
router.get('/courses/analytics', getCourseAnalytics);
router.get('/courses/analytics/export', exportCourseAnalytics);
router.post('/internships', validateBody(createInternshipSchema), createInternship);
router.get('/internships', listInternships);
router.get('/internships/:id/students', getInternshipRegistrations);
router.patch('/internships/:id/publish', toggleInternshipPublish);
router.get('/internships/registrations', listInternshipRegistrations);
router.get('/internships/analytics', getInternshipAnalytics);
router.get('/internships/analytics/export', exportInternshipAnalytics);
router.post('/skills', validateBody(createSkillSchema), createSkill);
router.get('/skills', listSkills);
router.get('/quizzes', listQuizCatalog);
router.post('/quizzes', validateBody(createQuizCatalogSchema), createQuizCatalog);
router.patch('/quizzes/:id', validateBody(updateQuizCatalogSchema), updateQuizCatalog);
router.patch('/quizzes/:id/publish', toggleQuizPublish);
router.get('/quizzes/kpi', getQuizKpi);
router.put('/interviewers/:id', updateInterviewer);
router.post('/bookings', createBookingOnBehalf);
router.get('/interviewers', listInterviewers);
router.get('/reports', exportReports);
router.get('/profiles/pending', listPendingProfiles);
router.patch('/profiles/:role/:id', verifyProfile);
router.patch('/profiles/:role/:id/active', toggleProfileActive);
router.get('/interviewers/:id/feedback', listInterviewerFeedback);
router.patch('/interviewers/:id/rate', updateInterviewerRate);
router.patch('/interviews/:interviewId/feedback', editInterviewFeedback);
router.post('/interviews/:id/publish-feedback', publishInterviewFeedback);
router.post('/bookings/:bookingId/complete', adminCompleteInterview);
router.patch('/bookings/:bookingId/start', startInterview);
router.patch('/students/:studentId/feedback', editStudentFeedback);
router.get('/students/:id', getStudentDetail);
router.post('/students/:id/resume', uploadStudentResume);
router.post('/points-rules', createPointsRule);
router.get('/points-rules', listPointsRules);
router.get('/consultancies/analytics', getConsultancyAnalytics);
router.get('/consultancies/analytics/export', exportConsultancyAnalytics);
router.get('/bookings', listBookingsWithFeedback);
router.get('/users/list', listUsers);
  router.get('/students', listStudentProfiles);
  router.get('/resumes/:id', downloadResumeForAdmin);
  router.get('/resumes/:id/cost', getResumeCostForAdmin);
  router.patch('/resumes/:id/publish', publishResumeForAdmin);
  router.get('/feedback/export', exportFeedbackHistory);
router.get('/templates/feedback/:interviewId', downloadFeedbackTemplate);
router.get('/resources', listResources);
router.post('/resources', validateBody(createResourceSchema), createResource);
router.post('/resources/:id/assign', validateBody(assignResourceSchema), assignResourceToStudents);
router.get('/resources/assignments', listAssignments);
router.get('/resources/:id/download', downloadResource);
router.patch('/resources/:id/publish-hr', publishResourceToHr);
router.get('/resources/audit', listResourceAudits);
router.post('/consultancies/:hrId/credits', validateBody(addConsultancyCreditsSchema), addConsultancyCredits);
router.patch('/consultancies/:hrId/status', updateConsultancyStatus);
router.put('/companies/:id', validateBody(updateCompanySchema), updateCompany);
router.patch('/companies/:id/publish', toggleCompanyPublish);
router.put('/skills/:id', validateBody(updateSkillSchema), updateSkill);
router.patch('/skills/:id/publish', toggleSkillPublish);
router.get('/hr/pipeline', getHrPipeline);
router.patch('/hr/pipeline/:studentId', moveHrPipelineStage);

module.exports = router;
