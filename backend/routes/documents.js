const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { 
  uploadDocument, 
  getDocuments, 
  getDocument, 
  deleteDocument 
} = require('../controllers/documentController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter for PDF files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  } 
});

// Upload a document to a notebook
router.post('/:notebookId', protect, upload.single('document'), uploadDocument);

// Get all documents in a notebook
router.get('/:notebookId', protect, getDocuments);

// Get a single document
router.get('/:notebookId/:documentId', protect, getDocument);

// Delete a document
router.delete('/:notebookId/:documentId', protect, deleteDocument);

module.exports = router; 