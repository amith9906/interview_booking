const { logError, alertIfCritical } = require('../services/monitoringService');

module.exports = (err, req, res, next) => {
  logError(err, {
    path: req.path,
    method: req.method,
    user: req.user?.id
  });
  if (!err.status || err.status >= 500) {
    alertIfCritical('Unhandled error', { path: req.path, method: req.method });
  }
  res.status(err.status || 500).json({ message: err.message || 'Internal error' });
};
