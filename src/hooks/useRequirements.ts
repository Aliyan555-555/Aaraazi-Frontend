/**
 * Requirements Hooks - Zustand-based
 */

'use client';

import { useEffect } from 'react';
import { useRequirementsStore } from '@/store/useRequirementsStore';

export function useRequirements() {
  const items = useRequirementsStore((s) => s.items);
  const isLoading = useRequirementsStore((s) => s.isLoading);
  const error = useRequirementsStore((s) => s.error);

  useEffect(() => {
    useRequirementsStore.getState().fetch();
  }, []);

  return {
    requirements: items,
    isLoading,
    error,
    refetch: () => useRequirementsStore.getState().fetch(),
  };
}
