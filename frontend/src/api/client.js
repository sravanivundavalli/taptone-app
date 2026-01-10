import axios from 'axios';

// In production (Docker), we proxy /api to the backend via Nginx
// In development, we use the VITE_API_URL or localhost:8000
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
