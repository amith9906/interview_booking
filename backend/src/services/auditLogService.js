const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const auditLogPath = path.join(logsDir, 'audit.log');

const logAudit = (req, action, metadata = {}) => {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      actor_id: req?.user?.id || 'system',
      actor_role: req?.user?.role || 'system',
      ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
      user_agent: req?.headers?.['user-agent'] || 'unknown',
      action,
      ...metadata
    };
    fs.appendFileSync(auditLogPath, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = { logAudit };
