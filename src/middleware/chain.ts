/**
 * Middleware chain: skip → auth → security headers
 * Single entry for all request handling
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthFromRequest, generateRequestId, shouldSkip } from './utils';
import { handleAuth, addSecurityHeaders, logRequest } from './handlers';
import type { MiddlewareContext } from './types';

export function runMiddleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  const auth = getAuthFromRequest(request);
  const ctx: MiddlewareContext = {
    request,
    pathname,
    auth,
    requestId: generateRequestId(),
  };

  const authResponse = handleAuth(ctx);
  if (authResponse) {
    logRequest(ctx, 'Redirect');
    return addSecurityHeaders(authResponse);
  }

  logRequest(ctx, 'Allow');
  return addSecurityHeaders(NextResponse.next());
}
