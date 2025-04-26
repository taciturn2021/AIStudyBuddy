import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/chat`; 


const getAuthToken = () => localStorage.getItem('token');


const getAuthHeaders = () => ({
  headers: {
    // Include Bearer token for backward compatibility
    Authorization: `Bearer ${getAuthToken()}`,
  },
  // This ensures cookies are sent with requests
  withCredentials: true,
});


export const sendChatMessage = async (notebookId, payload) => {
  if (!notebookId) {
    throw new Error('Notebook ID is required to send chat message.');
  }
  try {
    
    const response = await axios.post(`${API_URL}/${notebookId}`, payload, getAuthHeaders());
    
    return response.data;
  } catch (error) {
    console.error(`Error sending chat message for notebook ${notebookId}:`, error.response?.data || error.message);
    throw error;
  }
};


export const getChats = async (notebookId) => {
    if (!notebookId) {
        throw new Error('Notebook ID is required to get chats.');
    }
    try {
        const response = await axios.get(`${API_URL}/${notebookId}`, getAuthHeaders());
        return response.data; 
    } catch (error) {
        console.error(`Error fetching chats for notebook ${notebookId}:`, error.response?.data || error.message);
        throw error;
    }
};

export const getChatMessages = async (chatId) => {
    if (!chatId) {
        throw new Error('Chat ID is required to get messages.');
    }
    try {
        
        const response = await axios.get(`${API_URL}/${chatId}/messages`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error(`Error fetching messages for chat ${chatId}:`, error.response?.data || error.message);
        throw error;
    }
};

export const deleteChat = async (chatId) => {
    if (!chatId) {
        throw new Error('Chat ID is required to delete chat.');
    }
    try {
        const response = await axios.delete(`${API_URL}/${chatId}`, getAuthHeaders());
        return response.data; 
    } catch (error) {
        console.error(`Error deleting chat ${chatId}:`, error.response?.data || error.message);
        throw error;
    }
};


export const getAvailableModels = async () => {
    try {
        
        const response = await axios.get(`${API_BASE_URL}/api/models`, getAuthHeaders());
        return response.data; 
    } catch (error) {
        console.error(`Error fetching available models:`, error.response?.data || error.message);
        throw error;
    }
};


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