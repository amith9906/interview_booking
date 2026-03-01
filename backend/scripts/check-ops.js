const required = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLOUDINARY_URL',
  'SMTP_HOST',
  'SMTP_USER'
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

const validateCloudinary = (url) => /^cloudinary:\/\/[^:]+:[^@]+@[^/]+\/[^/]+$/.test(url);
if (!validateCloudinary(process.env.CLOUDINARY_URL)) {
  console.error('CLOUDINARY_URL is not in the expected format (cloudinary://API_KEY:API_SECRET@cloud_name).');
  process.exit(1);
}

console.log('Stripe keys present, Cloudinary format valid, SMTP settings available.');
console.log('Run `stripe listen` or check Cloudinary uploads as needed to prove connectivity.');
