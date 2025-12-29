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
  token: string;
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
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data.token) {
        // Always keep an in-memory copy for immediate requests
        apiService.setToken(response.data.token);

        if (rememberMe) {
          await storageService.saveToken(response.data.token);
        } else {
          // Ensure no persisted token when rememberMe is off
          await storageService.removeToken();
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
