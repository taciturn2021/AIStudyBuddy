const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  generateFlashcards, 
  getFlashcards, 
  deleteFlashcard
} = require('../controllers/flashcardController');


router.post('/:notebookId', protect, generateFlashcards);


router.get('/:notebookId', protect, getFlashcards);


router.delete('/:flashcardId', protect, deleteFlashcard);

module.exports = router;
