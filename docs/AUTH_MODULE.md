# Professional Authentication Module Documentation

## Overview

This authentication module provides enterprise-grade security and user management for the Aaraazi platform. Built with modern best practices, it integrates seamlessly with the NestJS backend using session-based authentication.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router)
- **State Management**: Zustand with persistence
- **HTTP Client**: Axios with interceptors
- **Backend Integration**: NestJS REST API
- **Authentication**: Session-based with UUID tokens

### Key Components

```
src/
├── components/auth/
│   ├── AuthProvider.tsx          # Global auth context provider
│   └── ProtectedRoute.tsx        # Route protection component
├── hooks/
│   └── useAuth.ts                # Professional auth hooks
├── lib/api/
│   └── client.ts                 # Axios instance with interceptors
├── services/
│   └── auth.service.ts           # Auth API service layer
├── store/
│   └── useAuthStore.ts           # Zustand auth store
├── types/
│   └── auth.types.ts             # TypeScript definitions
└── middleware.ts                 # Next.js auth middleware
```

## Features

### ✅ Implemented

1. **Professional API Client**
   - Centralized axios instance
   - Request/response interceptors
   - Automatic token injection
   - Error handling and retry logic
   - Environment-based configuration

2. **Type-Safe Auth Store**
   - Zustand with TypeScript
   - Persistent localStorage
   - Computed properties
   - Optimized selectors

3. **Custom Auth Hooks**
   - `useAuth()` - Core auth operations
   - `useRequireAuth()` - Route protection
   - `useLogin()` - Login handling
   - `useLogout()` - Logout handling
   - `useTenantLookup()` - Tenant discovery
   - `useSessionRefresh()` - Auto session refresh
   - `usePermission()` - Permission checking
   - `useRole()` - Role-based access

4. **Route Protection**
   - Next.js middleware for server-side protection
   - Client-side ProtectedRoute component
   - Automatic redirects
   - Loading states

5. **Session Management**
   - Token validation
   - Auto-refresh (30-minute intervals)
   - Expiration handling
   - Activity tracking

6. **Error Handling**
   - Typed API errors
   - User-friendly messages
   - Automatic 401 logout
   - Network error recovery

7. **Multi-Tenant Support**
   - Tenant lookup by domain
   - Agency selection
   - White-label branding
   - Tenant isolation

## Usage Guide

### 1. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=30000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
SESSION_MAX_AGE=604800
SESSION_UPDATE_AGE=86400
```

### 2. Basic Authentication Flow

```typescript
// Agency Code Lookup
import { useTenantLookup } from '@/hooks/useAuth';

function AgencyCodePage() {
  const { lookupTenant, isLoading, error } = useTenantLookup();

  const handleSubmit = async (domain: string) => {
    await lookupTenant({ domain });
    // Automatically navigates to /auth/login on success
  };
}

// Login
import { useLogin } from '@/hooks/useAuth';

function LoginPage() {
  const { login, isLoading, error } = useLogin();

  const handleLogin = async (credentials) => {
    await login({
      tenantId: '...',
      agencyId: '...',
      email: 'user@example.com',
      password: 'password',
    });
    // Automatically navigates to /dashboard on success
  };
}

// Logout
import { useLogout } from '@/hooks/useAuth';

function LogoutButton() {
  const { logout, isLoading } = useLogout();

  return (
    <button onClick={logout} disabled={isLoading}>
      Logout
    </button>
  );
}
```

### 3. Protected Routes

#### Option A: Using useRequireAuth Hook

```typescript
'use client';

import { useRequireAuth } from '@/hooks/useAuth';

export default function ProtectedPage() {
  const { isChecking } = useRequireAuth();

  if (isChecking) {
    return <div>Loading...</div>;
  }

  return <div>Protected content</div>;
}
```

#### Option B: Using ProtectedRoute Component

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

### 4. Accessing Auth State

```typescript
import { useAuth, useCurrentUser, useBranding } from '@/hooks/useAuth';

function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const currentUser = useCurrentUser();
  const branding = useBranding();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      <p>Company: {branding?.companyName}</p>
    </div>
  );
}
```

### 5. Permission & Role Checks

```typescript
import { usePermission, useRole } from '@/hooks/useAuth';

function AdminPanel() {
  const canManageUsers = usePermission('manage_users');
  const isAdmin = useRole(['SAAS_ADMIN', 'AGENCY_OWNER']);

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      {canManageUsers && <UserManagement />}
    </div>
  );
}
```

### 6. Session Management

```typescript
import { useSessionRefresh, useSessionValidator } from '@/hooks/useAuth';

function App() {
  // Auto-refresh session every 30 minutes
  useSessionRefresh(30);

  // Manually validate session
  const { validate, isValidating } = useSessionValidator();

  const handleValidate = async () => {
    const isValid = await validate();
    console.log('Session valid:', isValid);
  };

  return <div>...</div>;
}
```

## API Reference

### Auth Service

```typescript
import { authService } from '@/services/auth.service';

// Lookup tenant
const tenant = await authService.lookupTenant({ domain: 'example.com' });

// Login
const response = await authService.login({
  tenantId: '...',
  email: 'user@example.com',
  password: 'password',
});

// Logout
await authService.logout();

// Get session
const session = await authService.getSession();

// Validate session
const isValid = await authService.validateSession(token);

// Refresh session
const refreshed = await authService.refreshSession();
```

### Auth Store Actions

```typescript
import { useAuthStore } from '@/store/useAuthStore';

const {
  // State
  user,
  accessToken,
  session,
  tenantId,
  agencyId,
  branding,
  isAuthenticated,
  isLoading,
  error,

  // Actions
  login,
  logout,
  refreshSession,
  validateSession,
  setTenant,
  setAgency,
  setError,
  clearError,
  reset,
} = useAuthStore();
```

## Security Best Practices

### ✅ Implemented

1. **Token Management**
   - Tokens stored in localStorage (with plans for httpOnly cookies)
   - Automatic token injection in requests
   - Token cleared on logout

2. **Error Handling**
   - Automatic logout on 401
   - User-friendly error messages
   - Network error recovery

3. **Route Protection**
   - Server-side middleware
   - Client-side guards
   - Redirect after login

4. **Session Security**
   - 7-day expiration
   - Activity tracking
   - Automatic refresh
   - Validation on mount

### 🔄 Recommended Enhancements

1. **Token Storage**
   - Move to httpOnly cookies for XSS protection
   - Implement refresh token rotation
   - Add token encryption

2. **CSRF Protection**
   - Implement CSRF tokens
   - Same-site cookie policy

3. **Rate Limiting**
   - Client-side request throttling
   - Retry with exponential backoff

4. **Monitoring**
   - Login attempt tracking
   - Session analytics
   - Error reporting

## API Integration

### Backend Endpoints

```typescript
// Tenant Lookup
GET /tenants/lookup?domain=example.com
Response: { id, name, domain, branding, agencies }

// Login
POST /auth/login
Body: { tenantId, agencyId?, email, password }
Response: { accessToken, expiresAt, user }

// Get Session
GET /auth/me
Headers: Authorization: Bearer <token>
Response: { session }

// Logout
POST /auth/logout
Headers: Authorization: Bearer <token>
Response: { message }
```

### Error Responses

```typescript
{
  message: string;
  statusCode: number;
  error?: string;
  timestamp?: string;
  path?: string;
}
```

## Testing

### Manual Testing Checklist

- [ ] Agency code lookup with valid domain
- [ ] Agency code lookup with invalid domain
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] Auto-select single agency
- [ ] Manual agency selection (multiple agencies)
- [ ] Protected route access (authenticated)
- [ ] Protected route redirect (unauthenticated)
- [ ] Session persistence across page reloads
- [ ] Session refresh after 30 minutes
- [ ] Logout functionality
- [ ] 401 automatic logout
- [ ] Network error handling
- [ ] Validation errors display

## Troubleshooting

### Common Issues

1. **"Network Error"**
   - Check backend is running on http://localhost:3000
   - Verify .env.local has correct API_URL
   - Check CORS settings on backend

2. **"Session not found"**
   - Clear localStorage: `localStorage.clear()`
   - Re-login to create new session
   - Check session hasn't expired (7 days)

3. **Infinite redirect loop**
   - Clear browser cache
   - Check middleware matcher patterns
   - Verify PUBLIC_ROUTES configuration

4. **Token not included in requests**
   - Check axios interceptor is configured
   - Verify token exists in localStorage
   - Check request headers in Network tab

## Migration Guide

### From Old Auth System

1. **Update imports:**
   ```typescript
   // Old
   import { useAuthStore } from '@/store/useAuthStore';
   const { setAuth, logout } = useAuthStore();

   // New
   import { useLogin, useLogout } from '@/hooks/useAuth';
   const { login } = useLogin();
   const { logout } = useLogout();
   ```

2. **Update API calls:**
   ```typescript
   // Old
   const res = await fetch('http://localhost:3000/auth/login', {...});

   // New
   import { authService } from '@/services/auth.service';
   const data = await authService.login(credentials);
   ```

3. **Update route protection:**
   ```typescript
   // Old
   useEffect(() => {
     if (!user) router.push('/auth/login');
   }, [user]);

   // New
   const { isChecking } = useRequireAuth();
   ```

## Performance Optimizations

1. **Zustand Selectors**
   - Use specific selectors to prevent unnecessary re-renders
   - Optimize with `selectUser`, `selectBranding`, etc.

2. **Lazy Loading**
   - Auth components are code-split
   - Dynamic imports for heavy components

3. **Request Caching**
   - Session data cached in store
   - Reduce redundant API calls

## Maintenance

### Adding New Features

1. **New Auth Endpoint**
   - Add method to `auth.service.ts`
   - Add types to `auth.types.ts`
   - Create custom hook in `useAuth.ts`

2. **New Permission Check**
   - Add to `User.permissions` type
   - Use `usePermission('permission_name')`

3. **New Role**
   - Add to `UserRole` enum
   - Update `useRole` checks

## Support

For issues or questions:
- Check troubleshooting section
- Review API documentation
- Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-08  
**Author**: Aaraazi Development Team
