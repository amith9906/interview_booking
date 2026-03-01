const cron = require('node-cron');
const { Op } = require('sequelize');
const { Booking, HrTransaction, PaymentAudit, User } = require('../models');
const { persistNotification, sendEmail } = require('../services/notificationService');

const REMINDER_SUBJECT = 'Daily operations reminder';
const REMINDER_CRON_EXPRESSION = '0 9 * * 1-5'; // 9AM weekdays (IST) remind exports & credits.

const formatCurrency = (value) => `₹${Number(value ?? 0).toLocaleString('en-IN')}`;

const buildMessage = (metrics) => {
  const formattedDate = metrics.startOfToday.toLocaleDateString('en-IN');
  return [
    `Daily ops reminder for ${formattedDate}`,
    `• Bookings created today: ${metrics.bookingsToday}`,
    `• Payment failures: ${metrics.paymentFailures}`,
    `• HR downloads today: ${metrics.downloadsToday} (credits spent: ${formatCurrency(metrics.creditsSpent)})`,
    `• Credits added today: ${formatCurrency(metrics.creditsAdded)}`,
    '',
    'Run the analytics/consultancy exports and reconcile credits before EOD if anything looks off.'
  ].join('\n');
};

const gatherMetrics = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const params = {
    today: { [Op.gte]: startOfToday }
  };

  const [
    bookingsToday,
    paymentFailures,
    downloadsToday,
    creditsAdded,
    creditsSpent
  ] = await Promise.all([
    Booking.count({ where: { created_at: params.today } }),
    PaymentAudit.count({ where: { status: 'failure', created_at: params.today } }),
    HrTransaction.count({ where: { type: 'download', created_at: params.today } }),
    HrTransaction.sum('credits_change', { where: { type: 'credit_add', created_at: params.today } }),
    HrTransaction.sum('credits_change', { where: { type: 'download', created_at: params.today } })
  ]);

  return {
    startOfToday,
    bookingsToday,
    paymentFailures,
    downloadsToday,
    creditsAdded: Number(creditsAdded ?? 0),
    creditsSpent: Math.abs(Number(creditsSpent ?? 0))
  };
};

const dispatchReminders = async (metrics, message) => {
  const admins = await User.findAll({ where: { role: 'admin' } });
  if (!admins.length) {
    return;
  }

  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        persistNotification({
          userId: admin.id,
          type: 'ops-reminder',
          message,
          meta: metrics
        }),
        sendEmail({
          to: admin.email,
          subject: REMINDER_SUBJECT,
          text: message
        })
      ])
    )
  );
};

const sendAdminOpsReminder = async () => {
  try {
    const metrics = await gatherMetrics();
    const message = buildMessage(metrics);
    await dispatchReminders(metrics, message);
    console.info('[OpsReminder] admin reminders delivered');
  } catch (err) {
    console.error('[OpsReminder] failed to deliver reminder', err);
  }
};

const startAdminOpsReminders = () => {
  if (process.env.DISABLE_ADMIN_REMINDERS === 'true') {
    console.info('[OpsReminder] disabled via env');
    return null;
  }

  const task = cron.schedule(
    REMINDER_CRON_EXPRESSION,
    () => {
      sendAdminOpsReminder();
    },
    {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    }
  );

  return task;
};

module.exports = { startAdminOpsReminders, sendAdminOpsReminder };
