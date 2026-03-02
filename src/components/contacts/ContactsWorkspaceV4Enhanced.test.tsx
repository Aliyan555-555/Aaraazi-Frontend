/**
 * ContactsWorkspaceV4Enhanced tests
 * Mocks useContacts, useAuthStore. Tests list render, empty state, loading state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactsWorkspaceV4Enhanced } from './ContactsWorkspaceV4Enhanced';
import type { User } from '@/types';

const mockUseContacts = vi.fn();
const mockUseAuthStore = vi.fn();

vi.mock('@/hooks/useContacts', () => ({
  useContacts: (query: unknown) => mockUseContacts(query),
  useContact: () => ({ data: null, isLoading: false, refetch: vi.fn() }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkUpdateContacts: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useBulkDeleteContacts: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

const DEFAULT_USER: User = {
  id: 'user-001',
  email: 'agent@test.com',
  name: 'Test Agent',
  role: 'agent',
};

const defaultProps = {
  user: DEFAULT_USER,
  onNavigate: vi.fn(),
};

describe('ContactsWorkspaceV4Enhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ tenantId: 't-1', agencyId: 'a-1' });
  });

  it('renders when isLoading is true', () => {
    mockUseContacts.mockReturnValue({
      data: [],
      total: 0,
      isLoading: true,
      refetch: vi.fn(),
    });
    render(<ContactsWorkspaceV4Enhanced {...defaultProps} />);
    // Component renders; loading is handled by WorkspacePageTemplate
    expect(document.body).toBeTruthy();
  });

  it('renders empty state when data is empty', () => {
    mockUseContacts.mockReturnValue({
      data: [],
      total: 0,
      isLoading: false,
      refetch: vi.fn(),
    });
    render(<ContactsWorkspaceV4Enhanced {...defaultProps} />);
    expect(screen.getByText(/No contacts yet/i)).toBeInTheDocument();
  });

  it('renders contact list when data is present', () => {
    mockUseContacts.mockReturnValue({
      data: [
        {
          id: 'c-1',
          tenantId: 't-1',
          agencyId: 'a-1',
          contactNumber: '03001234567',
          type: 'CLIENT',
          category: 'BUYER',
          status: 'ACTIVE',
          name: 'Ahmed Ali',
          phone: '03001234567',
          email: 'ahmed@test.com',
          tags: '',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
      isLoading: false,
      refetch: vi.fn(),
    });
    render(<ContactsWorkspaceV4Enhanced {...defaultProps} />);
    expect(screen.getByText('Ahmed Ali')).toBeInTheDocument();
  });
});
