const cloudinary = require('cloudinary').v2;
const { hasStripe } = require('./stripeService');

const isCloudinaryConfigured = () => {
  if (process.env.CLOUDINARY_URL) return true;
  return (
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET)
  );
};

const logError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  console.error(
    `[Monitoring][${timestamp}]`,
    context.method ? `${context.method} ${context.path}` : 'Unknown route',
    context.user ? `user=${context.user}` : '',
    error instanceof Error ? error.stack || error.message : error
  );
};

const alertIfCritical = (message, metadata = {}) => {
  const timestamp = new Date().toISOString();
  console.warn(`[Monitoring][ALERT][${timestamp}] ${message}`, metadata);
};

const checkStripeWebhook = () => {
  const healthy = Boolean(process.env.STRIPE_WEBHOOK_SECRET && hasStripe);
  return {
    healthy,
    reason: healthy ? 'webhooks configured' : 'missing STRIPE_WEBHOOK_SECRET or stripe SDK disabled'
  };
};

const checkCloudinary = () => ({
  healthy: isCloudinaryConfigured(),
  reason: isCloudinaryConfigured() ? 'configured' : 'cloudinary env vars missing'
});

const checkInfraHealth = () => ({
  stripeWebhook: checkStripeWebhook(),
  cloudinary: checkCloudinary(),
  timestamp: new Date().toISOString()
});

module.exports = {
  logError,
  alertIfCritical,
  checkInfraHealth,
  checkStripeWebhook,
  checkCloudinary
};
