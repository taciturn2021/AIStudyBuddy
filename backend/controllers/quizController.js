const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Notebook = require('../models/Notebook');
const Document = require('../models/Document');
const Quiz = require('../models/Quiz');
const { decrypt } = require('../services/encryptionService');
const { generateChatResponse } = require('../services/geminiService');


const generateQuiz = asyncHandler(async (req, res) => {
    const { notebookId } = req.params;
    const { selectedDocumentIds, model: modelName, numMCQs, numShortAnswer } = req.body;
    const userId = req.user.id;

   
    if (!Array.isArray(selectedDocumentIds) || selectedDocumentIds.length === 0) {
        res.status(400);
        throw new Error('Please select at least one document');
    }
    if (!modelName) {
        res.status(400);
        throw new Error('Model selection is required');
    }
    const mcqOptions = [5, 10, 15, 20];
    const shortAnswerOptions = [0, 1, 2, 3];
    if (!mcqOptions.includes(numMCQs)) {
        res.status(400);
        throw new Error('Invalid number of MCQs selected. Choose 5, 10, 15, or 20.');
    }
     if (!shortAnswerOptions.includes(numShortAnswer)) {
        res.status(400);
        throw new Error('Invalid number of short answer questions selected. Choose 0, 1, 2, or 3.');
    }
    if (numMCQs + numShortAnswer <= 0) {
         res.status(400);
        throw new Error('Quiz must have at least one question.');
    }

    
    const user = await User.findById(userId).select('encryptedGeminiKey');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    if (!user.encryptedGeminiKey) {
        res.status(400);
        throw new Error('Gemini API Key not set. Please set it in your account settings.');
    }

    let apiKey;
    try {
        apiKey = decrypt(user.encryptedGeminiKey);
    } catch (decryptError) {
        console.error('Failed to decrypt API key for user:', userId, decryptError);
        res.status(500);
        throw new Error('Could not decrypt API key. Please re-save your key.');
    }
    if (!apiKey) {
        res.status(500);
        throw new Error('API key was not decrypted correctly.');
    }

   
    const notebook = await Notebook.findOne({ _id: notebookId, user: userId });
    if (!notebook) {
        res.status(404);
        throw new Error('Notebook not found or not authorized');
    }

    const documents = await Document.find({
        _id: { $in: selectedDocumentIds },
        notebook: notebookId,
        user: userId,
        processed: true
    }).select('_id content title originalFilename');

    if (documents.length === 0) {
        res.status(404);
        throw new Error('No valid, processed documents found with the provided IDs');
    }

    
    const quizTitle = `Quiz on ${documents.map(d => d.title || d.originalFilename).join(', ')}`.substring(0, 100); // Basic title
    const initialQuiz = new Quiz({
        user: userId,
        notebook: notebookId,
        title: quizTitle,
        sourceDocumentIds: selectedDocumentIds,
        model: modelName,
        status: 'generating', 
        numMCQs: numMCQs,
        numShortAnswer: numShortAnswer,
        questions: [], 
    });
    await initialQuiz.save();

    
    const documentsContext = documents.map(doc =>
        `Document: "${doc.title || doc.originalFilename}"\n${doc.content.text}\n---\n` 
    ).join('\n'); 

    const systemPrompt = `You are an expert quiz creator specializing in educational content.
Generate a quiz based on the provided documents with the following specifications:
- Number of Multiple Choice Questions (MCQs): ${numMCQs}
- Number of Short Answer Questions: ${numShortAnswer}

REQUIREMENTS:
1.  **MCQs:**
    *   Create questions that test understanding, application, or analysis, not just recall.
    *   Provide 4 distinct options (A, B, C, D).
    *   Ensure only ONE option is clearly the correct answer based *solely* on the provided documents.
    *   Mark the correct answer clearly.
2.  **Short Answer Questions:**
    *   Ask questions that require a brief explanation, definition, or summary (1-3 sentences).
    *   The answer should be directly derivable from the provided documents.
    *   Provide the ideal correct answer.
3.  **General:**
    *   Base ALL questions and answers strictly on the provided document content. Do not introduce external knowledge.
    *   Ensure questions are clear, unambiguous, and grammatically correct.
    *   Vary question difficulty and style.

OUTPUT FORMAT:
Return ONLY a raw JSON object (no markdown, code blocks, or explanations) with the following structure:

{
  "mcqs": [
    {
      "questionText": "MCQ question 1?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B" // The text of the correct option
    },
    // ... more MCQs
  ],
  "short_answers": [
    {
      "questionText": "Short answer question 1?",
      "correctAnswer": "The ideal concise answer based on the text."
    },
    // ... more short answer questions
  ]
}

DOCUMENTS CONTENT:
${documentsContext}

REMEMBER:
- Output ONLY the JSON object.
- Adhere strictly to the requested number of MCQs and short answer questions.
- Use only the provided document content.`; 

    
    generateChatResponse(
        apiKey,
        modelName,
        systemPrompt,
        [], 
        `Generate ${numMCQs} MCQs and ${numShortAnswer} short answer questions.`
    ).then(async aiResponse => {
        let quizData;
        try {
            
            let cleanResponse = aiResponse.replace(/^```json\s*|\s*```$/g, '');
            quizData = JSON.parse(cleanResponse);

            if (!quizData || !Array.isArray(quizData.mcqs) || !Array.isArray(quizData.short_answers)) {
                throw new Error('Invalid JSON structure received from AI.');
            }

            const questions = [
                ...quizData.mcqs.map(q => ({
                    type: 'mcq',
                    questionText: q.questionText,
                    options: q.options,
                    correctAnswer: q.correctAnswer, 
                    userAnswer: null
                })),
                ...quizData.short_answers.map(q => ({
                    type: 'short_answer',
                    questionText: q.questionText,
                    correctAnswer: q.correctAnswer, 
                    userAnswer: null
                }))
            ];

            
            await Quiz.findByIdAndUpdate(initialQuiz._id, {
                questions: questions,
                status: 'ongoing', 
                lastAttemptedAt: Date.now() 
            });
            console.log(`Quiz ${initialQuiz._id} generated successfully for user ${userId}`);
            await Notebook.findByIdAndUpdate(notebookId, { lastUpdated: Date.now() });


        } catch (parseOrSaveError) {
            console.error(`Error processing AI response or saving quiz ${initialQuiz._id} for user ${userId}:`, parseOrSaveError);
            console.error("AI Response preview:", aiResponse.substring(0, 200));
            
            await Quiz.findByIdAndUpdate(initialQuiz._id, {
                 status: 'error',
                 feedback: 'Failed to generate quiz questions from AI response. Please try again.' // Add feedback
            });
        }
    }).catch(async aiError => {
        console.error(`[Quiz Controller] Gemini API error during quiz generation for user ${userId}, quiz ${initialQuiz._id}:`, aiError);
        
         await Quiz.findByIdAndUpdate(initialQuiz._id, {
             status: 'error',
             feedback: aiError.message || 'An error occurred while communicating with the AI assistant.'
         });
    });

   
    res.status(202).json({ 
        success: true,
        message: 'Quiz generation started. It will be available shortly.',
        data: {
            quizId: initialQuiz._id,
            status: initialQuiz.status
        }
    });
});



const getQuizzes = asyncHandler(async (req, res) => {
    const { notebookId } = req.params;
    const userId = req.user.id;

    const notebook = await Notebook.findOne({ _id: notebookId, user: userId });
    if (!notebook) {
        res.status(404);
        throw new Error('Notebook not found or not authorized');
    }

    const quizzes = await Quiz.find({ notebook: notebookId, user: userId })
        .select('_id title status createdAt completedAt score numMCQs numShortAnswer') // Select necessary fields
        .sort({ createdAt: -1 }); // Sort by creation date

    const ongoingQuizzes = quizzes.filter(q => q.status === 'ongoing' || q.status === 'generating' || q.status === 'error');
    const completedQuizzes = quizzes.filter(q => q.status === 'completed');

    res.status(200).json({
        success: true,
        data: {
            ongoing: ongoingQuizzes,
            completed: completedQuizzes
        }
    });
});


const getQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user.id;

   
    const quiz = await Quiz.findOne({ _id: quizId, user: userId })
                           .populate('sourceDocumentIds', 'title originalFilename'); // Populate document info

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or not authorized');
    }

     

    res.status(200).json({
        success: true,
        data: quiz
    });
});



const submitQuizAttempt = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const { answers } = req.body; 
    const userId = req.user.id;

    if (!answers || typeof answers !== 'object') {
        res.status(400);
        throw new Error('Invalid answers format provided.');
    }

    const quiz = await Quiz.findOne({ _id: quizId, user: userId });

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or not authorized');
    }

    if (quiz.status !== 'ongoing') {
        res.status(400);
        throw new Error(`Quiz is not ongoing. Current status: ${quiz.status}`);
    }

    let updated = false;
    
    quiz.questions.forEach((question, index) => {
        
        const answerKey = String(index);
        if (answers.hasOwnProperty(answerKey)) {
           
            if (question.userAnswer !== answers[answerKey]) {
                 question.userAnswer = answers[answerKey];
                 updated = true;
            }
        }
    });

    if (updated) {
        quiz.lastAttemptedAt = Date.now();
        await quiz.save();
         res.status(200).json({
            success: true,
            message: 'Quiz progress saved successfully.',
            data: { quizId: quiz._id, lastAttemptedAt: quiz.lastAttemptedAt }
        });
    } else {
         res.status(200).json({ 
            success: true,
            message: 'No changes detected in answers.',
             data: { quizId: quiz._id }
        });
    }
});



const gradeQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user.id;

    const quiz = await Quiz.findOne({ _id: quizId, user: userId })
                           .populate('sourceDocumentIds', 'content title originalFilename'); // Need content for grading context

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or not authorized');
    }

    if (quiz.status !== 'ongoing') {
         res.status(400);
         throw new Error(`Quiz cannot be graded. Current status: ${quiz.status}`);
    }

    
    const allAnswered = quiz.questions.every(q => q.userAnswer !== null && q.userAnswer !== '');
    if (!allAnswered) {
        res.status(400);
        throw new Error('Please answer all questions before submitting for grading.');
    }

     
    const user = await User.findById(userId).select('encryptedGeminiKey');
     if (!user || !user.encryptedGeminiKey) {
        res.status(400); // Or 500 if key should exist but doesn't
        throw new Error('User or API Key not found. Cannot grade quiz.');
    }
    let apiKey;
    try {
        apiKey = decrypt(user.encryptedGeminiKey);
    } catch (decryptError) {
        res.status(500);
        throw new Error('Could not decrypt API key for grading.');
    }
     if (!apiKey) {
        res.status(500);
        throw new Error('API key was not decrypted correctly for grading.');
    }


    
    let correctMCQs = 0;
    let totalMCQs = 0;
    quiz.questions.forEach(q => {
        if (q.type === 'mcq') {
            totalMCQs++;
            
            if (q.userAnswer && q.correctAnswer && q.userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
                correctMCQs++;
            }
        }
    });

    
    const shortAnswerQuestions = quiz.questions.filter(q => q.type === 'short_answer');
    let finalScore = null;
    let finalFeedback = 'Grading failed or no short answers to grade.'; // Default feedback

    if (shortAnswerQuestions.length > 0) {
        
        const documentsContext = quiz.sourceDocumentIds.map(doc =>
            `Document: "${doc.title || doc.originalFilename}"\n${doc.content.text}\n---\n` // Keep escaped \n here
        ).join('\n'); // Use single \n for joining

        const answersToGradeContext = shortAnswerQuestions.map((q, index) =>
            `Short Answer Question ${index + 1}:\nQuestion: ${q.questionText}\nIdeal Answer: ${q.correctAnswer}\nStudent's Answer: ${q.userAnswer}\n---\n` // Keep escaped \n here
        ).join('\n'); // Use single \n for joining

        const gradingPrompt = `You are an AI grading assistant. Evaluate the student's short answers based on the provided context (documents) and the ideal answers.

CONTEXT DOCUMENTS:
${documentsContext}

STUDENT'S SHORT ANSWERS TO GRADE:
${answersToGradeContext}

INSTRUCTIONS:
1.  For each short answer, determine if the student's answer is correct, partially correct, or incorrect compared to the ideal answer and the context documents.
2.  Calculate the number of correctly answered short answer questions. A partially correct answer does not count as fully correct.
3.  Provide overall feedback (2-4 sentences) summarizing the student's performance on the short answers, highlighting strengths and areas for improvement based *only* on their answers and the provided context. Be constructive.
4.  Return ONLY a raw JSON object (no markdown, code blocks, or explanations) with the following structure:

{
  "correctShortAnswers": <number_of_correct_short_answers>,
  "feedback": "Overall feedback text here..."
}

EXAMPLE OUTPUT:
{
  "correctShortAnswers": 1,
  "feedback": "The student demonstrated good understanding in the first short answer, aligning well with the source material. The second answer lacked sufficient detail mentioned in the documents. Focus on incorporating key terms from the text for future improvement."
}

REMEMBER: Output ONLY the JSON object.`; 

        try {
            const aiResponse = await generateChatResponse(
                apiKey,
                quiz.model, // Use the same model used for generation
                gradingPrompt,
                [],
                "Grade student's short answers and provide feedback."
            );

            let gradingResult;
             try {
                // Clean the response to remove any code block formatting
                let cleanResponse = aiResponse.replace(/^```json\s*|\s*```$/g, '');
                gradingResult = JSON.parse(cleanResponse);
            } catch (parseError) {
                 console.error("Error parsing AI grading response:", parseError);
                 console.error("AI Response preview:", aiResponse.substring(0, 150));
                 throw new Error('Failed to parse AI grading response.'); // Propagate error
            }


            if (typeof gradingResult.correctShortAnswers !== 'number' || typeof gradingResult.feedback !== 'string') {
                throw new Error('Invalid format received from AI grading service.');
            }

            const correctShort = gradingResult.correctShortAnswers;
            const totalShort = shortAnswerQuestions.length;
            const totalCorrect = correctMCQs + correctShort;
            const totalQuestions = totalMCQs + totalShort;

            finalScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
            finalFeedback = gradingResult.feedback;

        } catch (aiGradeError) {
            console.error(`[Quiz Controller] Gemini API error during grading for quiz ${quizId}:`, aiGradeError);
            
            finalScore = totalMCQs > 0 ? Math.round((correctMCQs / totalMCQs) * 100) : 0; // Score based only on MCQs
            finalFeedback = `MCQ grading complete. Automatic grading for short answers failed: ${aiGradeError.message}. Score reflects MCQs only.`;
             
        }

    } else {
        
        const totalQuestions = totalMCQs;
        finalScore = totalQuestions > 0 ? Math.round((correctMCQs / totalQuestions) * 100) : 100; // 100 if 0 questions? Or 0? Let's say 100 if 0 MCQs.
        finalFeedback = "Quiz contained only multiple-choice questions. Grading complete.";
    }

    
    quiz.score = finalScore;
    quiz.feedback = finalFeedback;
    quiz.status = 'completed';
    quiz.completedAt = Date.now();
    quiz.lastAttemptedAt = Date.now(); 

    await quiz.save();
    await Notebook.findByIdAndUpdate(quiz.notebook, { lastUpdated: Date.now() });


    res.status(200).json({
        success: true,
        message: 'Quiz graded successfully.',
        data: {
            quizId: quiz._id,
            score: quiz.score,
            feedback: quiz.feedback,
            status: quiz.status
        }
    });
});



const deleteQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user.id;

    const quiz = await Quiz.findOne({ _id: quizId, user: userId });
    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or not authorized to delete');
    }

    await Quiz.findByIdAndDelete(quizId);
    await Notebook.findByIdAndUpdate(quiz.notebook, { lastUpdated: Date.now() });


    res.status(200).json({
        success: true,
        message: 'Quiz deleted successfully'
    });
});


module.exports = {
    generateQuiz,
    getQuizzes,
    getQuiz,
    submitQuizAttempt,
    gradeQuiz,
    deleteQuiz
};
