const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['mcq', 'short_answer']
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: { 
    type: [String],
    default: undefined 
  },
  correctAnswer: { 
    type: String,
    required: true
  },
  userAnswer: { 
    type: String,
    default: null
  }
}, { _id: false }); 

const quizSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  notebook: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Notebook'
  },
  title: {
    type: String,
    required: true,
    default: 'Untitled Quiz' 
  },
  sourceDocumentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  model: { 
    type: String,
    required: true
  },
  questions: [questionSchema],
  status: {
    type: String,
    required: true,
    enum: ['ongoing', 'completed', 'generating', 'error'],
    default: 'generating'
  },
  numMCQs: {
    type: Number,
    required: true,
  },
  numShortAnswer: {
      type: Number,
      required: true,
  },
  score: { 
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  feedback: { 
    type: String,
    trim: true,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastAttemptedAt: { 
    type: Date,
    default: Date.now
  },
  completedAt: { 
      type: Date,
      default: null
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'lastAttemptedAt' } 
});


questionSchema.pre('save', function(next) {
  if (this.type !== 'mcq') {
    this.options = undefined;
  }
  next();
});


quizSchema.index({ user: 1, notebook: 1 });
quizSchema.index({ status: 1 });


module.exports = mongoose.model('Quiz', quizSchema);
