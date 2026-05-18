import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  login: async (userData, token) => {
    try {
      await AsyncStorage.setItem('token', token);
      set({ user: userData, isAuthenticated: true });
    } catch (e) {
      console.error('Failed to save token', e);
    }
  },
  
  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      set({ user: null, isAuthenticated: false });
    } catch (e) {
      console.error('Failed to remove token', e);
    }
  },
}));

export default useAuthStore;
