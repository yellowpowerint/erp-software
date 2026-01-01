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
      console.log('[AUTH] Starting login for:', credentials.email);
      const response = await authService.login(credentials, rememberMe);
      const token = response.access_token || response.token;
      console.log('[AUTH] Login response received:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        hasAccessToken: !!response.access_token,
        hasLegacyToken: !!response.token,
        userId: response.user?.id,
        rememberMe,
      });
      
      if (token) {
        apiService.setToken(token);
        console.log('[AUTH] Token set in apiService');
      }

      let user = response.user;
      console.log('[AUTH] Calling authService.getMe() to validate session...');
      try {
        user = await authService.getMe();
        console.log('[AUTH] Session validated successfully:', user.id);
      } catch (err) {
        console.error('[AUTH] Session validation failed:', err);
        await storageService.clearAll();
        apiService.setToken(null);
        throw err;
      }

      setSentryUser(user.id, user.role);
      set({
        user,
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
      // Clear any stale tokens
      await storageService.clearAll();
      apiService.setToken(null);
      clearSentryUser();
      set({
        user: null,
        isAuthenticated: false,
        isBootstrapping: false,
        error: null, // Don't show bootstrap errors on login screen
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
