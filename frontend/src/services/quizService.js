import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/quizzes`;

const getAuthToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${getAuthToken()}` }
});

/**
 * Generate a new quiz for a notebook
 */
export const generateQuiz = async (notebookId, payload) => {
  if (!notebookId) throw new Error('Notebook ID is required');
  try {
    const response = await axios.post(`${API_URL}/${notebookId}`, payload, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error generating quiz:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get all quizzes (ongoing and completed) for a notebook
 */
export const getQuizzes = async (notebookId) => {
  if (!notebookId) throw new Error('Notebook ID is required');
  try {
    const response = await axios.get(`${API_URL}/${notebookId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get a specific quiz by ID
 */
export const getQuiz = async (quizId) => {
  if (!quizId) throw new Error('Quiz ID is required');
  try {
    const response = await axios.get(`${API_URL}/quiz/${quizId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching quiz ${quizId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Submit user answers to save progress
 */
export const submitQuizAttempt = async (quizId, answers) => {
  if (!quizId) throw new Error('Quiz ID is required');
  try {
    const response = await axios.put(`${API_URL}/quiz/${quizId}/attempt`, { answers }, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error submitting quiz attempt ${quizId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Submit quiz for grading
 */
export const gradeQuiz = async (quizId) => {
  if (!quizId) throw new Error('Quiz ID is required');
  try {
    const response = await axios.post(`${API_URL}/quiz/${quizId}/grade`, {}, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error grading quiz ${quizId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a quiz
 */
export const deleteQuiz = async (quizId) => {
  if (!quizId) throw new Error('Quiz ID is required');
  try {
    const response = await axios.delete(`${API_URL}/quiz/${quizId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error deleting quiz ${quizId}:`, error.response?.data || error.message);
    throw error;
  }
};
