/**
 * Shared auth storage constants and cookie utilities
 * Centralizes auth storage key, version, and cookie management for consistency
 * across useAuthStore, API client, and middleware.
 */

import type { User } from '@/types/auth.types';

// ============================================================================
// Constants
// ============================================================================

/** localStorage key for Zustand persist (auth store) */
export const AUTH_STORAGE_KEY = 'aaraazi-auth-storage';

/** Version for auth storage state schema (bump when migrating persisted shape) */
export const AUTH_STORAGE_VERSION = 1;

/** Cookie name for edge-readable auth (middleware) */
export const COOKIE_NAME = 'aaraazi-auth';

/** Cookie max age in seconds (matches JWT access token TTL) */
export const COOKIE_MAX_AGE = 15 * 60; // 15 minutes

// ============================================================================
// Cookie Utilities
// ============================================================================

/**
 * Set auth cookie for middleware (edge-readable).
 * Uses Secure flag in production (HTTPS) to prevent transmission over HTTP.
 *
 * Note: Cookie stores user id, email, role, tenantId, agencyId for middleware
 * routing. Backend must validate all claims on every request; cookie is for
 * edge context only, not authorization.
 */
export function setAuthCookie(
  accessToken: string,
  user: User,
  tenantId: string | null,
  agencyId: string | null
): void {
  if (typeof document === 'undefined') return;

  const payload = JSON.stringify({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId,
      agencyId,
    },
  });

  const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const secureFlag = secure ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(payload)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict${secureFlag}`;
}

/**
 * Clear auth cookie.
 */
export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

/**
 * Clear all auth storage (localStorage + cookie).
 * Use when logging out or when refresh token fails.
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  clearAuthCookie();
}
