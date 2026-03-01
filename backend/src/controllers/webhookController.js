const { constructEvent, hasStripe } = require('../services/stripeService');
const { Booking, HrUser, Student, User, PaymentAudit } = require('../models');
const { notifyBookingParticipants } = require('../services/notificationService');
const { alertIfCritical } = require('../services/monitoringService');

const handleStripeWebhook = async (req, res) => {
  const markAuditStatus = async (sessionId, status, message) => {
    if (!sessionId) return;
    const audit = await PaymentAudit.findOne({ where: { session_id: sessionId } });
    if (!audit) return;
    audit.status = status;
    if (message) audit.message = message;
    await audit.save();
  };
  if (!process.env.STRIPE_WEBHOOK_SECRET || !hasStripe) {
    return res.status(200).json({ received: true, message: 'Stripe webhooks disabled' });
  }
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    alertIfCritical('Stripe webhook signature error', { error: err.message });
    console.error('Stripe webhook signature error', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;
    if (type === 'checkout.session.completed') {
      const session = data.object;
    if (session.metadata?.booking_id) {
      const booking = await Booking.findByPk(session.metadata.booking_id, {
        include: [{ model: Student, include: [User] }]
      });
      if (booking) {
        booking.status = 'paid';
        await booking.save();
        await notifyBookingParticipants({ booking });
      }
      await markAuditStatus(session.id, 'success', 'Stripe checkout completed');
    }
    if (session.metadata?.hr_id) {
      const hr = await HrUser.findByPk(session.metadata.hr_id);
      if (hr) {
        hr.subscription_active = true;
        hr.plan_expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await hr.save();
      }
    }
  }

  if (type === 'invoice.payment_succeeded') {
    const invoice = data.object;
    const hr = await HrUser.findOne({ where: { stripe_customer_id: invoice.customer } });
    if (hr) {
      hr.subscription_active = true;
      hr.plan_expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await hr.save();
    }
  }

  res.json({ received: true });
};

module.exports = { handleStripeWebhook };
