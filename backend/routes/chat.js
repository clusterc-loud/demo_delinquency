const express = require('express');
const router = express.Router();
const { getChatHistory, sendChatMessage, getAdminNotifications, quickReplyChat, getInbox } = require('../controllers/chatController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/notifications', getAdminNotifications);
router.post('/:customerId/quick-reply', quickReplyChat);
router.get('/lists/inbox', getInbox);
router.get('/:customerId', getChatHistory);
router.post('/:customerId', sendChatMessage);

module.exports = router;
