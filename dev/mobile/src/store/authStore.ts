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
import { capabilitiesService, UserCapabilities } from '../services/capabilities.service';

apiService.setLogoutCallback(() => {
  useAuthStore.getState().logout();
});

interface AuthState {
  user: User | null;
  capabilities: UserCapabilities | null;
  capabilitiesStatus: 'idle' | 'loading' | 'loaded' | 'error';
  capabilitiesError: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isAuthBusy: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  refreshCapabilities: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  capabilities: null,
  capabilitiesStatus: 'idle',
  capabilitiesError: null,
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
      
      // Fetch user capabilities
      let capabilities: UserCapabilities | null = null;
      let capabilitiesStatus: AuthState['capabilitiesStatus'] = 'loading';
      let capabilitiesError: string | null = null;
      try {
        capabilities = await capabilitiesService.getUserCapabilities();
        console.log('[AUTH] Capabilities fetched:', capabilities);
        capabilitiesStatus = 'loaded';
      } catch (err) {
        console.error('[AUTH] Failed to fetch capabilities:', err);
        capabilitiesStatus = 'error';
        capabilitiesError = err instanceof Error ? err.message : 'Failed to load permissions. Please try again.';
      }
      
      set({
        user,
        capabilities,
        capabilitiesStatus,
        capabilitiesError,
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
        capabilities: null,
        capabilitiesStatus: 'idle',
        capabilitiesError: null,
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
        capabilities: null,
        capabilitiesStatus: 'idle',
        capabilitiesError: null,
        isAuthenticated: false,
        isAuthBusy: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout failed:', error);

      clearSentryUser();
      set({
        user: null,
        capabilities: null,
        capabilitiesStatus: 'idle',
        capabilitiesError: null,
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
          capabilities: null,
          capabilitiesStatus: 'idle',
          capabilitiesError: null,
          isAuthenticated: false,
          isBootstrapping: false,
        });
        return;
      }

      apiService.setToken(token);
      const user = await authService.getMe();

      setSentryUser(user.id, user.role);
      
      // Fetch user capabilities
      let capabilities: UserCapabilities | null = null;
      let capabilitiesStatus: AuthState['capabilitiesStatus'] = 'loading';
      let capabilitiesError: string | null = null;
      try {
        capabilities = await capabilitiesService.getUserCapabilities();
        console.log('[AUTH] Capabilities fetched during bootstrap:', capabilities);
        capabilitiesStatus = 'loaded';
      } catch (err) {
        console.error('[AUTH] Failed to fetch capabilities during bootstrap:', err);
        capabilitiesStatus = 'error';
        capabilitiesError = err instanceof Error ? err.message : 'Failed to load permissions. Please try again.';
      }
      
      set({
        user,
        capabilities,
        capabilitiesStatus,
        capabilitiesError,
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
        capabilities: null,
        capabilitiesStatus: 'idle',
        capabilitiesError: null,
        isAuthenticated: false,
        isBootstrapping: false,
        error: null, // Don't show bootstrap errors on login screen
      });
    }
  },

  refreshCapabilities: async () => {
    set({ capabilitiesStatus: 'loading', capabilitiesError: null });
    try {
      const capabilities = await capabilitiesService.getUserCapabilities();
      set({ capabilities, capabilitiesStatus: 'loaded', capabilitiesError: null });
    } catch (err) {
      console.error('[AUTH] Failed to refresh capabilities:', err);
      set({
        capabilities: null,
        capabilitiesStatus: 'error',
        capabilitiesError: err instanceof Error ? err.message : 'Failed to load permissions. Please try again.',
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
