const Chat = require('../models/Chat');
const Customer = require('../models/Customer');

const getChatHistory = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const chat = await Chat.findOne({ customerId });
    res.json({ messages: chat ? chat.messages : [] });
  } catch (err) {
    next(err);
  }
};

const sendChatMessage = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { sender, text } = req.body;

    let chat = await Chat.findOne({ customerId });
    if (!chat) {
      chat = new Chat({ customerId, messages: [] });
    }

    chat.messages.push({ sender, text, unreadByAdmin: sender === 'CUSTOMER' });
    await chat.save();

    res.json({ success: true, messages: chat.messages });
  } catch (err) {
    next(err);
  }
};

const getAdminNotifications = async (req, res, next) => {
  try {
    const chats = await Chat.find({ "messages.unreadByAdmin": true });
    
    // Process and enrich notifications
    const notifications = await Promise.all(chats.map(async (chat) => {
      const customer = await Customer.findOne({ customerId: chat.customerId });
      const unreadMessages = chat.messages.filter(m => m.unreadByAdmin);
      const latestMessage = unreadMessages[unreadMessages.length - 1];

      return {
        customerId: chat.customerId,
        name: customer ? (customer.businessName || customer.name) : 'Unknown User',
        message: latestMessage.text,
        timestamp: latestMessage.timestamp,
        unreadCount: unreadMessages.length
      };
    }));

    // Sort by most recent
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

const quickReplyChat = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { text } = req.body;

    const chat = await Chat.findOne({ customerId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Mark previous messages as read
    chat.messages.forEach(m => {
      if (m.unreadByAdmin) m.unreadByAdmin = false;
    });

    chat.messages.push({ sender: 'ADMIN', text, unreadByAdmin: false });
    await chat.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getChatHistory, sendChatMessage, getAdminNotifications, quickReplyChat };
