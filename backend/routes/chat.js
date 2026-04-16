const express = require('express');
const router = express.Router();
const { getChatHistory, sendChatMessage } = require('../controllers/chatController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/:customerId', getChatHistory);
router.post('/:customerId', sendChatMessage);

module.exports = router;
