/**
 * Auth Store
 * Session M1.2 - Zustand store for authentication state
 */

import { create } from 'zustand';
import { User, authService, LoginCredentials } from '../services/auth.service';
import { storageService } from '../services/storage.service';
import { apiService } from '../services/api.service';
import { pushService } from '../services/push.service';

apiService.setLogoutCallback(() => {
  useAuthStore.getState().logout();
});

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (credentials: LoginCredentials, rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials, rememberMe);
      if (response.token) {
        apiService.setToken(response.token);
      }
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      // Register device for push notifications
      pushService.registerDevice().catch((err) => {
        console.error('Failed to register device for push notifications:', err);
      });
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // Unregister device for push notifications
      await pushService.unregisterDevice().catch((err) => {
        console.error('Failed to unregister device:', err);
      });
      
      await authService.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout failed:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  bootstrap: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await storageService.getToken();

      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      apiService.setToken(token);
      const user = await authService.getMe();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Session bootstrap failed:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
