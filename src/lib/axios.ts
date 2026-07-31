import axios from 'axios';

const api = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined' && response?.data?.gamification) {
      window.dispatchEvent(new CustomEvent('gamificationUpdated', { detail: response.data.gamification }));
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
