/**
 * Auth Cookie Sync API
 * Sets auth cookie after client-side login so middleware can read it
 */

import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_PATH } from '@/middleware/config';

interface SyncBody {
  accessToken: string;
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string | null;
    agencyId?: string | null;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncBody;
    const { accessToken, user } = body;

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      );
    }

    const cookieValue = JSON.stringify({
      accessToken,
      user: user ?? null,
    });

    const response = NextResponse.json({ ok: true });
    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set(AUTH_COOKIE_NAME, cookieValue, {
      path: AUTH_COOKIE_PATH,
      maxAge: AUTH_COOKIE_MAX_AGE,
      httpOnly: false, // Client may need to read for API calls; use true if token is only for middleware
      secure: isProd,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('[auth/sync] Error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
