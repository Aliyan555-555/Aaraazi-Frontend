/**
 * useContactSearch - Debounced contact search for forms
 * No direct API calls in components - use this hook
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { contactsService } from '@/services/contacts.service';
import type { Contact } from '@/types/schema';

const DEBOUNCE_MS = 300;

export function useContactSearch(query: string, limit = 10) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setContacts([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await contactsService.findAll({
          search: query,
          limit,
        });
        setContacts(response.data || []);
      } catch (err) {
        console.error('Contact search failed:', err);
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, limit]);

  const clear = useCallback(() => setContacts([]), []);

  return { contacts, isLoading, clear };
}
