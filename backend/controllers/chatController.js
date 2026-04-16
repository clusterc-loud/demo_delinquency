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

    chat.messages.push({ sender, text });
    await chat.save();

    res.json({ success: true, messages: chat.messages });
  } catch (err) {
    next(err);
  }
};

module.exports = { getChatHistory, sendChatMessage };
