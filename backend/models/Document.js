const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
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
  filename: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  processed: {
    type: Boolean,
    default: false
  },
  processingError: {
    type: String,
    default: null
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastAttemptDate: {
    type: Date,
    default: null
  },
  content: {
    text: { type: String, default: null },
    pages: { type: Number, default: null }
  },
  analysis: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('Document', DocumentSchema); 