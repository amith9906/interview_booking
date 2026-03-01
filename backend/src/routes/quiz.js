const express = require('express');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const {
  getTodayAssignment,
  submitAttempt,
  getStreaks,
  listQuizCatalog,
  exportQuizAttempts
} = require('../controllers/quizController');

const router = express.Router();
router.use(authenticate);
router.get('/assignment/today', getTodayAssignment);
router.post('/attempt', submitAttempt);
router.get('/streaks', getStreaks);
router.get('/catalog', authorize('admin'), listQuizCatalog);
router.get('/attempts/export', authorize('admin'), exportQuizAttempts);

module.exports = router;
