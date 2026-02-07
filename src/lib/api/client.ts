/**
 * Professional-grade API Client
 * Centralized axios instance with interceptors for authentication
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiError } from '@/types/auth.types';

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
    // Get token from localStorage (Zustand persist storage)
    if (typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('aaraazi-auth-storage');
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          const token = state?.accessToken;
          
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error('Error reading auth token:', error);
      }
    }

    // Add request timestamp for debugging
    if (config.headers) {
      config.headers['X-Request-Time'] = new Date().toISOString();
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor
// ============================================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✓ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Enhanced error handling
    if (error.response) {
      const { status, data } = error.response;

      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`✗ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status,
          error: data,
        });
      }

      // Handle specific status codes
      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          if (typeof window !== 'undefined') {
            // Clear auth storage
            localStorage.removeItem('aaraazi-auth-storage');
            
            // Only redirect if not already on auth pages
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith('/auth')) {
              window.location.href = '/auth/agency-code';
            }
          }
          break;

        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden:', data?.message);
          break;

        case 404:
          // Not found
          console.error('Resource not found:', data?.message);
          break;

        case 422:
          // Validation error
          console.error('Validation error:', data?.message);
          break;

        case 429:
          // Rate limit exceeded
          console.error('Rate limit exceeded:', data?.message);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          console.error('Server error:', data?.message);
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
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        statusCode: 0,
        error: 'NETWORK_ERROR',
      } as ApiError);
    } else {
      // Request setup error
      console.error('Request error:', error.message);
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
