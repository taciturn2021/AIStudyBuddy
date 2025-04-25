const Document = require('../models/Document');
const { processPdf } = require('../services/pdfProcessor');
const mongoose = require('mongoose');

const MAX_RETRIES = 3; // Define a maximum number of retries
const RETRY_DELAY_MINUTES = 5; // Time before a failed doc is eligible for retry

async function retryUnprocessedPdfs() {
  console.log('[Retry Job] Checking for unprocessed documents...');
  try {
    const fiveMinutesAgo = new Date(Date.now() - RETRY_DELAY_MINUTES * 60 * 1000);

    // Find documents that are not processed and either have no error or had an error long enough ago
    // Also implement a simple retry count limit
    const unprocessedDocs = await Document.find({
      processed: false,
      $or: [
        { processingError: null },
        { lastAttemptDate: { $lte: fiveMinutesAgo } }
      ],
      retryCount: { $lt: MAX_RETRIES }
    }).limit(10); // Process in batches to avoid overload

    if (unprocessedDocs.length === 0) {
      console.log('[Retry Job] No documents found needing retry processing.');
      return;
    }

    console.log(`[Retry Job] Found ${unprocessedDocs.length} documents to retry processing.`);

    // Process documents one by one to avoid overwhelming the system
    for (const doc of unprocessedDocs) {
      console.log(`[Retry Job] Attempting to process document: ${doc._id}`);
      
      // Increment retry count and update last attempt date before processing
      await Document.findByIdAndUpdate(doc._id, { 
        $inc: { retryCount: 1 },
        lastAttemptDate: new Date()
      });
      
      await processPdf(doc.filePath, doc._id);
      // processPdf handles updating the 'processed' status or logging errors
    }

    console.log('[Retry Job] Finished processing batch.');

  } catch (error) {
    console.error('[Retry Job] Error during retry processing check:', error);
  }
}

// Add fields to schema if they don't exist (run once or manage via migrations)
async function ensureSchemaFields() {
    try {
        const fieldsToAdd = { retryCount: { type: Number, default: 0 }, lastAttemptDate: { type: Date, default: null } };
        await mongoose.connection.collection('documents').updateMany({}, { $unset: { retryCount: "", lastAttemptDate: "" } }); // Clear old potentially wrong types first if needed
        await mongoose.connection.collection('documents').updateMany(
            { retryCount: { $exists: false } }, 
            { $set: { retryCount: 0 } }
        );
        await mongoose.connection.collection('documents').updateMany(
            { lastAttemptDate: { $exists: false } }, 
            { $set: { lastAttemptDate: null } }
        );
        console.log('[Schema Check] Ensured retryCount and lastAttemptDate fields exist on documents collection.');
    } catch (error) {
        console.error('[Schema Check] Error ensuring schema fields:', error);
    }
}

module.exports = { retryUnprocessedPdfs, ensureSchemaFields }; 