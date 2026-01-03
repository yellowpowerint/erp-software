import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: string;
  expiresAt?: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  forceRefresh?: boolean;
}

const CACHE_PREFIX = '@cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const cacheService = {
  /**
   * Generate cache key from endpoint and params
   */
  generateKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${CACHE_PREFIX}${endpoint}${paramString}`;
  },

  /**
   * Check if cached data is still valid
   */
  isValid(entry: CacheEntry): boolean {
    if (!entry.expiresAt) return true;
    return new Date(entry.expiresAt) > new Date();
  },

  /**
   * Get cached data
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T | null> {
    try {
      const key = this.generateKey(endpoint, params);
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return null;

      const entry: CacheEntry<T> = JSON.parse(data);
      
      if (!this.isValid(entry)) {
        await this.remove(endpoint, params);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('[CACHE] Failed to get cached data:', error);
      return null;
    }
  },

  /**
   * Set cached data
   */
  async set<T>(
    endpoint: string,
    data: T,
    params?: Record<string, any>,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const key = this.generateKey(endpoint, params);
      const ttl = options?.ttl ?? DEFAULT_TTL;
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: new Date().toISOString(),
        expiresAt: ttl > 0 ? new Date(Date.now() + ttl).toISOString() : undefined,
      };

      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('[CACHE] Failed to set cached data:', error);
    }
  },

  /**
   * Remove cached data
   */
  async remove(endpoint: string, params?: Record<string, any>): Promise<void> {
    try {
      const key = this.generateKey(endpoint, params);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[CACHE] Failed to remove cached data:', error);
    }
  },

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('[CACHE] Failed to clear all cache:', error);
    }
  },

  /**
   * Clear cache entries matching a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(key => 
        key.startsWith(CACHE_PREFIX) && key.includes(pattern)
      );
      await AsyncStorage.multiRemove(matchingKeys);
    } catch (error) {
      console.error('[CACHE] Failed to clear cache pattern:', error);
    }
  },

  /**
   * Get cache metadata (timestamp, expiry)
   */
  async getMetadata(endpoint: string, params?: Record<string, any>): Promise<{
    timestamp: string;
    expiresAt?: string;
    isValid: boolean;
  } | null> {
    try {
      const key = this.generateKey(endpoint, params);
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return null;

      const entry: CacheEntry = JSON.parse(data);
      
      return {
        timestamp: entry.timestamp,
        expiresAt: entry.expiresAt,
        isValid: this.isValid(entry),
      };
    } catch (error) {
      console.error('[CACHE] Failed to get cache metadata:', error);
      return null;
    }
  },

  /**
   * Fetch with cache (show cached then sync pattern)
   */
  async fetchWithCache<T>(
    endpoint: string,
    fetcher: () => Promise<T>,
    params?: Record<string, any>,
    options?: CacheOptions
  ): Promise<{ data: T; fromCache: boolean }> {
    const forceRefresh = options?.forceRefresh ?? false;

    // Try to get cached data first
    if (!forceRefresh) {
      const cached = await this.get<T>(endpoint, params);
      if (cached !== null) {
        // Return cached data immediately, then refresh in background
        fetcher()
          .then(freshData => this.set(endpoint, freshData, params, options))
          .catch(err => console.error('[CACHE] Background refresh failed:', err));
        
        return { data: cached, fromCache: true };
      }
    }

    // No cache or force refresh - fetch fresh data
    const freshData = await fetcher();
    await this.set(endpoint, freshData, params, options);
    return { data: freshData, fromCache: false };
  },
};
