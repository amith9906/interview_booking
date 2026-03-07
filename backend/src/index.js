require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const routes = require('./routes');
const { sequelize } = require('./models');
const errorHandler = require('./middlewares/errorHandler');
const { handleStripeWebhook } = require('./controllers/webhookController');
const { startAdminOpsReminders } = require('./jobs/adminOpsReminders');
const { startQuizAutomation } = require('./jobs/quizAutomation');
const { startBookingSanityJob } = require('./jobs/bookingSanity');
const { logError, alertIfCritical } = require('./services/monitoringService');

const app = express();
app.set('trust proxy', 'loopback');
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(xssClean());
app.use(hpp());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
  })
);
app.use(express.urlencoded({ extended: false }));
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api', routes);
app.use(errorHandler);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    startAdminOpsReminders();
    startQuizAutomation();
    startBookingSanityJob();
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logError(reason, { path: 'process', method: 'unhandledRejection' });
  // keep the process alive but warn
});

process.on('uncaughtException', (error) => {
  logError(error, { path: 'process', method: 'uncaughtException' });
  alertIfCritical('Uncaught exception, restarting might be required', {});
});

start();
