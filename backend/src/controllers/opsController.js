const { buildOpsMetrics } = require('../services/opsMetricsService');

const getOpsMetrics = async (req, res) => {
  const metrics = await buildOpsMetrics();
  res.json({ metrics });
};

module.exports = { getOpsMetrics };
