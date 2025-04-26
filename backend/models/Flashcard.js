const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
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
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  sourceDocumentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  model: {
    type: String,
    required: true
  }
});


FlashcardSchema.index({ notebook: 1, user: 1 });
FlashcardSchema.index({ user: 1 });

const Flashcard = mongoose.model('Flashcard', FlashcardSchema);
module.exports = Flashcard;
