const express = require('express');
const {
    generateQuiz,
    getQuizzes,
    getQuiz,
    submitQuizAttempt,
    gradeQuiz,
    deleteQuiz
} = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


router.post('/:notebookId', protect, generateQuiz);


router.get('/:notebookId', protect, getQuizzes);


router.get('/quiz/:quizId', protect, getQuiz);


router.put('/quiz/:quizId/attempt', protect, submitQuizAttempt);


router.post('/quiz/:quizId/grade', protect, gradeQuiz);


router.delete('/quiz/:quizId', protect, deleteQuiz);


module.exports = router;
