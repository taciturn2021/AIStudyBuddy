require('dotenv').config();

console.log('Attempting to load GEMINI_KEY_ENCRYPTION_SECRET:', process.env.GEMINI_KEY_ENCRYPTION_SECRET ? 'Loaded (length ' + process.env.GEMINI_KEY_ENCRYPTION_SECRET.length + ')' : 'NOT LOADED OR UNDEFINED');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { retryUnprocessedPdfs, ensureSchemaFields } = require('./jobs/pdfRetryProcessor');
const { errorHandler } = require('./middleware/errorMiddleware');


const authRoutes = require('./routes/auth');
const notebookRoutes = require('./routes/notebooks');
const documentRoutes = require('./routes/documents');
const flashcardRoutes = require('./routes/flashcards');
const chatRoutes = require('./routes/chat');
const accountRoutes = require('./routes/account');
const modelRoutes = require('./routes/models');
const quizRoutes = require('./routes/quizzes'); 


const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const fs = require('fs');
if (!fs.existsSync('./backend/uploads')) {
  fs.mkdirSync('./backend/uploads', { recursive: true });
}



app.use('/api/auth', authRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/quizzes', quizRoutes); 




try {
  console.log('Attempting to import flashcard routes...');
  const flashcardRoutes = require('./routes/flashcards');
  console.log('Flashcard routes imported successfully:', typeof flashcardRoutes);
  app.use('/api/flashcards', flashcardRoutes);
  console.log('Flashcard routes registered successfully');
} catch (error) {
  console.error('Error setting up flashcard routes:', error);
}

app.get('/', (req, res) => {
  res.send('AI Study Buddy API is running!');
});

app.use(errorHandler);

let isRetryJobRunning = false;

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aistudybuddy';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await ensureSchemaFields();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      cron.schedule('*/2 * * * *', async () => {
        if (isRetryJobRunning) {
          console.log('[Cron] PDF processing retry job is already running. Skipping this execution.');
          return;
        }

        console.log('[Cron] Running scheduled PDF processing retry job...');
        isRetryJobRunning = true;
        try {
          await retryUnprocessedPdfs();
        } catch (error) {
            console.error('[Cron] Error executing retryUnprocessedPdfs job:', error);
        } finally {
          isRetryJobRunning = false;
          console.log('[Cron] PDF processing retry job finished.');
        }
      });
      console.log('Scheduled PDF processing retry job to run every 2 minutes.');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
