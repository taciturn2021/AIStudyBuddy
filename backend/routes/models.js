const express = require('express');
const https = require('https');
const { protect } = require('../middleware/authMiddleware');
const { decrypt } = require('../services/encryptionService');

const router = express.Router();

const fetchModelsFromApi = (apiKey) => {
    return new Promise((resolve, reject) => {
        if (!apiKey) {
             return reject(new Error("API key is missing for Google API request."));
        }
        const options = {
            hostname: 'generativelanguage.googleapis.com',
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
                        if (parsedData && Array.isArray(parsedData.models)) {
                           resolve(parsedData);
                        } else {
                           reject(new Error('Invalid response structure from models API.'));
                        }
                    } catch (parseError) {
                        reject(new Error('Failed to parse models API response.'));
                    }
                } else {
                     let errorMessage = `Failed to fetch models. Status: ${res.statusCode}`;
                     try {
                         const errorData = JSON.parse(data);
                         if (errorData.error && errorData.error.message) {
                             errorMessage += `: ${errorData.error.message}`;
                         } else {
                             errorMessage += ` - Response: ${data}`;
                         }
                     } catch (e) {
                         errorMessage += ` - Raw Response: ${data}`;
                     }
                     reject(new Error(errorMessage));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`Network error fetching models: ${e.message}`));
        });

        req.setTimeout(10000, () => {
             req.destroy(new Error('Request to Google API timed out'));
        });

        req.end();
    });
};

router.get('/', protect, async (req, res) => { 
    try {
        const encryptedKey = req.user?.encryptedGeminiKey;
        if (!encryptedKey) {
            return res.status(403).json({ success: false, message: 'API key not configured for this user.' });
        }

        let decryptedKey;
        try {
            decryptedKey = decrypt(encryptedKey);
        } catch (decryptError) {
            const message = decryptError.message.includes('decrypt data')
                ? 'Failed to decrypt API key. Please check if it was saved correctly.'
                : 'Internal server error during key decryption.';
            return res.status(500).json({ success: false, message: message });
        }

        if (!decryptedKey) {
             return res.status(500).json({ success: false, message: 'API key decrypted to an invalid value.' });
        }

        const modelsResponse = await fetchModelsFromApi(decryptedKey);
        const allModels = modelsResponse.models || [];

        const allowedDisplayNames = new Set([
            "Gemini 2.5 Flash",
            "Gemini 2.5 Flash-Lite Preview"
        ]);

        const availableModels = allModels
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
            .filter(m => allowedDisplayNames.has(m.displayName))
            .map(m => ({
                id: m.name,
                name: m.displayName,
            }));

        res.json({ success: true, data: availableModels });

    } catch (error) {
        const clientMessage = (error.message && (error.message.includes('fetch models') || error.message.includes('API response') || error.message.includes('Google API')))
             ? error.message
             : 'An unexpected server error occurred while fetching AI models.';

        const statusCode = error.message.includes('Status:') ? 502 : 500;

        res.status(statusCode).json({ success: false, message: clientMessage });
    }
});

module.exports = router;
