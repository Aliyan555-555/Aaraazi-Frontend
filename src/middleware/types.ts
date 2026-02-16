/**
 * Middleware types
 */

import type { NextRequest } from 'next/server';

export interface AuthData {
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

export interface MiddlewareContext {
  request: NextRequest;
  pathname: string;
  auth: AuthData;
  requestId: string;
}
