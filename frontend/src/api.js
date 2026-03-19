// src/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Axios instance that automatically attaches the JWT token to every request.
// Import this instead of plain axios everywhere in your app:
//
//   import api from './api';
//   const res = await api.get('/api/materials/teacher/123');
//
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

// ── Request interceptor — attach token from localStorage ─────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — redirect to login if token expired ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and send to login
      localStorage.clear();
      window.location.href = '/admin-login';
    }
    return Promise.reject(error);
  }
);

export default api;