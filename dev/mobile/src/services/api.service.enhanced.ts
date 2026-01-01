/**
 * API Service with Sentry Performance Monitoring
 * M6.2 - Enhanced with transaction tracking
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as Sentry from '@sentry/react-native';
import { storageService } from './storage.service';
import { errorService } from './error.service';
import { addBreadcrumb } from '../config/sentry.config';

const API_BASE_URL = 'https://erp.yellowpowerinternational.com/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: number;
  _retryDelay?: number;
  _sentryTransaction?: any;
}

class ApiServiceEnhanced {
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

  setLogoutCallback(callback: () => void) {
    this.logoutCallback = callback;
  }

  private setupInterceptors() {
    // Request interceptor with performance tracking
    this.client.interceptors.request.use(
      async (config) => {
        const token = this.inMemoryToken || (await storageService.getToken());
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Track API call with Sentry span
        const spanContext = {
          name: `${config.method?.toUpperCase()} ${config.url}`,
          op: 'http.client',
        };
        
        (config as RetryConfig)._sentryTransaction = spanContext;

        // Add breadcrumb for API request
        addBreadcrumb('http', `API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          method: config.method,
          url: config.url,
        });

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor with performance tracking
    this.client.interceptors.response.use(
      (response) => {
        // Add breadcrumb for successful response
        addBreadcrumb('http', `API Response: ${response.status}`, {
          status: response.status,
          url: response.config.url,
        });

        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as RetryConfig;
        const normalizedError = errorService.normalize(error);

        // Add breadcrumb for error
        addBreadcrumb('http', `API Error: ${normalizedError.statusCode}`, {
          status: normalizedError.statusCode,
          message: normalizedError.message,
          url: config?.url,
        });

        // Handle 401 - Session expired
        if (normalizedError.statusCode === 401) {
          const requestUrl = config?.url || '';
          const isLoginRequest = requestUrl.includes('/auth/login');
          const isLogoutRequest = requestUrl.includes('/auth/logout');
          const headersAny = config?.headers as any;
          const authHeader =
            (typeof headersAny?.get === 'function' ? headersAny.get('Authorization') : undefined) ||
            headersAny?.Authorization ||
            headersAny?.authorization;
          const hadAuthHeader = !!authHeader;
          const isSessionCheckRequest = requestUrl.includes('/auth/me');

          if (!isLoginRequest && hadAuthHeader && isSessionCheckRequest) {
            await storageService.clearAll();
            this.inMemoryToken = null;

            if (!isLogoutRequest && this.logoutCallback) {
              this.logoutCallback();
            }
          }

          return Promise.reject(error);
        }

        // Retry logic
        if (errorService.isRetryable(normalizedError) && config) {
          const retryCount = config._retry || 0;
          
          if (retryCount < MAX_RETRIES) {
            config._retry = retryCount + 1;
            const delay = (config._retryDelay || RETRY_DELAY) * Math.pow(2, retryCount);
            
            addBreadcrumb('http', `Retrying request (${retryCount + 1}/${MAX_RETRIES})`, {
              url: config.url,
              delay,
            });

            await new Promise(resolve => setTimeout(resolve, delay));
            return this.client.request(config);
          }
        }

        // Capture non-retryable errors in Sentry
        if (!errorService.isRetryable(normalizedError)) {
          Sentry.captureException(error, {
            tags: {
              api_endpoint: config?.url || 'unknown',
              http_status: normalizedError.statusCode?.toString() || 'unknown',
            },
          });
        }

        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.inMemoryToken = token;
  }

  clearToken() {
    this.inMemoryToken = null;
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiServiceEnhanced = new ApiServiceEnhanced();
export const apiClient = apiServiceEnhanced.getClient();
