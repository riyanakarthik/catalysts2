import axios from 'axios';
import { getStoredToken } from './auth';

const envBaseUrl = import.meta.env.VITE_API_URL?.trim();

const api = axios.create({
  baseURL: envBaseUrl || 'http://localhost:5001/api',
  timeout: 10000
});

// Role-aware auth interceptor - uses the token for whichever role is currently active
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// LOGIN
export const loginUser = async (phone, password) => {
  const res = await api.post('/users/login', { phone, password });
  return res.data;
};

// REGISTER
export const registerUser = async (data) => {
  const res = await api.post('/users/register', data);
  return res.data;
};