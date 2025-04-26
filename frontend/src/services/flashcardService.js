import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/flashcards`;

const getAuthToken = () => localStorage.getItem('token');

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

/**
 * Generate flashcards for a notebook based on selected documents
 * @param {string} notebookId - Notebook ID
 * @param {Object} payload - Contains selectedDocumentIds and model
 * @returns {Promise} - API response
 */
const generateFlashcards = async (notebookId, payload) => {
  if (!notebookId) {
    throw new Error('Notebook ID is required to generate flashcards.');
  }
  try {
    const response = await axios.post(`${API_URL}/${notebookId}`, payload, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error generating flashcards for notebook ${notebookId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get all flashcards for a notebook
 * @param {string} notebookId - Notebook ID
 * @returns {Promise} - API response
 */
const getFlashcards = async (notebookId) => {
  if (!notebookId) {
    throw new Error('Notebook ID is required to get flashcards.');
  }
  try {
    const response = await axios.get(`${API_URL}/${notebookId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching flashcards for notebook ${notebookId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a flashcard
 * @param {string} flashcardId - Flashcard ID
 * @returns {Promise} - API response
 */
const deleteFlashcard = async (flashcardId) => {
  if (!flashcardId) {
    throw new Error('Flashcard ID is required to delete flashcard.');
  }
  try {
    const response = await axios.delete(`${API_URL}/${flashcardId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error deleting flashcard ${flashcardId}:`, error.response?.data || error.message);
    throw error;
  }
};


export { 
  generateFlashcards,
  getFlashcards,
  deleteFlashcard
};
