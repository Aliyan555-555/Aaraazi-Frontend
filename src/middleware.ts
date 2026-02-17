import type { NextRequest, NextResponse } from 'next/server';

// <<<<<<< HEAD
import { logger } from "./lib/logger";
// =======
// <<<<<<< Updated upstream
// >>>>>>> aaraazi/properties
// ============================================================================
// Types & Interfaces
// ============================================================================
// =======
// import { logger } from "./lib/logger";
import { runMiddleware } from './middleware/chain';
// >>>>>>> Stashed changes

interface AuthData {
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string | null;
    agencyId: string | null;
  } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

interface RouteConfig {
  path: string;
  allowedRoles?: string[];
  requireAuth: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/agency-code',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ONLY_ROUTES = [
  '/auth/agency-code',
  '/auth/login',
  '/auth/register',
];

// Role-based route configuration
const PROTECTED_ROUTES: RouteConfig[] = [
  // Admin routes - SAAS_ADMIN only
  {
    path: '/admin',
    allowedRoles: ['SAAS_ADMIN'],
    requireAuth: true,
  },
  {
    path: '/admin/users',
    allowedRoles: ['SAAS_ADMIN'],
    requireAuth: true,
  },
  {
    path: '/admin/tenants',
    allowedRoles: ['SAAS_ADMIN'],
    requireAuth: true,
  },
  {
    path: '/admin/settings',
    allowedRoles: ['SAAS_ADMIN'],
    requireAuth: true,
  },

  // Manager routes - AGENCY_OWNER and AGENCY_MANAGER
  {
    path: '/dashboard/settings',
    allowedRoles: ['SAAS_ADMIN', 'AGENCY_OWNER', 'AGENCY_MANAGER'],
    requireAuth: true,
  },
  {
    path: '/dashboard/reports',
    allowedRoles: ['SAAS_ADMIN', 'AGENCY_OWNER', 'AGENCY_MANAGER'],
    requireAuth: true,
  },
  {
    path: '/dashboard/financials',
    allowedRoles: ['SAAS_ADMIN', 'AGENCY_OWNER', 'AGENCY_MANAGER'],
    requireAuth: true,
  },

  // All authenticated users
  {
    path: '/dashboard',
    requireAuth: true,
  },
];

// Static file extensions to ignore
const STATIC_FILE_EXTENSIONS = [
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.css',
  '.js',
  '.json',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if path is a static file
 */
function isStaticFile(pathname: string): boolean {
  return STATIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route is auth-only (should redirect if authenticated)
 */
function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Get protected route configuration
 */
function getProtectedRoute(pathname: string): RouteConfig | null {
  // Sort by path length (longest first) to match most specific route
  const sorted = [...PROTECTED_ROUTES].sort(
    (a, b) => b.path.length - a.path.length
  );
  return sorted.find((route) => pathname.startsWith(route.path)) || null;
}

/**
 * Extract auth data from cookie or request
 * Note: In middleware we can't access localStorage; auth is read from cookie or header
 */
function getAuthFromRequest(request: NextRequest): AuthData {
  try {
    // Try to get auth from cookie (if we implement cookie-based auth)
    const authCookie = request.cookies.get('aaraazi-auth');
    if (authCookie?.value) {
      const authData = JSON.parse(authCookie.value);
      return {
        user: authData.user,
        accessToken: authData.accessToken,
        isAuthenticated: !!authData.accessToken,
      };
    }

    // Fallback: Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return {
        user: null,
        accessToken: token,
        isAuthenticated: true,
      };
    }

    return {
      user: null,
      accessToken: null,
      isAuthenticated: false,
    };
  } catch (error) {
    logger.error('Error parsing auth data:', error);
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false,
    };
  }
}

/**
 * Check if user has required role
 */
function hasRequiredRole(
  userRole: string | undefined,
  allowedRoles: string[] | undefined
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true; // No role restriction
  }
  if (!userRole) {
    return false;
  }
  return allowedRoles.includes(userRole);
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:3000;"
  );

  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Remove powered-by header for security
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * Log request for monitoring
 */
function logRequest(request: NextRequest, status: string): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const method = request.method;
    const url = request.url;
    logger.log(`[Middleware] ${timestamp} ${method} ${url} - ${status}`);
  }
}

/**
 * Create redirect URL with return path
 */
function createRedirectUrl(
  request: NextRequest,
  destination: string
): URL {
  const url = new URL(destination, request.url);

  // Store attempted URL for redirect after login
  if (
    destination.includes('/auth/') &&
    request.nextUrl.pathname !== '/'
  ) {
    url.searchParams.set('redirect', request.nextUrl.pathname);
  }

  return url;
}



export function middleware(request: NextRequest) {
  return runMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
