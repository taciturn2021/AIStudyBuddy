const express = require('express');
const https = require('https'); // Use Node's built-in https module
const { protect } = require('../middleware/authMiddleware');
const { decrypt } = require('../services/encryptionService');

const router = express.Router();

// --- Helper Function to Fetch Models via REST API ---
const fetchModelsFromApi = (apiKey) => {
    return new Promise((resolve, reject) => {
        if (!apiKey) {
             return reject(new Error("API key is missing for Google API request."));
        }
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            // Ensure correct API version and endpoint
            path: `/v1beta/models?key=${encodeURIComponent(apiKey)}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsedData = JSON.parse(data);
                        // Check if the response structure is as expected
                        if (parsedData && Array.isArray(parsedData.models)) {
                           resolve(parsedData);
                        } else {
                           console.error("Unexpected models API response structure:", data);
                           reject(new Error('Invalid response structure from models API.'));
                        }
                    } catch (parseError) {
                        console.error("Failed to parse models API response:", parseError, "Data:", data);
                        reject(new Error('Failed to parse models API response.'));
                    }
                } else {
                     let errorMessage = `Failed to fetch models. Status: ${res.statusCode}`;
                     try {
                         // Try to parse error details from Google's response
                         const errorData = JSON.parse(data);
                         if (errorData.error && errorData.error.message) {
                             errorMessage += `: ${errorData.error.message}`;
                         } else {
                             errorMessage += ` - Response: ${data}`;
                         }
                     } catch (e) {
                         errorMessage += ` - Raw Response: ${data}`;
                     }
                     console.error("Error response from models API:", errorMessage);
                     reject(new Error(errorMessage));
                }
            });
        });

        req.on('error', (e) => {
            console.error("HTTPS request error fetching models:", e);
            reject(new Error(`Network error fetching models: ${e.message}`));
        });

        // Handle potential timeouts
        req.setTimeout(10000, () => { // 10 second timeout
             req.destroy(new Error('Request to Google API timed out'));
        });


        req.end();
    });
};
// --- End Helper Function ---


// --- Route Definition ---
/**
 * @route   GET /api/models
 * @desc    Get list of available Gemini models supporting generateContent using user's key
 * @access  Private (Requires Auth)
 */
router.get('/', protect, async (req, res) => { // Removed 'next' as we handle errors directly
    try {
        // 1. Get encrypted key from authenticated user
        const encryptedKey = req.user?.encryptedGeminiKey;
        if (!encryptedKey) {
            // Send 403 Forbidden as the user is authenticated but lacks permission/config
            return res.status(403).json({ success: false, message: 'API key not configured for this user.' });
        }

        // 2. Decrypt the key
        let decryptedKey;
        try {
            decryptedKey = decrypt(encryptedKey);
        } catch (decryptError) {
            console.error('Error decrypting user API key for user:', req.user?.id, decryptError);
            const message = decryptError.message.includes('decrypt data')
                ? 'Failed to decrypt API key. Please check if it was saved correctly.'
                : 'Internal server error during key decryption.';
            return res.status(500).json({ success: false, message: message });
        }

        if (!decryptedKey) {
             console.error('API key decrypted to an invalid value for user:', req.user?.id);
             return res.status(500).json({ success: false, message: 'API key decrypted to an invalid value.' });
        }

        // 3. Fetch models using the helper function
        console.log("Fetching available models from Google AI REST API using user key...");
        const modelsResponse = await fetchModelsFromApi(decryptedKey);
        const allModels = modelsResponse.models || []; // Ensure models array exists

        // 4. Filter and Format
        // Define the allowed model display names
        const allowedDisplayNames = new Set([
            "Gemini 2.5 Pro Experimental 03-25", // Matching 2.5 Pro from image
            "Gemini 2.0 Flash",                 // Matching 2.0 Flash
            "Gemini 2.0 Flash-Lite 001",        // Matching 2.0 Flash Lite from image
            "Gemini 2.5 Flash Preview 04-17"      // Matching 2.5 Flash from image
        ]);

        const availableModels = allModels
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
            // Add the new filter based on displayName
            .filter(m => allowedDisplayNames.has(m.displayName))
            .map(m => ({
                id: m.name,          // e.g., "models/gemini-1.5-flash-latest"
                name: m.displayName, // e.g., "Gemini 1.5 Flash"
            }));

        console.log(`Found ${availableModels.length} allowed models supporting generateContent for user ${req.user?.id}.`);

        // 5. Send Response
        res.json({ success: true, data: availableModels });

    } catch (error) {
        // Log the detailed error on the server
        console.error('Error in /api/models route for user:', req.user?.id, error);

        // Send a user-friendly error message
        // Use the message from fetchModelsFromApi if it's specific, otherwise generic
        const clientMessage = (error.message && (error.message.includes('fetch models') || error.message.includes('API response') || error.message.includes('Google API')))
             ? error.message // Pass the more specific error from the helper
             : 'An unexpected server error occurred while fetching AI models.';

        // Determine appropriate status code (500 for server issues, maybe 502/503 for Google API issues)
        const statusCode = error.message.includes('Status:') ? 502 : 500; // Example: 502 for Bad Gateway if API failed

        res.status(statusCode).json({ success: false, message: clientMessage });
    }
});
// --- End Route Definition ---

module.exports = router;
