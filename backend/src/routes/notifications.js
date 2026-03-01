const express = require('express');
const { listNotifications, markRead } = require('../controllers/notificationController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();
router.use(authenticate);
router.get('/', listNotifications);
router.post('/:id/read', markRead);

module.exports = router;
