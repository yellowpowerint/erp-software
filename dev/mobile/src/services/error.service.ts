/**
 * Error Service
 * Session M1.3 - Global error normalization and handling
 */

import { AxiosError } from 'axios';

export interface NormalizedError {
  message: string;
  code?: string;
  statusCode?: number;
  isNetworkError: boolean;
  isServerError: boolean;
  isClientError: boolean;
  isAuthError: boolean;
}

export const errorService = {
  /**
   * Normalize any error into a consistent format
   */
  normalize(error: any): NormalizedError {
    if (error.isAxiosError || error.response) {
      return this.normalizeAxiosError(error as AxiosError);
    }

    if (error instanceof Error) {
      return {
        message: error.message || 'An unexpected error occurred',
        isNetworkError: false,
        isServerError: false,
        isClientError: false,
        isAuthError: false,
      };
    }

    return {
      message: 'An unexpected error occurred',
      isNetworkError: false,
      isServerError: false,
      isClientError: false,
      isAuthError: false,
    };
  },

  /**
   * Normalize Axios errors with specific handling for HTTP status codes
   */
  normalizeAxiosError(error: AxiosError): NormalizedError {
    const statusCode = error.response?.status;
    const serverMessage = (error.response?.data as any)?.message;

    if (!error.response) {
      return {
        message: error.message.includes('Network Error')
          ? 'No internet connection. Please check your network.'
          : 'Unable to connect to server. Please try again.',
        code: error.code,
        isNetworkError: true,
        isServerError: false,
        isClientError: false,
        isAuthError: false,
      };
    }

    switch (statusCode) {
      case 400:
        return {
          message: serverMessage || 'Invalid request. Please check your input.',
          statusCode,
          isNetworkError: false,
          isServerError: false,
          isClientError: true,
          isAuthError: false,
        };

      case 401:
        return {
          message: serverMessage || 'Your session has expired. Please login again.',
          statusCode,
          isNetworkError: false,
          isServerError: false,
          isClientError: true,
          isAuthError: true,
        };

      case 403:
        return {
          message: serverMessage || 'Access denied. You do not have permission to perform this action.',
          statusCode,
          isNetworkError: false,
          isServerError: false,
          isClientError: true,
          isAuthError: false,
        };

      case 404:
        return {
          message: serverMessage || 'The requested resource was not found.',
          statusCode,
          isNetworkError: false,
          isServerError: false,
          isClientError: true,
          isAuthError: false,
        };

      case 422:
        return {
          message: serverMessage || 'Validation failed. Please check your input.',
          statusCode,
          isNetworkError: false,
          isServerError: false,
          isClientError: true,
          isAuthError: false,
        };

      case 500:
        return {
          message: 'Server error. Please try again later.',
          statusCode,
          isNetworkError: false,
          isServerError: true,
          isClientError: false,
          isAuthError: false,
        };

      case 502:
      case 503:
      case 504:
        return {
          message: 'Service temporarily unavailable. Please try again later.',
          statusCode,
          isNetworkError: false,
          isServerError: true,
          isClientError: false,
          isAuthError: false,
        };

      default:
        return {
          message: serverMessage || 'An error occurred. Please try again.',
          statusCode,
          isNetworkError: false,
          isServerError: statusCode ? statusCode >= 500 : false,
          isClientError: statusCode ? statusCode >= 400 && statusCode < 500 : false,
          isAuthError: false,
        };
    }
  },

  /**
   * Check if error is retryable
   */
  isRetryable(error: NormalizedError): boolean {
    return error.isNetworkError || error.isServerError;
  },
};
