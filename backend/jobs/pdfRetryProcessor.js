const Document = require('../models/Document');
const { processPdf } = require('../services/pdfProcessor');
const mongoose = require('mongoose');

const MAX_RETRIES = 3;
const RETRY_DELAY_MINUTES = 5;

async function retryUnprocessedPdfs() {
  console.log('[Retry Job] Checking for unprocessed documents...');
  try {
    const fiveMinutesAgo = new Date(Date.now() - RETRY_DELAY_MINUTES * 60 * 1000);

    const unprocessedDocs = await Document.find({
      processed: false,
      $or: [
        { processingError: null },
        { lastAttemptDate: { $lte: fiveMinutesAgo } }
      ],
      retryCount: { $lt: MAX_RETRIES }
    }).limit(10);

    if (unprocessedDocs.length === 0) {
      console.log('[Retry Job] No documents found needing retry processing.');
      return;
    }

    console.log(`[Retry Job] Found ${unprocessedDocs.length} documents to retry processing.`);

    for (const doc of unprocessedDocs) {
      console.log(`[Retry Job] Attempting to process document: ${doc._id}`);
      
      await Document.findByIdAndUpdate(doc._id, { 
        $inc: { retryCount: 1 },
        lastAttemptDate: new Date()
      });
      
      await processPdf(doc.filePath, doc._id);
    }

    console.log('[Retry Job] Finished processing batch.');

  } catch (error) {
    console.error('[Retry Job] Error during retry processing check:', error);
  }
}

async function ensureSchemaFields() {
    try {
        const fieldsToAdd = { retryCount: { type: Number, default: 0 }, lastAttemptDate: { type: Date, default: null } };
        await mongoose.connection.collection('documents').updateMany({}, { $unset: { retryCount: "", lastAttemptDate: "" } });
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