/**
 * Professional Auth Provider Component
 * Handles session initialization and validation
 */

'use client';

import { useEffect } from 'react';
import { useAuth, useSessionRefresh } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isInitialized, validateSession } = useAuth();

  // Ensure auth store is marked initialized after persist rehydration (fixes stuck "Loading your workspace...")
  useEffect(() => {
    const persist = useAuthStore.persist;
    if (!persist) return;

    const markInitialized = () => {
      useAuthStore.setState({ isInitialized: true });
    };

    if (persist.hasHydrated?.()) {
      markInitialized();
      return;
    }

    const unsub = persist.onFinishHydration?.(markInitialized);
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

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
