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

router.post('/', protect, createNotebook);

router.get('/', protect, getNotebooks);

router.get('/:id', protect, getNotebook);

router.put('/:id', protect, updateNotebook);

router.delete('/:id', protect, deleteNotebook);

module.exports = router; 