import axios from 'axios';

// In production, we prioritize VITE_API_URL if set (e.g., on Netlify)
// If not set, we fall back to '/api' for Docker reverse-proxy setups
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
