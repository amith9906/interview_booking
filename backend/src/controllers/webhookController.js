const { constructEvent, hasStripe } = require('../services/stripeService');
const { Booking, HrUser, Student, User, PaymentAudit } = require('../models');
const { notifyBookingParticipants, sendPaymentReceiptEmail } = require('../services/notificationService');
const { createPaymentReceiptBuffer } = require('../services/reportService');
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
        include: [
          { model: Student, include: [User] },
          { model: Interviewer, include: [User] }
        ]
      });
      if (booking) {
        booking.status = 'paid';
        await booking.save();
        
        // Generate and send receipt (DEF-015)
        try {
          const buffer = await createPaymentReceiptBuffer({ booking, session });
          await sendPaymentReceiptEmail({
            to: booking.Student?.User?.email,
            bookingId: booking.id,
            buffer
          });
        } catch (receiptErr) {
          console.error('Failed to generate/send receipt:', receiptErr);
        }

        await notifyBookingParticipants({ booking });
      }
      await markAuditStatus(session.id, 'success', 'Stripe checkout completed');
    }
    // ... (HR logic)
  }

  if (type === 'checkout.session.expired' || type === 'charge.failed') {
    const sessionOrCharge = data.object;
    const bookingId = sessionOrCharge.metadata?.booking_id;
    if (bookingId) {
      const booking = await Booking.findByPk(bookingId);
      if (booking && booking.status === 'pending') {
        booking.status = 'cancelled'; // Release slot (DEF-016)
        await booking.save();
        await markAuditStatus(sessionOrCharge.id || sessionOrCharge.payment_intent, 'failure', `Payment failed or expired: ${type}`);
      }
    }
  }

  res.json({ received: true });
};

module.exports = { handleStripeWebhook };
