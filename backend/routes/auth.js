// Authentication routes for AI Study Buddy
const express = require('express');
const router = express.Router();
const { register, login, resetPassword, checkUsername } = require('../controllers/authController');

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Check if username exists
router.post('/check-username', checkUsername);

// Reset password
router.post('/resetpassword', resetPassword);

module.exports = router;
