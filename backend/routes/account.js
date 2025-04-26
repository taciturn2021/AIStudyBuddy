const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  updatePassword,
  updateGeminiKey,
  removeGeminiKey,
  getAccountStatus,
} = require('../controllers/accountController');

router.use(protect);

router.put('/password', updatePassword);
router.put('/gemini-key', updateGeminiKey);
router.delete('/gemini-key', removeGeminiKey);
router.get('/status', getAccountStatus);

module.exports = router;