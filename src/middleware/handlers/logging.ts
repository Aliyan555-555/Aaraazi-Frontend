/**
 * Logging Handler
 * Request logging for development and monitoring
 */

import type { MiddlewareContext } from '../types';

export function logRequest(ctx: MiddlewareContext, status: string): void {
  if (process.env.NODE_ENV !== 'development') return;

  const { request, auth, requestId } = ctx;
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.nextUrl.pathname;

  // eslint-disable-next-line no-console
  console.log(
    `[Middleware] ${timestamp} ${requestId} ${method} ${url} - ${status} ${auth.isAuthenticated ? `(user: ${auth.user?.id ?? 'bearer'})` : '(anon)'}`
  );
}
