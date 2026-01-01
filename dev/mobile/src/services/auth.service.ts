/**
 * Auth Service
 * Session M1.2 - Authentication API calls
 */

import { apiClient, apiService } from './api.service';
import { storageService } from './storage.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token?: string; // Deprecated, use access_token
  user: User;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  permissions?: string[];
}

export const authService = {
  /**
   * Login with email and password
   * @param rememberMe if false, keep token only in memory (clears on app restart)
   */
  async login(credentials: LoginCredentials, rememberMe = true): Promise<LoginResponse> {
    try {
      console.log('[AUTH_SERVICE] Calling /auth/login API...');
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      const token = response.data.access_token || response.data.token;
      console.log('[AUTH_SERVICE] Login API response received:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        hasAccessToken: !!response.data.access_token,
        hasLegacyToken: !!response.data.token,
      });
      
      if (token) {
        // Always keep an in-memory copy for immediate requests
        apiService.setToken(token);
        console.log('[AUTH_SERVICE] Token set in apiService (in-memory)');

        if (rememberMe) {
          await storageService.saveToken(token);
          console.log('[AUTH_SERVICE] Token saved to secure storage');
        } else {
          // Ensure no persisted token when rememberMe is off
          await storageService.removeToken();
          console.log('[AUTH_SERVICE] Token NOT saved (rememberMe=false)');
        }
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please try again.');
    }
  },

  /**
   * Get current user session
   */
  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await storageService.clearAll();
        throw new Error('Session expired');
      }
      throw new Error('Failed to fetch user session');
    }
  },

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await storageService.clearAll();
      apiService.setToken(null);
    }
  },

  /**
   * Check if user has valid token
   */
  async hasValidToken(): Promise<boolean> {
    const token = await storageService.getToken();
    return !!token;
  },
};
