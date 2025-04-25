const express = require('express');
const router = express.Router();
const { register, login, resetPassword, checkUsername } = require('../controllers/authController');

router.post('/register', register);

router.post('/login', login);

router.post('/check-username', checkUsername);

router.post('/resetpassword', resetPassword);

module.exports = router;
