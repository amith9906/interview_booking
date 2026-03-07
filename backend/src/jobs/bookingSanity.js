const cron = require('node-cron');
const { Booking, Interviewer, User } = require('../models');
const { Op } = require('sequelize');
const { sendEmail } = require('../services/notificationService');

const startBookingSanityJob = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        
        // Find bookings that are paid but not acknowledged for > 4 hours
        const stagnantBookings = await Booking.findAll({
            where: {
                status: 'paid',
                acknowledged: false,
                created_at: { [Op.lt]: fourHoursAgo }
            },
            include: [{ model: Interviewer, include: [User] }]
        });

        for (const booking of stagnantBookings) {
            console.log(`Booking ${booking.id} is stagnant. Notifying interviewer and admin.`);
            
            if (booking.Interviewer?.User?.email) {
                await sendEmail({
                    to: booking.Interviewer.User.email,
                    subject: 'URGENT: Booking Acknowledgement Required',
                    text: `The booking #${booking.id} is still awaiting your acknowledgement. Please confirm or reject it ASAP to avoid a breakdown in student experience.`
                });
            }
            
            // In a real production system, we might auto-cancel and refund here
            // booking.status = 'cancelled';
            // await booking.save();
        }
    });
};

module.exports = { startBookingSanityJob };
