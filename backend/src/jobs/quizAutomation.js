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
  if (process.env.DISABLE_QUIZ_AUTOMATION === 'true') {
    console.info('[QuizAutomation] disabled via env');
    return {
      stop: () => {}
    };
  }

  const timers = [];

  const schedule = () => {
    timers.push(setInterval(runDailyTask, DAILY_MS));
    timers.push(setInterval(runReminderTask, DAILY_MS));
  };

  runDailyTask();
  runReminderTask();
  schedule();

  return {
    stop: () => {
      timers.forEach((timer) => clearInterval(timer));
      timers.length = 0;
    }
  };
};

module.exports = { startQuizAutomation };
