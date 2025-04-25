const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

async function validateGeminiApiKey(apiKey) {
  if (!apiKey) {
    return { isValid: false, error: 'API Key is required.' };
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 
    await model.countTokens("test"); 
    
    console.log('[Gemini Service] API Key validated successfully.');
    return { isValid: true };
  } catch (error) {
    console.error('[Gemini Service] API Key validation failed:', error.message);
    let userErrorMessage = 'Invalid API Key or connection error.';
    if (error.message.includes('API key not valid')) {
        userErrorMessage = 'The provided API Key is not valid. Please check and try again.';
    }
    return { isValid: false, error: userErrorMessage };
  }
}

/**
 * Generates a chat response using the Gemini API.
 * @param {string} apiKey - The user's Gemini API key.
 * @param {string} modelName - The ID of the model to use (e.g., 'gemini-1.5-flash-latest').
 * @param {string} systemInstruction - The system prompt/instruction.
 * @param {Array<object>} history - The chat history (optional). Example: [{role: 'user', parts: [{text: 'Hi'}]}, {role: 'model', parts: [{text: 'Hello!'}]}]
 * @param {string} userPrompt - The user's latest prompt.
 * @returns {Promise<string>} - The generated text response.
 */
async function generateChatResponse(apiKey, modelName, systemInstruction, history = [], userPrompt) {
  if (!apiKey) {
    throw new Error('API Key is required for chat generation.');
  }
  if (!modelName) {
    throw new Error('Model name is required.');
  }
  if (!userPrompt) {
    throw new Error('User prompt is required.');
  }

  console.log(`[Gemini Service] Generating chat response with model: ${modelName}`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: {
        role: "system", // Role should likely be system or user based on API needs
        parts: [{ text: systemInstruction }],
      },
      // Add safety settings if needed - example below
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const chat = model.startChat({
      history: history, // Pass existing history
      generationConfig: {
        //maxOutputTokens: 1000, // Optional: configure as needed
      },
    });

    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    const text = response.text();
    console.log('[Gemini Service] Chat response generated successfully.');
    return text;

  } catch (error) {
    console.error(`[Gemini Service] Error generating chat response with model ${modelName}:`, error);
    // Improve error message feedback
    let friendlyMessage = 'Failed to generate AI response.';
    if (error.message.includes('API key not valid')) {
      friendlyMessage = 'Invalid Gemini API Key. Please update it in your account settings.';
    } else if (error.message.includes('quota')) {
      friendlyMessage = 'API quota exceeded. Please check your Gemini account usage.';
    } else if (error.message.includes('429')) { // Rate limit
        friendlyMessage = 'API rate limit hit. Please wait a moment and try again.';
    } else if (error.response?.promptFeedback?.blockReason) {
        friendlyMessage = `Request blocked due to safety settings: ${error.response.promptFeedback.blockReason}`;
    } else if (error.message.includes('Could not find model')) {
        friendlyMessage = `Model '${modelName}' not found or not available with your API key.`;
    }

    throw new Error(friendlyMessage); 
  }
}

module.exports = { validateGeminiApiKey, generateChatResponse }; 