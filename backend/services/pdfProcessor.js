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

    console.log(`[PDF Processor] Extracted ${extractedText.length} characters, ${numPages} pages for document: ${documentId}`);    await Document.findByIdAndUpdate(documentId, {
      processed: true,
      'content.text': extractedText,
      'content.pages': numPages,
      processingError: null,
    });

    // Delete the PDF file after successful processing
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`[PDF Processor] Error deleting file ${filePath}:`, err);
      } else {
        console.log(`[PDF Processor] Successfully deleted file ${filePath} after processing`);
      }
    });

    console.log(`[PDF Processor] Successfully processed and updated document: ${documentId}`);

  } catch (error) {
    console.error(`[PDF Processor] Error processing document ${documentId}:`, error);
    
    try {
      await Document.findByIdAndUpdate(documentId, {
        processed: false,
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