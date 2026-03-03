/**
 * Security Headers Handler
 * Adds security headers to all responses.
 * connect-src includes API URL from NEXT_PUBLIC_API_URL for production.
 */

import { NextResponse } from 'next/server';

function getCsp(): string {
  const connectSources = ["'self'", 'http://localhost:*', 'https://localhost:*'];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const origin = new URL(apiUrl).origin;
      connectSources.push(origin);
    } catch {
      // ignore invalid URL
    }
  }

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSources.join(' ')}`,
    "frame-ancestors 'none'",
  ].join('; ');
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', getCsp());
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.delete('X-Powered-By');
  return response;
}
