const fs = require('fs');
const pdf = require('pdf-parse');
const Document = require('../models/Document');

async function processPdf(filePath, documentId) {
  console.log(`[PDF Processor] Starting processing for document: ${documentId}, path: ${filePath}`);
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);

    const extractedText = pdfData.text;
    const numPages = pdfData.numpages;

    console.log(`[PDF Processor] Extracted ${extractedText.length} characters, ${numPages} pages for document: ${documentId}`);

    // Update the document in the database
    await Document.findByIdAndUpdate(documentId, {
      processed: true,
      'content.text': extractedText,
      'content.pages': numPages,
      processingError: null, // Clear any previous error
    });

    console.log(`[PDF Processor] Successfully processed and updated document: ${documentId}`);

  } catch (error) {
    console.error(`[PDF Processor] Error processing document ${documentId}:`, error);
    
    // Attempt to update the document with the error
    try {
      await Document.findByIdAndUpdate(documentId, {
        processed: false, // Mark as not processed due to error
        processingError: error.message || 'Unknown processing error',
      });
      console.log(`[PDF Processor] Updated document ${documentId} with processing error.`);
    } catch (dbError) {
      console.error(`[PDF Processor] Failed to update document ${documentId} with error status:`, dbError);
    }
  }
}

module.exports = {
  processPdf,
}; 