/**
 * Component tests — InteractionForm
 * Verifies rendering, validation errors, and mutation hook invocations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InteractionForm } from './InteractionForm';

// ── Mock hooks ────────────────────────────────────────────────────────────────

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/hooks/useInteractions', () => ({
  useCreateInteraction: () => ({
    mutateAsync: mockCreate,
    isPending: false,
  }),
  useUpdateInteraction: () => ({
    mutateAsync: mockUpdate,
    isPending: false,
  }),
}));

// ── Default props ─────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  contactId: 'contact-1',
  user: { id: 'user-1', email: 'u@t.co', name: 'Agent', role: 'agent' as const },
  tenantId: 'tenant-1',
  agencyId: 'agency-1',
  onSuccess: vi.fn(),
  onCancel: vi.fn(),
};

function renderForm(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  return render(<InteractionForm {...DEFAULT_PROPS} {...overrides} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InteractionForm', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockUpdate.mockClear();
    DEFAULT_PROPS.onSuccess.mockClear();
    DEFAULT_PROPS.onCancel.mockClear();
    mockCreate.mockResolvedValue({ id: 'int-1' });
    mockUpdate.mockResolvedValue({ id: 'int-1' });
  });

  it('renders all required fields', () => {
    renderForm();
    expect(screen.getByLabelText(/interaction type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('shows "Log Interaction" button in create mode', () => {
    renderForm();
    expect(
      screen.getByRole('button', { name: /log interaction/i }),
    ).toBeInTheDocument();
  });

  it('shows "Update Interaction" button in edit mode', () => {
    renderForm({
      interaction: {
        id: 'int-1',
        type: 'CALL',
        direction: 'OUTBOUND',
        summary: 'Test call',
        date: '2026-01-15T00:00:00.000Z',
        agentId: 'agent-1',
        tenantId: 'tenant-1',
        agencyId: 'agency-1',
        createdAt: '2026-01-15T00:00:00.000Z',
      },
    } as Parameters<typeof InteractionForm>[0]);
    expect(
      screen.getByRole('button', { name: /update interaction/i }),
    ).toBeInTheDocument();
  });

  it('shows validation error when subject is too short', async () => {
    const user = userEvent.setup();
    renderForm();

    const subjectInput = screen.getByLabelText(/subject/i);
    await user.type(subjectInput, 'Hi');
    await user.type(screen.getByLabelText(/notes/i), 'Some notes');
    await user.click(screen.getByRole('button', { name: /log interaction/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('calls useCreateInteraction on valid submit in create mode', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/subject/i), 'Follow-up call with buyer about DHA plot');
    await user.type(screen.getByLabelText(/notes/i), 'Discussed pricing and next steps');

    await user.click(
      screen.getByRole('button', { name: /log interaction/i }),
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Follow-up call with buyer about DHA plot',
          contactId: 'contact-1',
          tenantId: 'tenant-1',
          agencyId: 'agency-1',
        }),
      );
    });
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(DEFAULT_PROPS.onCancel).toHaveBeenCalled();
  });

  it('calls onSuccess after successful creation', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByLabelText(/subject/i),
      'Discussed property requirements in detail',
    );
    await user.type(screen.getByLabelText(/notes/i), 'Buyer interested in 3-bed');
    await user.click(
      screen.getByRole('button', { name: /log interaction/i }),
    );

    await waitFor(() => {
      expect(DEFAULT_PROPS.onSuccess).toHaveBeenCalled();
    });
  });
});
