const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  createNotebook, 
  getNotebooks, 
  getNotebook, 
  updateNotebook, 
  deleteNotebook 
} = require('../controllers/notebookController');

// Create a notebook
router.post('/', protect, createNotebook);

// Get all user's notebooks
router.get('/', protect, getNotebooks);

// Get a single notebook
router.get('/:id', protect, getNotebook);

// Update a notebook
router.put('/:id', protect, updateNotebook);

// Delete a notebook
router.delete('/:id', protect, deleteNotebook);

module.exports = router; 