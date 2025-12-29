/**
 * Config Service
 * Session M1.4 - Mobile app configuration and feature flags
 */

import { apiClient } from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONFIG_CACHE_KEY = 'mobile_config_cache';
const CONFIG_CACHE_EXPIRY = 3600000; // 1 hour in milliseconds

export interface MobileConfig {
  minimumVersion: string;
  currentVersion: string;
  forceUpdate: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  featureFlags: {
    approvals: boolean;
    inventory: boolean;
    safety: boolean;
    tasks: boolean;
    reports: boolean;
    [key: string]: boolean;
  };
}

interface CachedConfig {
  config: MobileConfig;
  timestamp: number;
}

export const configService = {
  /**
   * Fetch mobile config from API
   */
  async fetchConfig(): Promise<MobileConfig> {
    try {
      const response = await apiClient.get<MobileConfig>('/mobile/config');
      
      await this.cacheConfig(response.data);
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch mobile config:', error);
      
      const cachedConfig = await this.getCachedConfig();
      if (cachedConfig) {
        return cachedConfig;
      }
      
      throw new Error('Unable to load app configuration');
    }
  },

  /**
   * Cache config to AsyncStorage
   */
  async cacheConfig(config: MobileConfig): Promise<void> {
    try {
      const cached: CachedConfig = {
        config,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error('Failed to cache config:', error);
    }
  },

  /**
   * Get cached config if not expired
   */
  async getCachedConfig(): Promise<MobileConfig | null> {
    try {
      const cachedStr = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
      if (!cachedStr) {
        return null;
      }

      const cached: CachedConfig = JSON.parse(cachedStr);
      const isExpired = Date.now() - cached.timestamp > CONFIG_CACHE_EXPIRY;

      if (isExpired) {
        await AsyncStorage.removeItem(CONFIG_CACHE_KEY);
        return null;
      }

      return cached.config;
    } catch (error) {
      console.error('Failed to get cached config:', error);
      return null;
    }
  },

  /**
   * Compare semantic versions
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  },

  /**
   * Check if app version meets minimum requirement
   */
  isVersionSupported(appVersion: string, minimumVersion: string): boolean {
    return this.compareVersions(appVersion, minimumVersion) >= 0;
  },

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(config: MobileConfig, featureName: string): boolean {
    return config.featureFlags[featureName] === true;
  },
};
