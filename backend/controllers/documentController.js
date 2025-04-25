const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Notebook = require('../models/Notebook');
const asyncHandler = require('express-async-handler');
const { processPdf } = require('../services/pdfProcessor');

// @desc    Upload a document to a notebook
// @route   POST /api/documents/:notebookId
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
  const notebookId = req.params.notebookId;
  
  // Check if notebook exists and belongs to user
  const notebook = await Notebook.findOne({
    _id: notebookId,
    user: req.user.id
  });

  if (!notebook) {
    res.status(404);
    throw new Error('Notebook not found or not authorized');
  }

  // Check if file was uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  // Check if file is a PDF
  if (req.file.mimetype !== 'application/pdf') {
    // Remove the uploaded file
    fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error('Only PDF files are allowed');
  }

  // Create document record
  const document = await Document.create({
    notebook: notebookId,
    user: req.user.id,
    filename: req.file.filename,
    originalFilename: req.file.originalname,
    fileSize: req.file.size,
    filePath: req.file.path,
    fileType: req.file.mimetype
  });

  // Update notebook's lastUpdated field
  await Notebook.findByIdAndUpdate(notebookId, { lastUpdated: Date.now() });

  // Respond to the user immediately
  res.status(201).json({
    success: true,
    data: {
      id: document._id,
      filename: document.originalFilename,
      uploadDate: document.uploadDate,
      fileSize: document.fileSize,
      processed: document.processed
    }
  });

  // Asynchronously process the PDF after responding
  console.log(`[Controller] Queuing document ${document._id} for processing.`);
  processPdf(document.filePath, document._id).catch(err => {
    // Catch potential errors during the async process call itself (not errors *within* processPdf)
    console.error(`[Controller] Error initiating processing for document ${document._id}:`, err);
  });
});

// @desc    Get all documents in a notebook
// @route   GET /api/documents/:notebookId
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  const notebookId = req.params.notebookId;
  
  // Check if notebook exists and belongs to user
  const notebook = await Notebook.findOne({
    _id: notebookId,
    user: req.user.id
  });

  if (!notebook) {
    res.status(404);
    throw new Error('Notebook not found or not authorized');
  }

  const documents = await Document.find({ notebook: notebookId })
    .select('originalFilename fileSize uploadDate processed processingError')
    .sort({ uploadDate: -1 });

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents
  });
});

// @desc    Get a single document
// @route   GET /api/documents/:notebookId/:documentId
// @access  Private
const getDocument = asyncHandler(async (req, res) => {
  const { notebookId, documentId } = req.params;

  // Check document exists and belongs to user
  const document = await Document.findOne({
    _id: documentId,
    notebook: notebookId,
    user: req.user.id
  });

  if (!document) {
    res.status(404);
    throw new Error('Document not found or not authorized');
  }

  res.status(200).json({
    success: true,
    data: document
  });
});

// @desc    Delete a document
// @route   DELETE /api/documents/:notebookId/:documentId
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const { notebookId, documentId } = req.params;

  // Check document exists and belongs to user
  const document = await Document.findOne({
    _id: documentId,
    notebook: notebookId,
    user: req.user.id
  });

  if (!document) {
    res.status(404);
    throw new Error('Document not found or not authorized');
  }

  // Get file path before deleting document record
  const filePath = document.filePath;

  // Delete document from database first
  const deleteResult = await Document.deleteOne({ _id: documentId });

  if (deleteResult.deletedCount === 0) {
      // Should not happen if findOne succeeded, but good practice to check
      res.status(404);
      throw new Error('Document found but could not be deleted');
  }

  // Delete file from storage *after* successful DB deletion
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (fileError) {
      // Log the error but don't fail the request, as DB record is deleted
      console.error(`Error deleting file ${filePath}:`, fileError);
    }
  }

  // Update notebook's lastUpdated field
  await Notebook.findByIdAndUpdate(notebookId, { lastUpdated: Date.now() });

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument
}; 