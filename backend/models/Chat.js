const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model', 'system'],
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
}, { _id: false });

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
    default: 'New Chat'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedAt: {
     type: Date,
     default: Date.now
  },
  messages: [MessageSchema]
});

ChatSchema.index({ notebook: 1, user: 1 });
ChatSchema.index({ user: 1, lastUpdatedAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);