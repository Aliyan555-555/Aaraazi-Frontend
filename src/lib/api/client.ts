/**
 * Professional-grade API Client
 * Centralized axios instance with interceptors for authentication
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiError } from '@/types/auth.types';
import {
  AUTH_STORAGE_KEY,
  AUTH_STORAGE_VERSION,
  clearAuthStorage,
} from '@/lib/auth-storage';

import { logger } from "../logger";
// ============================================================================
// Configuration
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000;

// ============================================================================
// API Client Instance
// ============================================================================

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// ============================================================================
// Request Interceptor
// ============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // For FormData (e.g. file upload), let axios set Content-Type with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    // Get token from localStorage (Zustand persist storage)
    if (typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem(AUTH_STORAGE_KEY);
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          const token = state?.accessToken;
          
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        logger.error('Error reading auth token:', error);
      }
    }

    // Add request timestamp for debugging
    if (config.headers) {
      config.headers['X-Request-Time'] = new Date().toISOString();
    }

    return config;
  },
  (error) => {
    logger.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor
// ============================================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      logger.log(`✓ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 with silent refresh
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Prevent infinite retry loops for a single request
      if (originalRequest._retry) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      if (originalRequest.url?.includes('/auth/refresh-token')) {
        // Refresh failed - clear auth and redirect
        clearAuthStorage();
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/auth')) {
          window.location.href = '/auth/agency-code';
        }
        return Promise.reject(error);
      }

      // Don't try refresh for login/register - user has no token yet
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      try {
        const authStorage = localStorage.getItem(AUTH_STORAGE_KEY);
        const parsed = authStorage ? JSON.parse(authStorage) : null;
        const refreshToken = parsed?.state?.refreshToken;

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        if (isRefreshing) {
          // Queue this request and wait for refresh to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => apiClient(originalRequest));
        }

        isRefreshing = true;

        const response = await axios.post<{ accessToken: string; refreshToken?: string }>(
          `${API_URL}/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        const newState = { ...parsed?.state, accessToken, refreshToken: newRefreshToken ?? refreshToken };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ state: newState, version: AUTH_STORAGE_VERSION }));
        setAuthToken(accessToken);

        processQueue(null, accessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthStorage();
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/auth')) {
          window.location.href = '/auth/agency-code';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Enhanced error handling for other status codes
    if (error.response) {
      const { status, data } = error.response;

      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        logger.error(`✗ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status,
          error: data,
        });
      }

      switch (status) {
        case 401:
          if (typeof window !== 'undefined') {
            clearAuthStorage();
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith('/auth')) {
              window.location.href = '/auth/agency-code';
            }
          }
          break;

        case 403:
          // Forbidden - user doesn't have permission
          logger.error('Access forbidden:', data?.message);
          break;

        case 404:
          // Not found
          logger.error('Resource not found:', data?.message);
          break;

        case 422:
          // Validation error
          logger.error('Validation error:', data?.message);
          break;

        case 429:
          // Rate limit exceeded
          logger.error('Rate limit exceeded:', data?.message);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          logger.error('Server error:', data?.message);
          break;
      }

      // Return formatted error
      return Promise.reject({
        message: data?.message || 'An error occurred',
        statusCode: status,
        error: data?.error,
        timestamp: data?.timestamp,
        path: data?.path,
      } as ApiError);
    } else if (error.request) {
      // Network error - no response received
      logger.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        statusCode: 0,
        error: 'NETWORK_ERROR',
      } as ApiError);
    } else {
      // Request setup error
      logger.error('Request error:', error.message);
      return Promise.reject({
        message: error.message || 'Request failed',
        statusCode: 0,
        error: 'REQUEST_ERROR',
      } as ApiError);
    }
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Set authorization token for all subsequent requests
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Clear authorization token
 */
export const clearAuthToken = () => {
  delete apiClient.defaults.headers.common['Authorization'];
};

/**
 * Check if error is an API error
 */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'statusCode' in error
  );
};

/**
 * Get error message from unknown error
 */
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// ============================================================================
// Export
// ============================================================================

export default apiClient;
