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

// POST /api/chat/:notebookId - Send a message (creates new chat if no chatId provided)
router.post('/:notebookId', protect, handleChatMessage);

// GET /api/chat/:notebookId - Get all chats for a notebook
router.get('/:notebookId', protect, getChatsForNotebook);

// GET /api/chat/:chatId/messages - Get messages for a specific chat
router.get('/:chatId/messages', protect, getChatMessages);

// DELETE /api/chat/:chatId - Delete a specific chat
router.delete('/:chatId', protect, deleteChat);

// PATCH /api/chat/:chatId/title - Update chat title
router.patch('/:chatId/title', protect, updateChatTitle);

module.exports = router; 