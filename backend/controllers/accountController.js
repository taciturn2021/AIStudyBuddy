const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../services/encryptionService');
const { validateGeminiApiKey } = require('../services/geminiService');

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new passwords');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters long');
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Incorrect current password');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

const updateGeminiKey = asyncHandler(async (req, res) => {
  const { geminiApiKey } = req.body;

  if (!geminiApiKey) {
    res.status(400);
    throw new Error('Please provide a Gemini API Key');
  }

  const validationResult = await validateGeminiApiKey(geminiApiKey);
  if (!validationResult.isValid) {
    res.status(400);
    throw new Error(validationResult.error || 'Invalid Gemini API Key');
  }

  const encryptedKey = encrypt(geminiApiKey);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { encryptedGeminiKey: encryptedKey },
    { new: true }
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({ success: true, message: 'Gemini API Key saved successfully' });
});

const getAccountStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('encryptedGeminiKey');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    data: {
      isGeminiKeySet: !!user.encryptedGeminiKey,
    },
  });
});

module.exports = { updatePassword, updateGeminiKey, getAccountStatus };