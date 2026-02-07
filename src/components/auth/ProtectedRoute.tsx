/**
 * Protected Route Component
 * Client-side route protection with loading states
 */

'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = '/auth/agency-code',
  loadingComponent,
}: ProtectedRouteProps) {
  const { isChecking, isAuthenticated } = useRequireAuth(redirectTo);

  if (isChecking) {
    return (
      loadingComponent || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect handled by useRequireAuth
  }

  return <>{children}</>;
}
