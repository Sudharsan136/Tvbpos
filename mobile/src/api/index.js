import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// On web browser → localhost
// On Android emulator → 10.0.2.2
// On physical device → replace with your computer's local IP (e.g. 192.168.1.x)
export const API_URL = 'https://tvbpos.onrender.com';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token for native
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Failed to get token from storage', e);
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // We will use expo-router to redirect, but since we are outside a component, 
      // we might need to handle this differently. For now, we will just clear token.
      AsyncStorage.removeItem('token').catch(() => {});
    }
    return Promise.reject(err);
  }
);

export default api;
