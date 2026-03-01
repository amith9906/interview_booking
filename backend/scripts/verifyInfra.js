const path = require('path');
const fs = require('fs');

const dotenvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
} else {
  console.warn('No .env file found, falling back to existing environment variables.');
}

const env = process.env;
const errors = [];

const requireEnv = (key, friendlyName) => {
  if (!env[key]) {
    errors.push(`${friendlyName || key} (${key}) is not set.`);
  }
};

requireEnv('STRIPE_SECRET_KEY', 'Stripe secret key');
requireEnv('STRIPE_WEBHOOK_SECRET', 'Stripe webhook secret');

if (!env.CLOUDINARY_URL) {
  const cloudinaryPieces = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = cloudinaryPieces.filter((key) => !env[key]);
  if (missing.length) {
    errors.push(
      `Cloudinary credentials are incomplete. Provide CLOUDINARY_URL or the combination of ${cloudinaryPieces.join(
        ', '
      )}.`
    );
  }
}

['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'].forEach((key) =>
  requireEnv(key, key.replace('_', ' ').toUpperCase())
);

if (errors.length) {
  console.error('❌ Infra verification failed:');
  errors.forEach((message) => console.error(` - ${message}`));
  console.error('Please populate the missing variables and rerun `npm run verify-infra`.');
  process.exit(1);
}

console.log('✅ Infra verification succeeded. All required secrets are present.');
