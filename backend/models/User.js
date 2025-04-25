const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetKey: {
    type: String,
    required: true,
  },
  encryptedGeminiKey: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (this.isModified('resetKey')) {
      this.resetKey = await bcrypt.hash(this.resetKey, salt);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.compareResetKey = async function (candidateKey) {
  return bcrypt.compare(candidateKey, this.resetKey);
};

module.exports = mongoose.model('User', UserSchema);
