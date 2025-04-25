const mongoose = require('mongoose');

const NotebookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // This will store the notebook content structure
  // For now, it's a simple array, but can be expanded later
  content: {
    type: Array,
    default: []
  }
});

module.exports = mongoose.model('Notebook', NotebookSchema); 