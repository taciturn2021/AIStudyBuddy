// User model for authentication
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password and reset key before saving
UserSchema.pre('save', async function (next) {
  // Only hash the password if it's new or has been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Hash reset key only if it's been modified
    if (this.isModified('resetKey')) {
      this.resetKey = await bcrypt.hash(this.resetKey, salt);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to compare reset keys
UserSchema.methods.compareResetKey = async function (candidateKey) {
  return bcrypt.compare(candidateKey, this.resetKey);
};

module.exports = mongoose.model('User', UserSchema);
