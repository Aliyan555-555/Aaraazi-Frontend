# Comprehensive Middleware Verification Guide

## Implementation Summary

The middleware in [`src/middleware.ts`](src/middleware.ts) has been upgraded with:

- **Route configuration**: `RouteConfig` with path, `allowedRoles`, `requireAuth`
- **RBAC**: Role checks for `/admin/*`, `/dashboard/settings`, `/dashboard/reports`, `/dashboard/financials`
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Request logging**: Development-only `[Middleware] timestamp method url - status`
- **Redirect handling**: `redirect` query param for post-login redirect, `error=insufficient_permissions` for denied access
- **Static file bypass**: Skips `_next/`, `/api/`, and common static extensions

## How to Test Route Types

### 1. Public routes (no auth required)

With no cookie and no `Authorization` header:

- `GET /auth/agency-code` → **200** (page loads)
- `GET /auth/login` → **200** (page loads)

Use browser incognito or clear cookies, then visit:

- http://localhost:3001/auth/agency-code  
- http://localhost:3001/auth/login  

Expected: Both pages load.

### 2. Authenticated redirect (auth-only routes)

When the app uses **localStorage only** (no `aaraazi-auth` cookie), the server does not see the user as logged in. So:

- Visiting `/auth/agency-code` or `/auth/login` in the same tab after logging in will **not** be redirected by middleware (no cookie).
- Client-side logic (e.g. `useEffect` on agency-code/login pages) may still redirect to dashboard.

To test **middleware** “already authenticated” redirect you would need to set an `aaraazi-auth` cookie on login (not implemented yet). With that cookie set, visiting `/auth/agency-code` or `/auth/login` should return **302** to `/dashboard`.

### 3. Protected routes (auth required)

With no auth (no cookie, no Bearer header):

- `GET /dashboard` → **302** to `/auth/agency-code?redirect=/dashboard`
- `GET /dashboard/settings` → **302** to `/auth/agency-code?redirect=/dashboard/settings`
- `GET /admin` → **302** to `/auth/agency-code?redirect=/admin`

Test: In incognito (or with cookies cleared), open:

- http://localhost:3001/dashboard  
- http://localhost:3001/admin  

Expected: Redirect to `/auth/agency-code` with `?redirect=...`.

### 4. Role-based access (admin / manager)

Middleware only has user role when auth is in a **cookie** with a `user` object. With cookie-based auth:

- User with role `AGENCY_AGENT` visiting `/admin` → **302** to `/dashboard?error=insufficient_permissions`
- User with role `SAAS_ADMIN` visiting `/admin` → **200**
- User with role `AGENCY_AGENT` visiting `/dashboard/settings` → **302** to `/dashboard?error=insufficient_permissions`
- User with role `AGENCY_MANAGER` visiting `/dashboard/settings` → **200**

Until the app sets `aaraazi-auth` cookie with `user.role`, middleware treats any Bearer/cookie auth as “authenticated” and does not apply role checks (no user object).

## How to Verify Security Headers

1. Start the app: `npm run dev`
2. Open DevTools → **Network**
3. Load any page (e.g. http://localhost:3001/auth/agency-code)
4. Select the **document** request (first request)
5. Open **Headers** → **Response Headers**

You should see:

- `content-security-policy`
- `x-frame-options: DENY`
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`
- `permissions-policy: camera=(), microphone=(), geolocation=()`
- No `x-powered-by` header

## How to Test Redirect Flows

### Unauthenticated → login

1. Ensure no auth (incognito or clear cookies/localStorage).
2. Visit http://localhost:3001/dashboard (or any protected path).
3. **Expected**: Redirect to `http://localhost:3001/auth/agency-code?redirect=/dashboard` (or the path you requested).

### Authenticated → away from auth pages

- Depends on cookie-based auth. With `aaraazi-auth` set, visiting `/auth/agency-code` or `/auth/login` should redirect to `/dashboard`.
- With localStorage-only auth, redirect is handled on the client (e.g. agency-code and login pages).

### Insufficient role → dashboard with error

- With cookie-based auth and `user.role` set (e.g. `AGENCY_AGENT`):
  1. Visit http://localhost:3001/admin
  2. **Expected**: Redirect to `http://localhost:3001/dashboard?error=insufficient_permissions`

## Development Logging

With `NODE_ENV=development`, middleware logs each request, for example:

```
[Middleware] 2026-02-08T12:34:56.789Z GET /dashboard - Authenticated
[Middleware] 2026-02-08T12:34:57.123Z GET /auth/agency-code - Redirect: Already authenticated
[Middleware] 2026-02-08T12:34:58.456Z GET /admin - Redirect: Insufficient permissions
```

Check the terminal where `npm run dev` is running.

## Cookie-Based Auth (Optional)

To have middleware see the user on full page loads/refreshes:

1. On login success, set a cookie (e.g. from an API route or client):

   - Name: `aaraazi-auth`
   - Value: JSON string of `{ user: { id, email, role, tenantId, agencyId }, accessToken }`
   - Options: `httpOnly: false` (if set from client), `sameSite: 'lax'`, `path: '/'`, `maxAge` as needed

2. On logout, clear the `aaraazi-auth` cookie.

3. Middleware will then:
   - Treat the user as authenticated when the cookie is present
   - Apply role-based rules using `user.role`
   - Redirect authenticated users away from `/auth/agency-code` and `/auth/login`

Until this is implemented, middleware still enforces:

- Public vs protected routes
- Redirect to `/auth/agency-code` when accessing protected routes without auth
- Security headers on all responses
- Request logging in development
