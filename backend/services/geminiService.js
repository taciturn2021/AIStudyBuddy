const { GoogleGenerativeAI } = require('@google/generative-ai');

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



module.exports = { validateGeminiApiKey }; 