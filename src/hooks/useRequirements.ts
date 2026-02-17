/**
 * Requirements hooks (for purchase cycle creation)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { listRequirements } from '@/lib/api/requirements';

export function useRequirements() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof listRequirements>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listRequirements();
      setItems(data);
      return data;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to load requirements';
      setError(msg);
      setItems([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { requirements: items, isLoading, error, refetch };
}
