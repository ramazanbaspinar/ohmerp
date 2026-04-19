import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: 'https://localhost:7138/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        message.warning('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        message.error('Bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmamaktadır!');
      } else {
        const backendMessage =
          error.response.data?.message ||
          error.response.data?.detail ||
          error.response.data?.title;
        if (backendMessage) {
          message.error(backendMessage);
        }
      }
    } else {
      message.error('Sunucuya bağlanılamadı. Lütfen ağ bağlantınızı kontrol ediniz.');
    }
    return Promise.reject(error);
  }
);

export default api;