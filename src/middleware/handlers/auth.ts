/**
 * Auth handler: public routes, protected routes, RBAC
 * Returns a NextResponse to redirect, or null to continue
 */

import { NextResponse } from 'next/server';
import type { MiddlewareContext } from '../types';
import {
  PUBLIC_ROUTES,
  AUTH_ONLY_ROUTES,
  PROTECTED_ROUTES,
} from '../config';

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
}

function isAuthOnly(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r));
}

function getProtectedRoute(pathname: string): (typeof PROTECTED_ROUTES)[number] | null {
  const sorted = [...PROTECTED_ROUTES].sort((a, b) => b.path.length - a.path.length);
  return sorted.find((r) => pathname.startsWith(r.path)) ?? null;
}

function hasRole(userRole: string | undefined, allowedRoles: string[] | undefined): boolean {
  if (!allowedRoles?.length) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function handleAuth(ctx: MiddlewareContext): NextResponse | null {
  const { pathname, auth } = ctx;

  // Public routes
  if (isPublic(pathname)) {
    if (auth.isAuthenticated && isAuthOnly(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', ctx.request.url));
    }
    return null; // allow
  }

  // Root
  if (pathname === '/') {
    const dest = auth.isAuthenticated ? '/dashboard' : '/auth/agency-code';
    return NextResponse.redirect(new URL(dest, ctx.request.url));
  }

  // Protected: require login
  const route = getProtectedRoute(pathname);
  if (!auth.isAuthenticated) {
    const url = new URL('/auth/agency-code', ctx.request.url);
    if (pathname !== '/') url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // RBAC
  if (route?.allowedRoles && !hasRole(auth.user?.role, route.allowedRoles)) {
    const url = new URL('/dashboard', ctx.request.url);
    url.searchParams.set('error', 'insufficient_permissions');
    return NextResponse.redirect(url);
  }

  return null; // allow
}
