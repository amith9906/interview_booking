const { logError } = require('../services/monitoringService');
const {
  publishScheduledQuizzes,
  seedDailyAssignments,
  remindPendingAssignments
} = require('../services/quizService');

const DAILY_MS = 24 * 60 * 60 * 1000;

const runDailyTask = async () => {
  try {
    await publishScheduledQuizzes();
    await seedDailyAssignments();
  } catch (err) {
    logError(err, { path: 'quizAutomation.runDailyTask' });
  }
};

const runReminderTask = async () => {
  try {
    await remindPendingAssignments();
  } catch (err) {
    logError(err, { path: 'quizAutomation.runReminderTask' });
  }
};

const startQuizAutomation = () => {
  runDailyTask();
  runReminderTask();
  setInterval(runDailyTask, DAILY_MS);
  setInterval(runReminderTask, DAILY_MS);
};

module.exports = { startQuizAutomation };
