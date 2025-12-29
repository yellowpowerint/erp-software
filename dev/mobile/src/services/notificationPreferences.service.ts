/**
 * Notification Preferences Service
 * Session M2.4 - Manage notification preferences (channels and categories)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api.service';

export interface NotificationPreferences {
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: {
    approvals: boolean;
    tasks: boolean;
    inventory: boolean;
    safety: boolean;
    hr: boolean;
    system: boolean;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  channels: {
    email: true,
    push: true,
    sms: false,
  },
  categories: {
    approvals: true,
    tasks: true,
    inventory: true,
    safety: true,
    hr: true,
    system: true,
  },
};

const STORAGE_KEY = 'notification_preferences';

export const notificationPreferencesService = {
  /**
   * Get notification preferences from backend
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.get<NotificationPreferences>('/settings/notifications/preferences');
      // Cache locally for offline access
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(response.data)).catch((error) => {
        console.error('Failed to cache notification preferences:', error);
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      // Fallback to cached preferences
      const cached = await this.getCachedPreferences();
      return cached || DEFAULT_PREFERENCES;
    }
  },

  /**
   * Update notification preferences on backend
   */
  async updatePreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.put<NotificationPreferences>(
        '/settings/notifications/preferences',
        preferences
      );
      // Update local cache
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  },

  /**
   * Get cached preferences from local storage
   */
  async getCachedPreferences(): Promise<NotificationPreferences | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Failed to get cached preferences:', error);
      return null;
    }
  },

  /**
   * Clear cached preferences
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear preferences cache:', error);
    }
  },
};