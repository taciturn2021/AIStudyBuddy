const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    handleChatMessage, 
    getChatsForNotebook, 
    getChatMessages,
    deleteChat,
    updateChatTitle
} = require('../controllers/chatController');

router.post('/:notebookId', protect, handleChatMessage);
router.get('/:notebookId', protect, getChatsForNotebook);
router.get('/:chatId/messages', protect, getChatMessages);
router.delete('/:chatId', protect, deleteChat);
router.patch('/:chatId/title', protect, updateChatTitle);

module.exports = router;