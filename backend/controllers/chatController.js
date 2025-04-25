const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Notebook = require('../models/Notebook');
const Document = require('../models/Document');
const Chat = require('../models/Chat');
const { decrypt } = require('../services/encryptionService');
const { generateChatResponse } = require('../services/geminiService');

const SYSTEM_PROMPT = `You are an AI Study Buddy. Your goal is to help the user understand and learn from the provided context AND the ongoing conversation history.

CONTEXT START
---
{CONTEXT}
---
CONTEXT END

Based on the provided context AND the conversation history, answer the user's questions, generate summaries, create flashcards, quizzes, or explain concepts related to the text and the discussion so far. Be concise, clear, and focus on the information within the documents and conversation. If the user asks about information not present in the context or history, state that the information is not available in the provided documents or conversation. Do not use external knowledge unless specifically asked to compare the context with general knowledge, and even then, clearly distinguish between the context, history, and external information. Maintain the flow of the conversation.`;

const handleChatMessage = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const { prompt, model: modelName, selectedDocumentIds, chatId: existingChatId } = req.body;
  const userId = req.user.id;

  if (!prompt) {
    res.status(400);
    throw new Error('Prompt is required');
  }
  if (!modelName) {
    res.status(400);
    throw new Error('Model selection is required');
  }
  if (!Array.isArray(selectedDocumentIds)) {
    res.status(400);
    throw new Error('selectedDocumentIds must be an array');
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

  let context = 'No documents selected or found.';

  if (selectedDocumentIds.length > 0) {
    const documents = await Document.find({
      _id: { $in: selectedDocumentIds },
      user: userId,
      notebook: notebookId,
      processed: true
    }).select('content title originalFilename');

    if (documents.length > 0) {
      context = documents.map(doc => 
        `Document: "${doc.title || doc.originalFilename}"
${doc.content}
---
`
      ).join('\n');
    }
  }

  let baseSystemPrompt = "You are an AI Study Assistant that helps students learn from their documents. ";
  baseSystemPrompt += "Answer questions directly and concisely based on the content provided, citing specific sections when relevant. ";
  baseSystemPrompt += "If the information isn't in the documents, clearly say so and offer general advice if possible. ";
  baseSystemPrompt += "Use proper Markdown formatting in your responses for better readability. Format your response using Markdown syntax for: ";
  baseSystemPrompt += "- Headings (use # for main heading, ## for subheadings, etc. - don't display the # symbols as text) ";
  baseSystemPrompt += "- Bullet points using * or - at the start of lines ";
  baseSystemPrompt += "- Numbered lists using 1., 2., etc. ";
  baseSystemPrompt += "- Code blocks using triple backticks ``` before and after code ";
  baseSystemPrompt += "- Bold text using **bold** and italic using *italic* ";
  baseSystemPrompt += "- Tables using | for columns and - for headers ";
  baseSystemPrompt += "IMPORTANT: Do not include the Markdown syntax characters as visible text in your response. For example, write headings as '# Heading' not 'Hashtag Heading' or '## Subheading' not 'Hash Hash Subheading'.";

  let finalSystemPrompt = baseSystemPrompt;
  if (context !== 'No documents selected or found.') {
    finalSystemPrompt += "\n\nHere are the documents to reference:\n\n" + context;
  }

  let currentChat;
  let geminiHistory = [];

  const cleanPrompt = prompt.replace(/\n\n\[System:.*?\]/s, '');
  const userMessage = { role: 'user', content: cleanPrompt };

  if (existingChatId) {
    currentChat = await Chat.findOne({ _id: existingChatId, user: userId, notebook: notebookId });
    if (!currentChat) {
      res.status(404);
      throw new Error('Chat session not found or not authorized.');
    }
    currentChat.messages.push(userMessage);
    geminiHistory = currentChat.messages
        .filter(msg => msg.role === 'user' || msg.role === 'model')
        .map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
  } else {
    currentChat = new Chat({
      user: userId,
      notebook: notebookId,
      messages: [userMessage]
    });
    geminiHistory = [];
  }

  try {
    const replyText = await generateChatResponse(
      apiKey,
      modelName,
      finalSystemPrompt,
      geminiHistory,
      prompt
    );

    const modelMessage = { role: 'model', content: replyText };
    currentChat.messages.push(modelMessage);
    currentChat.lastUpdatedAt = Date.now();
    await currentChat.save();
    res.status(200).json({ 
        success: true, 
        data: { 
            reply: replyText,
            chatId: currentChat._id 
        } 
    });
  } catch (geminiError) {
    console.error(`[Chat Controller] Gemini API error for user ${userId}, chat ${currentChat?._id}:`, geminiError);
    if (currentChat && existingChatId) {
        currentChat.messages.push({ role: 'model', content: `Error: ${geminiError.message || 'Failed to get response.'}` });
        currentChat.lastUpdatedAt = Date.now();
        try {
            await currentChat.save();
        } catch (saveError) {
            console.error(`[Chat Controller] Failed to save error message to chat ${existingChatId}:`, saveError);
        }
    }
    res.status(500);
    throw new Error(geminiError.message || 'Failed to get response from AI assistant.');
  }
});

const getChatsForNotebook = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const userId = req.user.id;
  const notebook = await Notebook.findOne({ _id: notebookId, user: userId });
  if (!notebook) {
    res.status(404);
    throw new Error('Notebook not found or not authorized');
  }
  const chats = await Chat.find({ notebook: notebookId, user: userId })
                          .select('_id title createdAt lastUpdatedAt')
                          .sort({ lastUpdatedAt: -1 });
  res.status(200).json({ success: true, data: chats });
});

const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  const chat = await Chat.findOne({ _id: chatId, user: userId })
                         .select('messages notebook');
  if (!chat) {
    res.status(404);
    throw new Error('Chat session not found or not authorized.');
  }
  res.status(200).json({ success: true, data: { messages: chat.messages } });
});

const deleteChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;
    const chat = await Chat.findOne({ _id: chatId, user: userId });
    if (!chat) {
        res.status(404);
        throw new Error('Chat session not found or not authorized to delete.');
    }
    await chat.deleteOne();
    res.status(200).json({ success: true, message: 'Chat deleted successfully.' });
});

const updateChatTitle = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;
    if (!title) {
        res.status(400);
        throw new Error('Title is required.');
    }
    const chat = await Chat.findOne({ _id: chatId, user: userId });
    if (!chat) {
        res.status(404);
        throw new Error('Chat session not found or not authorized to update.');
    }
    chat.title = title;
    chat.lastUpdatedAt = Date.now();
    await chat.save();
    res.status(200).json({ 
        success: true, 
        data: { 
            _id: chat._id, 
            title: chat.title,
            lastUpdatedAt: chat.lastUpdatedAt 
        } 
    });
});

module.exports = { 
    handleChatMessage, 
    getChatsForNotebook,
    getChatMessages,
    deleteChat,
    updateChatTitle
}; 