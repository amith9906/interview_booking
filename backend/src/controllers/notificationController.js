const { Notification } = require('../models');

const listNotifications = async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    limit: 20
  });
  res.json(notifications);
};

const markRead = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOne({ where: { id, user_id: req.user.id } });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  notification.read = true;
  await notification.save();
  res.json(notification);
};

module.exports = { listNotifications, markRead };
