const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'default_jwt_secret', {
    expiresIn: '30d',
  });
};

const generateResetKey = () => {
  return crypto.randomBytes(16).toString('hex');
};

exports.register = async (req, res) => {
  console.log('💡 [API] Register request received:', { username: req.body.username });
  
  try {
    const { username, password } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      console.log('❌ [API] Registration failed: Username already taken');
      return res.status(400).json({ message: 'Username already taken' });
    }

    const plainResetKey = generateResetKey();

    const user = new User({
      username,
      password,
      resetKey: plainResetKey,
    });

    await user.save();

    console.log('✅ [API] User registered successfully:', { username: user.username, userId: user._id });
    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id),
      resetKey: plainResetKey,
    });
  } catch (error) {
    console.error('❌ [API] Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  console.log('💡 [API] Login request received:', { username: req.body.username });
  
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      console.log('❌ [API] Login failed: User not found');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ [API] Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    console.log('✅ [API] User logged in successfully:', { username: user.username, userId: user._id });
    
    res.json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('❌ [API] Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.checkUsername = async (req, res) => {
  console.log('💡 [API] Check username request received:', { username: req.body.username });
  
  try {
    const { username } = req.body;

    if (!username) {
      console.log('❌ [API] Check username failed: Username is required');
      return res.status(400).json({ message: 'Username is required' });
    }

    console.log('🔍 [API] Looking up user in database:', { username });
    
    console.log('🔍 [API] Running case-insensitive query for username: "' + username + '"');
    const user = await User.findOne({ 
      username: { $regex: new RegExp("^" + username + "$", "i") } 
    });
    
    console.log('🔍 [API] Query result:', user ? { 
      found: true, 
      userId: user._id, 
      queried: username, 
      matched: user.username 
    } : { 
      found: false,
      queried: username
    });
    
    if (!user) {
      console.log('❌ [API] Check username failed: User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ [API] Username check successful:', { username, userId: user._id });
    
    res.status(200).json({ message: 'Username found' });
  } catch (error) {
    console.error('❌ [API] Username check error:', error);
    res.status(500).json({ message: 'Server error during username check' });
  }
};

exports.resetPassword = async (req, res) => {
  console.log('💡 [API] Password reset request received:', { username: req.body.username });
  
  try {
    const { username, resetKey, newPassword } = req.body;

    console.log('🔍 [API] Running case-insensitive query for username: "' + username + '"');
    const user = await User.findOne({ 
      username: { $regex: new RegExp("^" + username + "$", "i") } 
    });
    
    if (!user) {
      console.log('❌ [API] Password reset failed: User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔍 [API] Verifying reset key for user:', { username, userId: user._id });
    
    const isKeyValid = await user.compareResetKey(resetKey);
    if (!isKeyValid) {
      console.log('❌ [API] Password reset failed: Invalid reset key');
      return res.status(401).json({ message: 'Invalid reset key' });
    }

    const newResetKey = generateResetKey();

    console.log('🔄 [API] Updating password and reset key for user:', { username, userId: user._id });
    
    user.password = newPassword;
    user.resetKey = newResetKey;
    await user.save();

    console.log('✅ [API] Password reset successful:', { username, userId: user._id });
    
    res.json({
      message: 'Password reset successful',
      token: generateToken(user._id),
      resetKey: newResetKey,
    });
  } catch (error) {
    console.error('❌ [API] Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};
