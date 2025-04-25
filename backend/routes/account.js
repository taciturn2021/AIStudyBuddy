const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  updatePassword,
  updateGeminiKey,
  getAccountStatus,
} = require('../controllers/accountController');

router.use(protect);

router.put('/password', updatePassword);
router.put('/gemini-key', updateGeminiKey);
router.get('/status', getAccountStatus);

module.exports = router;