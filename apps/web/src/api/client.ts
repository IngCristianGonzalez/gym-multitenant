import axios from 'axios';
import { getCachedAuth, clearCachedAuth, setCachedAuth } from '../offline/db';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(async (config) => {
  const cached = await getCachedAuth();
  if (cached?.token) {
    config.headers.Authorization = `Bearer ${cached.token}`;
  } else {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (res.config.url?.includes('/auth/login') && res.data?.access_token) {
      const { access_token, user } = res.data;
      setCachedAuth(access_token, user).catch(() => {});
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return res;
  },
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      await clearCachedAuth().catch(() => {});
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;
