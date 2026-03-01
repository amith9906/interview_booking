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
const { logError, alertIfCritical } = require('./services/monitoringService');
const { ensureEnvVars, parseAllowedOrigins } = require('./utils/env');
const { runPendingMigrations } = require('./utils/runMigrations');
const { startBackgroundJobs, stopBackgroundJobs } = require('./jobs/backgroundManager');

const app = express();
const environment = process.env.NODE_ENV || 'development';

ensureEnvVars(['DATABASE_URL', 'JWT_SECRET', 'STRIPE_SECRET_KEY']);
ensureEnvVars(
  ['FRONTEND_URL', 'STRIPE_WEBHOOK_SECRET', 'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'],
  { productionOnly: true }
);

const allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_URL);
if (environment === 'production' && !allowedOrigins.length) {
  throw new Error('In production FRONTEND_URL is required so that the API can validate CORS origins.');
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS policy.`));
  },
  optionsSuccessStatus: 200
};

app.set('trust proxy', 'loopback');
app.use(helmet());
app.use(cors(corsOptions));
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

let server;

const closeExpress = () =>
  new Promise((resolve, reject) => {
    if (!server) {
      return resolve();
    }
    server.close((err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });

const start = async () => {
  try {
    await runPendingMigrations();
    await sequelize.authenticate();
    const shouldRunJobs =
      environment === 'production' ? process.env.RUN_BACKGROUND_JOBS === 'true' : process.env.RUN_BACKGROUND_JOBS !== 'false';
    if (shouldRunJobs) {
      startBackgroundJobs();
    } else {
      console.info('[BackgroundJobs] disabled for this process (RUN_BACKGROUND_JOBS=false)');
    }

    const port = process.env.PORT || 5000;
    server = app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.warn(`[Server] Received ${signal}, shutting down gracefully`);
  try {
    await stopBackgroundJobs();
  } catch (err) {
    console.error('[BackgroundJobs] error while stopping', err);
  }
  try {
    await closeExpress();
  } catch (err) {
    console.error('[Server] error while closing the HTTP server', err);
  }
  try {
    await sequelize.close();
  } catch (err) {
    console.error('[Database] error while closing connection', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logError(reason, { path: 'process', method: 'unhandledRejection' });
});

process.on('uncaughtException', (error) => {
  logError(error, { path: 'process', method: 'uncaughtException' });
  alertIfCritical('Uncaught exception, restarting might be required', {});
});

start();
