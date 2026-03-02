/**
 * useContacts hook tests
 * Mocks store; tests hook returns and refetch behaviour.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContacts, useContact, useCreateContact, useUpdateContact } from './useContacts';

const mockFetchContacts = vi.fn();
const mockFetchContact = vi.fn();

vi.mock('@/stores/contacts.store', () => ({
  useContactsStore: (selector: (s: unknown) => unknown) => {
    const state = {
      listCache: {},
      listLoading: {},
      listError: {},
      fetchContacts: mockFetchContacts,
      detailCache: {},
      detailLoading: {},
      detailError: {},
      fetchContact: mockFetchContact,
      createContact: vi.fn(),
      updateContact: vi.fn(),
    };
    return selector(state);
  },
}));

describe('useContacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchContacts.mockResolvedValue({
      data: [{ id: 'c-1', name: 'Test' }],
      total: 1,
      page: 1,
      limit: 10,
      pages: 1,
    });
  });

  it('returns data, isLoading, refetch from store', async () => {
    const { result } = renderHook(() => useContacts({ limit: 10 }));
    await waitFor(() => {
      expect(mockFetchContacts).toHaveBeenCalled();
    });
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('refetch');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('calls fetchContacts on mount', async () => {
    renderHook(() => useContacts({ limit: 5 }));
    await waitFor(() => {
      expect(mockFetchContacts).toHaveBeenCalledWith({ limit: 5 });
    });
  });
});

describe('useContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchContact.mockResolvedValue({ id: 'c-1', name: 'Single Contact' });
  });

  it('returns data, isLoading, refetch', async () => {
    const { result } = renderHook(() => useContact('c-1'));
    await waitFor(() => {
      expect(mockFetchContact).toHaveBeenCalledWith('c-1');
    });
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('refetch');
  });
});

describe('useCreateContact', () => {
  it('returns mutateAsync and isPending', () => {
    const { result } = renderHook(() => useCreateContact());
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isPending');
    expect(typeof result.current.mutateAsync).toBe('function');
  });
});

describe('useUpdateContact', () => {
  it('returns mutateAsync and isPending', () => {
    const { result } = renderHook(() => useUpdateContact());
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isPending');
  });
});
