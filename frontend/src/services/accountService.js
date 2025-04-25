import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/account`;

const getAuthToken = () => localStorage.getItem('token');

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const updatePassword = async (passwordData) => {
  try {
    const response = await axios.put(`${API_URL}/password`, passwordData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error updating password:', error.response?.data || error.message);
    throw error;
  }
};

export const updateGeminiKey = async (keyData) => {
  try {
    const response = await axios.put(`${API_URL}/gemini-key`, keyData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error updating Gemini key:', error.response?.data || error.message);
    throw error;
  }
};

export const getAccountStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/status`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching account status:', error.response?.data || error.message);
    throw error;
  }
};