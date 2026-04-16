const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['CUSTOMER', 'ADMIN', 'SYSTEM'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  unreadByAdmin: {
    type: Boolean,
    default: false,
  }
});

const chatSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [chatMessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
