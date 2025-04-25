const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model', 'system'], // System for potential future use
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false }); // Don't generate separate IDs for embedded messages

const ChatSchema = new mongoose.Schema({
  notebook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Chat' // Default title, maybe update later
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedAt: {
     type: Date,
     default: Date.now
  },
  messages: [MessageSchema] // Embed the message schema
});

// Index for efficient querying by notebook and user
ChatSchema.index({ notebook: 1, user: 1 });
ChatSchema.index({ user: 1, lastUpdatedAt: -1 }); // For fetching recent chats

module.exports = mongoose.model('Chat', ChatSchema); 