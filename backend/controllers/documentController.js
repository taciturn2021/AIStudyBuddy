const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Notebook = require('../models/Notebook');
const asyncHandler = require('express-async-handler');
const { processPdf } = require('../services/pdfProcessor');

const uploadDocument = asyncHandler(async (req, res) => {
  const notebookId = req.params.notebookId;
  
  const notebook = await Notebook.findOne({
    _id: notebookId,
    user: req.user.id
  });

  if (!notebook) {
    res.status(404);
    throw new Error('Notebook not found or not authorized');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  if (req.file.mimetype !== 'application/pdf') {
    fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error('Only PDF files are allowed');
  }

  const document = await Document.create({
    notebook: notebookId,
    user: req.user.id,
    filename: req.file.filename,
    originalFilename: req.file.originalname,
    fileSize: req.file.size,
    filePath: req.file.path,
    fileType: req.file.mimetype
  });

  await Notebook.findByIdAndUpdate(notebookId, { lastUpdated: Date.now() });

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

  console.log(`[Controller] Queuing document ${document._id} for processing.`);
  processPdf(document.filePath, document._id).catch(err => {
    console.error(`[Controller] Error initiating processing for document ${document._id}:`, err);
  });
});

const getDocuments = asyncHandler(async (req, res) => {
  const notebookId = req.params.notebookId;
  
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

const getDocument = asyncHandler(async (req, res) => {
  const { notebookId, documentId } = req.params;

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

const deleteDocument = asyncHandler(async (req, res) => {
  const { notebookId, documentId } = req.params;

  const document = await Document.findOne({
    _id: documentId,
    notebook: notebookId,
    user: req.user.id
  });

  if (!document) {
    res.status(404);
    throw new Error('Document not found or not authorized');
  }

  const filePath = document.filePath;

  const deleteResult = await Document.deleteOne({ _id: documentId });

  if (deleteResult.deletedCount === 0) {
      res.status(404);
      throw new Error('Document found but could not be deleted');
  }

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (fileError) {
      console.error(`Error deleting file ${filePath}:`, fileError);
    }
  }

  await Notebook.findByIdAndUpdate(notebookId, { lastUpdated: Date.now() });

  res.status(200).json({
    success: true,
    data: {}
  });
});

const saveTextDocument = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('Title and content are required');
  }

  const notebook = await Notebook.findOne({
    _id: notebookId,
    user: req.user.id
  });

  if (!notebook) {
    res.status(404);
    throw new Error('Notebook not found or not authorized');
  }

  const document = await Document.create({
    notebook: notebookId,
    user: req.user.id,
    filename: `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.txt`,
    originalFilename: title,
    fileSize: Buffer.byteLength(content, 'utf8'),
    filePath: null,
    fileType: 'text/plain',
    processed: true,
    'content.text': content,
    'content.pages': 1,
  });

  await Notebook.findByIdAndUpdate(notebookId, { lastUpdated: Date.now() });

  res.status(201).json({
    success: true,
    data: {
      _id: document._id,
      originalFilename: document.originalFilename,
      uploadDate: document.uploadDate,
      fileSize: document.fileSize,
      processed: document.processed
    }
  });
});

module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  saveTextDocument
};