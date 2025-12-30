/**
 * API Service
 * Session M1.3 - Enhanced API client with error handling and retry logic
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storageService } from './storage.service';
import { errorService } from './error.service';

const API_BASE_URL = 'http://216.158.230.187:3000/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: number;
  _retryDelay?: number;
}

class ApiService {
  private client: AxiosInstance;
  private inMemoryToken: string | null = null;
  private logoutCallback: (() => void) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Register callback to trigger logout on 401
   */
  setLogoutCallback(callback: () => void) {
    this.logoutCallback = callback;
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = this.inMemoryToken || (await storageService.getToken());
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as RetryConfig;
        const normalizedError = errorService.normalize(error);

        if (normalizedError.statusCode === 401) {
          await storageService.clearAll();
          this.inMemoryToken = null;
          
          if (this.logoutCallback) {
            this.logoutCallback();
          }
          
          return Promise.reject(error);
        }

        if (errorService.isRetryable(normalizedError) && config) {
          const retryCount = config._retry || 0;
          
          if (retryCount < MAX_RETRIES) {
            config._retry = retryCount + 1;
            const delay = (config._retryDelay || RETRY_DELAY) * Math.pow(2, retryCount);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.client(config);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.inMemoryToken = token;
  }

  getInMemoryToken(): string | null {
    return this.inMemoryToken;
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiServiceLegacy = new ApiService();
export const apiClientLegacy = apiServiceLegacy.getClient();

export { apiServiceEnhanced as apiService, apiClient } from './api.service.enhanced';
