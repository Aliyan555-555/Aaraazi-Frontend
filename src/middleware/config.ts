/**
 * Middleware configuration
 * Single source of truth for routes, auth cookie, and matcher
 */

export const AUTH_COOKIE_NAME = 'aaraazi-auth';
export const AUTH_COOKIE_PATH = '/';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Paths that do not require authentication */
export const PUBLIC_ROUTES = [
  '/auth/agency-code',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
] as const;

/** Auth pages: redirect to dashboard if already logged in */
export const AUTH_ONLY_ROUTES = [
  '/auth/agency-code',
  '/auth/login',
  '/auth/register',
] as const;

export interface RouteConfig {
  path: string;
  allowedRoles?: string[];
  requireAuth: boolean;
}

/** Protected routes with optional role restrictions */
export const PROTECTED_ROUTES: RouteConfig[] = [
  { path: '/admin', allowedRoles: ['SAAS_ADMIN'], requireAuth: true },
  { path: '/admin/users', allowedRoles: ['SAAS_ADMIN'], requireAuth: true },
  { path: '/admin/tenants', allowedRoles: ['SAAS_ADMIN'], requireAuth: true },
  { path: '/admin/settings', allowedRoles: ['SAAS_ADMIN'], requireAuth: true },
  { path: '/dashboard/settings', allowedRoles: ['SAAS_ADMIN', 'AGENCY_OWNER', 'AGENCY_MANAGER'], requireAuth: true },
  { path: '/dashboard/reports', allowedRoles: ['SAAS_ADMIN', 'AGENCY_OWNER', 'AGENCY_MANAGER'], requireAuth: true },
  { path: '/dashboard/financials', allowedRoles: ['SAAS_ADMIN', 'AGENCY_OWNER', 'AGENCY_MANAGER'], requireAuth: true },
  { path: '/dashboard', requireAuth: true },
];

/** Extensions that are never handled by middleware */
export const STATIC_EXTENSIONS = [
  '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.css', '.js', '.json', '.woff', '.woff2', '.ttf', '.eot',
];

/** Next.js middleware matcher */
export const MATCHER = [
  '/((?!_next/static|_next/image|favicon.ico).*)',
] as const;
