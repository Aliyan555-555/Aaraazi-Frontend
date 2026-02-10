/**
 * Professional React Query Hooks for Contacts
 * Provides optimized data fetching, caching, and mutations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '@/services/contacts.service';
import type {
  CreateContactDto,
  UpdateContactDto,
  QueryContactsDto,
} from '@/services/contacts.service';
import { toast } from 'sonner';

// ============================================================================
// Query Keys
// ============================================================================

export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (filters: QueryContactsDto) =>
    [...contactsKeys.lists(), filters] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
  statistics: () => [...contactsKeys.all, 'statistics'] as const,
};

// ============================================================================
// Fetch Hooks
// ============================================================================

/**
 * Fetch all contacts with pagination and filters
 */
export function useContacts(query: QueryContactsDto = {}) {
  return useQuery({
    queryKey: contactsKeys.list(query),
    queryFn: () => contactsService.findAll(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single contact by ID
 */
export function useContact(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: contactsKeys.detail(id),
    queryFn: () => contactsService.findOne(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch contact statistics
 */
export function useContactStatistics() {
  return useQuery({
    queryKey: contactsKeys.statistics(),
    queryFn: () => contactsService.getStatistics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactDto) => contactsService.create(data),
    onSuccess: (newContact) => {
      // Invalidate all contact lists to refetch
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.statistics() });

      // Optimistically add to cache
      queryClient.setQueryData(
        contactsKeys.detail(newContact.id),
        newContact,
      );

      toast.success('Contact created successfully');
    },
    onError: (error) => {
      console.error('Failed to create contact:', error);
      toast.error('Failed to create contact');
    },
  });
}

/**
 * Update an existing contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateContactDto;
    }) => contactsService.update(id, data),
    onSuccess: (updatedContact, variables) => {
      // Update detail cache
      queryClient.setQueryData(
        contactsKeys.detail(variables.id),
        updatedContact,
      );

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.statistics() });

      toast.success('Contact updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update contact:', error);
      toast.error('Failed to update contact');
    },
  });
}

/**
 * Delete a contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsService.remove(id),
    onSuccess: (_, deletedId) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: contactsKeys.detail(deletedId) });

      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.statistics() });

      toast.success('Contact deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete contact:', error);
      toast.error('Failed to delete contact');
    },
  });
}

/**
 * Bulk update contacts
 */
export function useBulkUpdateContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ids,
      updates,
    }: {
      ids: string[];
      updates: UpdateContactDto;
    }) => contactsService.bulkUpdate(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      toast.success('Contacts updated successfully');
    },
    onError: (error) => {
      console.error('Failed to bulk update contacts:', error);
      toast.error('Failed to update contacts');
    },
  });
}

/**
 * Bulk delete contacts
 */
export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => contactsService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      toast.success('Contacts deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to bulk delete contacts:', error);
      toast.error('Failed to delete contacts');
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch contact details
 */
export function usePrefetchContact() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: contactsKeys.detail(id),
      queryFn: () => contactsService.findOne(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Invalidate all contact queries
 */
export function useInvalidateContacts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: contactsKeys.all });
  };
}
