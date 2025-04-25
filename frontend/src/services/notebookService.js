import axios from 'axios';

// Change API_URL to include the full base URL (assuming the server is running at port 5000)
const API_URL = 'http://localhost:5000/api/notebooks';

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

// Get all notebooks
export const getNotebooks = async () => {
  try {
    const response = await axiosInstance().get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    throw error;
  }
};

// Get a specific notebook
export const getNotebook = async (id) => {
  try {
    const response = await axiosInstance().get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching notebook ${id}:`, error);
    throw error;
  }
};

// Create a new notebook
export const createNotebook = async (notebookData) => {
  try {
    const response = await axiosInstance().post('/', notebookData);
    return response.data;
  } catch (error) {
    console.error('Error creating notebook:', error);
    throw error;
  }
};

// Update a notebook
export const updateNotebook = async (id, notebookData) => {
  try {
    const response = await axiosInstance().put(`/${id}`, notebookData);
    return response.data;
  } catch (error) {
    console.error(`Error updating notebook ${id}:`, error);
    throw error;
  }
};

// Delete a notebook
export const deleteNotebook = async (id) => {
  try {
    const response = await axiosInstance().delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting notebook ${id}:`, error);
    throw error;
  }
}; 