'use strict';

const path = require('path');
const fs = require('fs');
const { checkInfraHealth } = require('../src/services/monitoringService');

const dotenvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
}

const status = checkInfraHealth();

console.log('Infra health check result:');
Object.entries(status).forEach(([key, value]) => {
  if (key === 'timestamp') return;
  console.log(`- ${key}: ${value.healthy ? 'healthy' : 'unhealthy'} (${value.reason})`);
});

if (!status.stripeWebhook.healthy || !status.cloudinary.healthy) {
  console.error('Infra health check failed');
  process.exit(1);
}

console.log('All critical infra checks passed.');
