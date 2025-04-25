import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/chat`; // Base URL for chat endpoints

// Function to get the auth token from local storage
const getAuthToken = () => localStorage.getItem('token');

// Function to create authenticated headers
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

/**
 * Sends a chat message to the backend AI assistant.
 * @param {string} notebookId - The ID of the notebook.
 * @param {object} payload - The chat payload.
 * @param {string} payload.prompt - The user's prompt.
 * @param {string} payload.model - The selected AI model ID.
 * @param {string[]} payload.selectedDocumentIds - Array of selected document IDs for context.
 * @param {string|null} [payload.chatId] - The ID of the existing chat, or null/undefined to create a new one.
 * @returns {Promise<object>} - The backend response, e.g., { success: true, data: { reply: string, chatId: string } }.
 */
export const sendChatMessage = async (notebookId, payload) => {
  if (!notebookId) {
    throw new Error('Notebook ID is required to send chat message.');
  }
  try {
    // The payload now includes the optional chatId
    const response = await axios.post(`${API_URL}/${notebookId}`, payload, getAuthHeaders());
    // Response now includes chatId: { success: true, data: { reply: '...', chatId: '...' } }
    return response.data;
  } catch (error) {
    console.error(`Error sending chat message for notebook ${notebookId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetches the list of chat sessions for a given notebook.
 * @param {string} notebookId - The ID of the notebook.
 * @returns {Promise<object>} - The backend response, e.g., { success: true, data: [chatList] }.
 */
export const getChats = async (notebookId) => {
    if (!notebookId) {
        throw new Error('Notebook ID is required to get chats.');
    }
    try {
        const response = await axios.get(`${API_URL}/${notebookId}`, getAuthHeaders());
        return response.data; // Expected format: { success: true, data: [{ _id, title, ... }] }
    } catch (error) {
        console.error(`Error fetching chats for notebook ${notebookId}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetches all messages for a specific chat session.
 * @param {string} chatId - The ID of the chat session.
 * @returns {Promise<object>} - The backend response, e.g., { success: true, data: { messages: [messageList] } }.
 */
export const getChatMessages = async (chatId) => {
    if (!chatId) {
        throw new Error('Chat ID is required to get messages.');
    }
    try {
        // Note the endpoint change to include the chatId and /messages
        const response = await axios.get(`${API_URL}/${chatId}/messages`, getAuthHeaders());
        return response.data; // Expected format: { success: true, data: { messages: [...] } }
    } catch (error) {
        console.error(`Error fetching messages for chat ${chatId}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Deletes a specific chat session.
 * @param {string} chatId - The ID of the chat session to delete.
 * @returns {Promise<object>} - The backend response, e.g., { success: true, message: '...' }.
 */
export const deleteChat = async (chatId) => {
    if (!chatId) {
        throw new Error('Chat ID is required to delete chat.');
    }
    try {
        const response = await axios.delete(`${API_URL}/${chatId}`, getAuthHeaders());
        return response.data; // Expected format: { success: true, message: 'Chat deleted successfully.' }
    } catch (error) {
        console.error(`Error deleting chat ${chatId}:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetches the list of available AI models from the backend.
 * @returns {Promise<object>} - The backend response, e.g., { success: true, data: [{ id: string, name: string }, ...] }.
 */
export const getAvailableModels = async () => {
    try {
        // Assuming a new endpoint /api/models for fetching models
        const response = await axios.get(`${API_BASE_URL}/api/models`, getAuthHeaders());
        return response.data; // Expected format: { success: true, data: [{ id, name }, ...] }
    } catch (error) {
        console.error(`Error fetching available models:`, error.response?.data || error.message);
        throw error;
    }
};

/**
 * Updates the title of a chat session.
 * @param {string} chatId - The ID of the chat session to update.
 * @param {string} title - The new title for the chat.
 * @returns {Promise<object>} - The backend response.
 */
export const updateChatTitle = async (chatId, title) => {
  if (!chatId) {
    throw new Error('Chat ID is required to update title.');
  }
  try {
    const response = await axios.patch(`${API_URL}/${chatId}/title`, { title }, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error updating title for chat ${chatId}:`, error.response?.data || error.message);
    throw error;
  }
}; 