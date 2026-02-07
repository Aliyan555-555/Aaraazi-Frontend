/**
 * Authentication Service Layer
 * Professional-grade auth service with error handling and validation
 */

import { apiClient } from '@/lib/api/client';
import type {
  LoginDto,
  LoginResponse,
  TenantLookupQuery,
  TenantLookupResponse,
  SessionResponse,
  User,
} from '@/types/auth.types';

// ============================================================================
// Auth Service Class
// ============================================================================

class AuthService {
  /**
   * Lookup tenant by domain or agency code
   */
  async lookupTenant(query: TenantLookupQuery): Promise<TenantLookupResponse> {
    try {
      const response = await apiClient.get<TenantLookupResponse>('/tenants/lookup', {
        params: { domain: query.domain },
      });
      return response.data;
    } catch (error) {
      console.error('Tenant lookup failed:', error);
      throw error;
    }
  }

  /**
   * Login user with credentials
   */
  async login(credentials: LoginDto): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
      // Don't throw - we want to clear local state even if API fails
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<SessionResponse> {
    try {
      const response = await apiClient.get<SessionResponse>('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get session failed:', error);
      throw error;
    }
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh session (update last activity)
   */
  async refreshSession(): Promise<SessionResponse> {
    try {
      const response = await apiClient.get<SessionResponse>('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Refresh session failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const authService = new AuthService();
export default authService;
