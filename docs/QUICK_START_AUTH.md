# 🚀 Auth Module Quick Start

## Installation Complete ✅

Professional-grade authentication is now installed and configured.

## Quick Test (3 Steps)

### 1. Start Backend
```bash
cd ../Aaraazi-Backend
npm run start:dev
# Should be running on http://localhost:3000
```

### 2. Start Frontend
```bash
cd aaraazi-frontend
npm run dev
# Opens on http://localhost:3001
```

### 3. Test Auth Flow
1. Visit http://localhost:3001
2. Navigate to `/auth/agency-code`
3. Enter a test domain (e.g., `test-agency.com`)
4. Login with credentials
5. Should redirect to dashboard

## What's New

### 🎯 For Developers

**Use these hooks instead of direct API calls:**

```typescript
import { useAuth, useLogin, useLogout, useTenantLookup } from '@/hooks/useAuth';

function MyComponent() {
  // Get current auth state
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Login
  const { login } = useLogin();
  await login({ tenantId, email, password });
  
  // Logout
  const { logout } = useLogout();
  await logout();
  
  // Lookup tenant
  const { lookupTenant } = useTenantLookup();
  await lookupTenant({ domain: 'example.com' });
}
```

**Protect routes:**

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PrivatePage() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
}
```

### 🔐 For Security

- ✅ Tokens auto-injected in requests
- ✅ Automatic logout on 401
- ✅ Session validation
- ✅ Route protection
- ✅ Error handling

### 📝 For Reference

- **Full Docs**: `AUTH_MODULE.md`
- **Summary**: `AUTH_IMPLEMENTATION_SUMMARY.md`
- **Types**: `src/types/auth.types.ts`
- **Hooks**: `src/hooks/useAuth.ts`

## Configuration

Edit `.env.local` if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## Common Operations

### Check if user is logged in
```typescript
const { isAuthenticated } = useAuth();
```

### Get current user
```typescript
const { user } = useAuth();
console.log(user?.name, user?.email, user?.role);
```

### Require authentication
```typescript
const { isChecking } = useRequireAuth();
// Auto-redirects to login if not authenticated
```

### Check permissions
```typescript
const canManageUsers = usePermission('manage_users');
const isAdmin = useRole(['SAAS_ADMIN', 'AGENCY_OWNER']);
```

## Troubleshooting

**"Network Error"**
→ Check backend is running on port 3000

**"Not authenticated"**
→ Clear localStorage and re-login

**Infinite redirects**
→ Check middleware.ts patterns

## Need Help?

1. Check `AUTH_MODULE.md` for detailed documentation
2. Review example implementations in `app/auth/`
3. Check types in `src/types/auth.types.ts`

## Status

✅ **All core features implemented**
✅ **Type-safe throughout**
✅ **Error handling in place**
✅ **Ready for production testing**

---

**Next Steps**: Test the auth flow and customize as needed!
