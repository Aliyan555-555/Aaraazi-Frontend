/**
 * Professional Auth Provider Component
 * Handles session initialization and validation
 */

'use client';

import { useEffect } from 'react';
import { useAuth, useSessionRefresh } from '@/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isInitialized, validateSession } = useAuth();

  // Auto-refresh session every 30 minutes
  useSessionRefresh(30);

  // Validate session on mount
  useEffect(() => {
    if (isInitialized) {
      validateSession().catch((error) => {
        console.error('Session validation failed:', error);
      });
    }
  }, [isInitialized, validateSession]);

  return <>{children}</>;
}
