const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Notebook = require('../models/Notebook');
const Document = require('../models/Document');
const Flashcard = require('../models/Flashcard');
const { decrypt } = require('../services/encryptionService');
const { generateChatResponse } = require('../services/geminiService');

const generateFlashcards = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const { selectedDocumentIds, model: modelName } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(selectedDocumentIds) || selectedDocumentIds.length === 0) {
    res.status(400);
    throw new Error('Please select at least one document');
  }

  if (!modelName) {
    res.status(400);
    throw new Error('Model selection is required');
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
    throw new Error('No valid documents found with the provided IDs');
  }

  const existingFlashcards = await Flashcard.find({
    notebook: notebookId,
    user: userId
  }).select('question answer');

  const documentsContext = documents.map(doc => 
    `Document: "${doc.title || doc.originalFilename}"
${doc.content.text}
---
`
  ).join('\n');

  let existingFlashcardsContext = "";
  if (existingFlashcards.length > 0) {
    existingFlashcardsContext = "EXISTING FLASHCARDS (DO NOT DUPLICATE THESE):\n" + 
      existingFlashcards.map((card, index) => 
        `Card ${index + 1}:\nQuestion: ${card.question}\nAnswer: ${card.answer}\n---\n`
      ).join('\n');
  }

  const systemPrompt = `You are an expert at creating educational flashcards based on academic content.
I will provide you with content from documents, and you need to generate 10 high-quality flashcards.

REQUIREMENTS:
1. Create questions that test understanding rather than just memorization
2. Keep questions clear, specific, and concise
3. Provide accurate, comprehensive answers based solely on the provided content
4. Do not create duplicate flashcards (I've provided existing flashcards - do not repeat them)
5. Return your response in the following structured JSON format:

[
  {
    "question": "First question here?",
    "answer": "Comprehensive answer here"
  },
  {
    "question": "Second question here?", 
    "answer": "Comprehensive answer here"
  },
  ...
]

${existingFlashcardsContext ? existingFlashcardsContext + "\n\n" : ""}
DOCUMENTS CONTENT TO USE FOR FLASHCARDS:
${documentsContext}

REMEMBER:
- Return ONLY a raw JSON array with no formatting, code blocks, or markdown
- DO NOT include \`\`\`json at the beginning or \`\`\` at the end
- No explanations, comments or any text outside of the JSON array
- Create exactly 10 flashcards unless there's not enough content
- Only use information found in the provided documents
- Ensure answers are comprehensive but concise`;

  try {
    const aiResponse = await generateChatResponse(
      apiKey,
      modelName,
      systemPrompt,
      [],
      "Generate 10 high-quality flashcards based on the provided documents."
    );    let flashcardsData;
    try {
      let cleanResponse = aiResponse;
      cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
      flashcardsData = JSON.parse(cleanResponse);    } catch (parseError) {
      console.error("Error parsing AI response as JSON:", parseError);
      console.error("AI Response preview:", aiResponse.substring(0, 150));
      res.status(500);
      throw new Error('Failed to parse AI response into valid flashcards. Please try again.');
    }

    if (!Array.isArray(flashcardsData)) {
      res.status(500);
      throw new Error('AI response format was not valid. Expected an array of flashcards.');
    }

    const savedFlashcards = await Promise.all(flashcardsData.map(async (card) => {
      const flashcard = new Flashcard({
        notebook: notebookId,
        user: userId,
        question: card.question,
        answer: card.answer,
        sourceDocumentIds: selectedDocumentIds,
        model: modelName
      });

      await flashcard.save();
      return {
        id: flashcard._id,
        question: flashcard.question,
        answer: flashcard.answer
      };
    }));

    await Notebook.findByIdAndUpdate(notebookId, { lastUpdated: Date.now() });

    res.status(201).json({
      success: true,
      data: savedFlashcards
    });

  } catch (aiError) {
    console.error(`[Flashcard Controller] Gemini API error for user ${userId}:`, aiError);
    res.status(500);
    throw new Error(aiError.message || 'Failed to generate flashcards from AI assistant.');
  }
});

const getFlashcards = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const userId = req.user.id;

  const notebook = await Notebook.findOne({ _id: notebookId, user: userId });
  if (!notebook) {
    res.status(404);
    throw new Error('Notebook not found or not authorized');
  }

  const flashcards = await Flashcard.find({ notebook: notebookId, user: userId })
    .select('_id question answer createdAt')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: flashcards
  });
});

const deleteFlashcard = asyncHandler(async (req, res) => {
  const { flashcardId } = req.params;
  const userId = req.user.id;

  const flashcard = await Flashcard.findOne({ _id: flashcardId, user: userId });
  if (!flashcard) {
    res.status(404);
    throw new Error('Flashcard not found or not authorized to delete');
  }

  await Flashcard.findByIdAndDelete(flashcardId);

  res.status(200).json({
    success: true,
    message: 'Flashcard deleted successfully'
  });
});

module.exports = {
  generateFlashcards,
  getFlashcards,
  deleteFlashcard
};
