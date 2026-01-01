/**
 * Auth Store
 * Session M1.2 - Zustand store for authentication state
 */

import { create } from 'zustand';
import { User, authService, LoginCredentials } from '../services/auth.service';
import { storageService } from '../services/storage.service';
import { apiService } from '../services/api.service';
import { pushService } from '../services/push.service';
import { clearSentryUser, setSentryUser } from '../config/sentry.config';

apiService.setLogoutCallback(() => {
  useAuthStore.getState().logout();
});

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isAuthBusy: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  isAuthBusy: false,
  error: null,

  login: async (credentials: LoginCredentials, rememberMe = true) => {
    set({ isAuthBusy: true, error: null });
    try {
      const response = await authService.login(credentials, rememberMe);
      if (response.token) {
        apiService.setToken(response.token);
      }

      setSentryUser(response.user.id, response.user.role);
      set({
        user: response.user,
        isAuthenticated: true,
        isAuthBusy: false,
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
        isAuthBusy: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isAuthBusy: true });
    try {
      // Unregister device for push notifications
      await pushService.unregisterDevice().catch((err) => {
        console.error('Failed to unregister device:', err);
      });
      
      await authService.logout();

      clearSentryUser();
      set({
        user: null,
        isAuthenticated: false,
        isAuthBusy: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout failed:', error);

      clearSentryUser();
      set({
        user: null,
        isAuthenticated: false,
        isAuthBusy: false,
        error: null,
      });
    }
  },

  bootstrap: async () => {
    set({ isBootstrapping: true, error: null });
    try {
      const token = await storageService.getToken();

      if (!token) {
        clearSentryUser();
        set({
          user: null,
          isAuthenticated: false,
          isBootstrapping: false,
        });
        return;
      }

      apiService.setToken(token);
      const user = await authService.getMe();

      setSentryUser(user.id, user.role);
      set({
        user,
        isAuthenticated: true,
        isBootstrapping: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Session bootstrap failed:', error);
      clearSentryUser();
      set({
        user: null,
        isAuthenticated: false,
        isBootstrapping: false,
        error: null,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
