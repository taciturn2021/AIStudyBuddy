import axios from 'axios';

const API_URL = 'http://localhost:5000/api/notebooks';

const axiosInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  });
};

export const getNotebooks = async () => {
  try {
    const response = await axiosInstance().get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    throw error;
  }
};

export const getNotebook = async (id) => {
  try {
    const response = await axiosInstance().get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching notebook ${id}:`, error);
    throw error;
  }
};

export const createNotebook = async (notebookData) => {
  try {
    const response = await axiosInstance().post('/', notebookData);
    return response.data;
  } catch (error) {
    console.error('Error creating notebook:', error);
    throw error;
  }
};

export const updateNotebook = async (id, notebookData) => {
  try {
    const response = await axiosInstance().put(`/${id}`, notebookData);
    return response.data;
  } catch (error) {
    console.error(`Error updating notebook ${id}:`, error);
    throw error;
  }
};

export const deleteNotebook = async (id) => {
  try {
    const response = await axiosInstance().delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting notebook ${id}:`, error);
    throw error;
  }
};