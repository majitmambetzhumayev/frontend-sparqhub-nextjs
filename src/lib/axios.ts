// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: { 'Content-Type': 'application/json' },
});

// Read csrftoken cookie & attach X-CSRFToken header on every write
api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();
  if (method && method !== 'get' && config.headers) {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='));
    if (match) {
      config.headers['X-CSRFToken'] = match.split('=')[1];
    }
  }
  return config;
});

export default api;
