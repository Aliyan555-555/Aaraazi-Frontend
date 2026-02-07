/**
 * Professional Auth Hooks
 * Convenient hooks for auth operations with proper error handling
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/auth.service';
import type { LoginDto, TenantLookupQuery, ApiError } from '@/types/auth.types';

// ============================================================================
// useAuth Hook
// ============================================================================

export function useAuth() {
  const {
    user,
    accessToken,
    session,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    logout,
    refreshSession,
    validateSession,
    clearError,
  } = useAuthStore();

  return {
    user,
    accessToken,
    session,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    logout,
    refreshSession,
    validateSession,
    clearError,
  };
}

// ============================================================================
// useRequireAuth Hook
// ============================================================================

export function useRequireAuth(redirectTo: string = '/auth/agency-code') {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated && !isLoading) {
      // Store attempted URL for redirect after login
      if (pathname && pathname !== redirectTo) {
        sessionStorage.setItem('redirectAfterLogin', pathname);
      }
      router.push(redirectTo);
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, isInitialized, isLoading, router, redirectTo, pathname]);

  return {
    isChecking: !isInitialized || isChecking,
    isAuthenticated,
  };
}

// ============================================================================
// useLogin Hook
// ============================================================================

export function useLogin() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleLogin = useCallback(
    async (credentials: LoginDto) => {
      try {
        setIsLoading(true);
        setError(null);

        await login(credentials);

        // Check for redirect URL
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');

        // Navigate to intended page or dashboard
        router.push(redirectUrl || '/dashboard');
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [login, router]
  );

  return {
    login: handleLogin,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// ============================================================================
// useLogout Hook
// ============================================================================

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      await logout();
      router.push('/auth/agency-code');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if API call fails
      router.push('/auth/agency-code');
    } finally {
      setIsLoading(false);
    }
  }, [logout, router]);

  return {
    logout: handleLogout,
    isLoading,
  };
}

// ============================================================================
// useTenantLookup Hook
// ============================================================================

export function useTenantLookup() {
  const { setTenant } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const lookupTenant = useCallback(
    async (query: TenantLookupQuery) => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await authService.lookupTenant(query);

        // Store tenant data in auth store
        setTenant(data.id, data.branding, data.agencies);

        // Navigate to login
        router.push('/auth/login');
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setTenant, router]
  );

  return {
    lookupTenant,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// ============================================================================
// useSessionRefresh Hook
// ============================================================================

export function useSessionRefresh(intervalMinutes: number = 30) {
  const { refreshSession, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Refresh session periodically
    const intervalMs = intervalMinutes * 60 * 1000;
    const interval = setInterval(async () => {
      try {
        await refreshSession();
      } catch (error) {
        console.error('Failed to refresh session:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshSession, intervalMinutes]);
}

// ============================================================================
// useSessionValidator Hook
// ============================================================================

export function useSessionValidator() {
  const { validateSession, isAuthenticated, logout } = useAuth();
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async () => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      setIsValidating(true);
      const isValid = await validateSession();

      if (!isValid) {
        await logout();
      }

      return isValid;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [isAuthenticated, validateSession, logout]);

  return {
    validate,
    isValidating,
  };
}

// ============================================================================
// useBranding Hook
// ============================================================================

export function useBranding() {
  const { branding } = useAuthStore();
  return branding;
}

// ============================================================================
// useCurrentUser Hook
// ============================================================================

export function useCurrentUser() {
  const { user } = useAuthStore();
  return user;
}

// ============================================================================
// usePermission Hook
// ============================================================================

export function usePermission(permission: string): boolean {
  const { user } = useAuthStore();

  if (!user) {
    return false;
  }

  // Check if user has the specific permission
  return user.permissions?.[permission] === true;
}

// ============================================================================
// useRole Hook
// ============================================================================

export function useRole(allowedRoles: string[]): boolean {
  const { user } = useAuthStore();

  if (!user) {
    return false;
  }

  return allowedRoles.includes(user.role);
}
