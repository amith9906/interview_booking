import axios from 'axios';
import { toastSuccess, toastError } from '../services/toastService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const message = response.data?.message || 'Request completed successfully';
      toastSuccess(message);
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
    toastError(message);
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
