const { checkInfraHealth } = require('../services/monitoringService');

const getHealth = (req, res) => {
  const status = checkInfraHealth();
  res.json({
    status: 'ok',
    infra: status,
    timestamp: status.timestamp
  });
};

module.exports = { getHealth };
