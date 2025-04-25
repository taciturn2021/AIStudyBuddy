// Main server file for AI Study Buddy backend
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron'); // Import node-cron
const { retryUnprocessedPdfs, ensureSchemaFields } = require('./jobs/pdfRetryProcessor'); // Import the job

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('./backend/uploads')) {
  fs.mkdirSync('./backend/uploads', { recursive: true });
}

// Routes
const authRoutes = require('./routes/auth');
const notebookRoutes = require('./routes/notebooks');
const documentRoutes = require('./routes/documents');

app.use('/api/auth', authRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/documents', documentRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('AI Study Buddy API is running!');
});

// Flag to prevent job overlap
let isRetryJobRunning = false;

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aistudybuddy';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await ensureSchemaFields();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Schedule the retry job to run every 2 minutes
      cron.schedule('*/2 * * * *', async () => { // Make the callback async
        if (isRetryJobRunning) {
          console.log('[Cron] PDF processing retry job is already running. Skipping this execution.');
          return;
        }

        console.log('[Cron] Running scheduled PDF processing retry job...');
        isRetryJobRunning = true; // Set lock
        try {
          await retryUnprocessedPdfs(); // Await the async job
        } catch (error) {
            console.error('[Cron] Error executing retryUnprocessedPdfs job:', error);
        } finally {
          isRetryJobRunning = false; // Release lock regardless of outcome
          console.log('[Cron] PDF processing retry job finished.');
        }
      });
      console.log('Scheduled PDF processing retry job to run every 2 minutes.');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
  