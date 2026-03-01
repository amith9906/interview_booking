const { startAdminOpsReminders } = require('./adminOpsReminders');
const { startQuizAutomation } = require('./quizAutomation');

let adminTask = null;
let quizJob = null;

const startBackgroundJobs = () => {
  if (adminTask || quizJob) {
    return { adminTask, quizJob };
  }

  adminTask = startAdminOpsReminders();
  quizJob = startQuizAutomation();

  console.info('[BackgroundJobs] started');
  return { adminTask, quizJob };
};

const stopBackgroundJobs = async () => {
  if (quizJob && typeof quizJob.stop === 'function') {
    quizJob.stop();
  }

  if (adminTask && typeof adminTask.stop === 'function') {
    adminTask.stop();
  }

  adminTask = null;
  quizJob = null;
  console.info('[BackgroundJobs] stopped');
};

if (require.main === module) {
  startBackgroundJobs();

  const teardown = async () => {
    await stopBackgroundJobs();
    process.exit(0);
  };

  process.on('SIGTERM', teardown);
  process.on('SIGINT', teardown);
}

module.exports = { startBackgroundJobs, stopBackgroundJobs };
