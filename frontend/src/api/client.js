// api/client.js — Axios client with shared in-flight refresh promise and 401 retry queue
import axios from 'axios';

let inMemoryToken = null;
let refreshPromise = null;

export const setMemoryToken = (token) => {
  inMemoryToken = token;
};

export const getMemoryToken = () => inMemoryToken;

export const clearMemoryToken = () => {
  inMemoryToken = null;
};

const apiBaseURL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach in-memory access token
api.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

/**
 * Shared in-flight refresh promise execution.
 * Ensures React 18 StrictMode double-mount or multiple concurrent 401s
 * execute exactly one POST /api/auth/refresh call.
 */
export const executeSilentRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshUrl = apiBaseURL ? `${apiBaseURL}/api/auth/refresh` : '/api/auth/refresh';
        const response = await axios.post(refreshUrl, {}, { withCredentials: true });
        const { accessToken, user } = response.data;
        setMemoryToken(accessToken);
        localStorage.setItem('logged_in', 'true');
        return { accessToken, user };
      } catch (err) {
        clearMemoryToken();
        localStorage.removeItem('logged_in');
        throw err;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

// Response Interceptor: 401 queue and retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const isAuthBypass =
      originalRequest.url?.includes('/api/auth/refresh') ||
      originalRequest.url?.includes('/api/auth/login') ||
      originalRequest.url?.includes('/api/auth/register') ||
      originalRequest.url?.includes('/api/auth/send-otp') ||
      originalRequest.url?.includes('/api/auth/verify-otp');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthBypass) {
      originalRequest._retry = true;
      try {
        const { accessToken } = await executeSilentRefresh();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
