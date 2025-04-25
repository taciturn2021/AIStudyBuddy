import axios from 'axios';

// API URL for documents
const API_URL = 'http://localhost:5000/api/documents';

// Create axios instance with auth header
const axiosInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  });
};

// Get all documents in a notebook
export const getDocuments = async (notebookId) => {
  try {
    const response = await axiosInstance().get(`/${notebookId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching documents for notebook ${notebookId}:`, error);
    throw error;
  }
};

// Get a specific document
export const getDocument = async (notebookId, documentId) => {
  try {
    const response = await axiosInstance().get(`/${notebookId}/${documentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching document ${documentId}:`, error);
    throw error;
  }
};

// Upload a document to a notebook
export const uploadDocument = async (notebookId, file) => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('document', file);

    // Custom axios instance for multipart form data
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/${notebookId}`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : ''
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error uploading document to notebook ${notebookId}:`, error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (notebookId, documentId) => {
  try {
    const response = await axiosInstance().delete(`/${notebookId}/${documentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting document ${documentId}:`, error);
    throw error;
  }
}; 