/**
 * Middleware utilities
 */

import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, STATIC_EXTENSIONS } from './config';
import type { AuthData } from './types';

export function shouldSkip(pathname: string): boolean {
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/')) {
    return true;
  }
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

export function getAuthFromRequest(request: NextRequest): AuthData {
  try {
    const cookie = request.cookies.get(AUTH_COOKIE_NAME);
    if (cookie?.value) {
      const data = JSON.parse(cookie.value) as { accessToken?: string; user?: AuthData['user'] };
      return {
        user: data.user ?? null,
        accessToken: data.accessToken ?? null,
        isAuthenticated: !!data.accessToken,
      };
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return {
        user: null,
        accessToken: authHeader.slice(7),
        isAuthenticated: true,
      };
    }
  } catch {
    // ignore parse errors
  }
  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
  };
}

export function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
