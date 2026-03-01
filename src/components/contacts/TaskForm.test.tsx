/**
 * Component tests — TaskForm
 * Verifies rendering, validation errors, and mutation hook invocations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from './TaskForm';

// ── Mock hooks ────────────────────────────────────────────────────────────────

const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/hooks/useTasks', () => ({
  useCreateTask: () => ({
    mutateAsync: mockCreate,
    isPending: false,
  }),
  useUpdateTask: () => ({
    mutateAsync: mockUpdate,
    isPending: false,
  }),
}));

// ── Default props ─────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  contactId: 'contact-1',
  tenantId: 'tenant-1',
  agencyId: 'agency-1',
  onSuccess: vi.fn(),
  onCancel: vi.fn(),
};

function renderForm(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  return render(<TaskForm {...DEFAULT_PROPS} {...overrides} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TaskForm', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockUpdate.mockClear();
    DEFAULT_PROPS.onSuccess.mockClear();
    DEFAULT_PROPS.onCancel.mockClear();
    mockCreate.mockResolvedValue({ id: 'task-1' });
    mockUpdate.mockResolvedValue({ id: 'task-1' });
  });

  it('renders all required fields', () => {
    renderForm();
    expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/task type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it('shows "Create Task" button in create mode', () => {
    renderForm();
    expect(
      screen.getByRole('button', { name: /create task/i }),
    ).toBeInTheDocument();
  });

  it('does not show status dropdown in create mode', () => {
    renderForm();
    expect(screen.queryByLabelText(/^status/i)).not.toBeInTheDocument();
  });

  it('shows "Update Task" button and status dropdown in edit mode', () => {
    renderForm({
      task: {
        id: 'task-1',
        title: 'Follow-up with buyer',
        type: 'FOLLOW_UP',
        priority: 'HIGH',
        status: 'PENDING',
        dueDate: '2026-03-01T00:00:00.000Z',
        assignedToId: 'user-1',
        tenantId: 'tenant-1',
        agencyId: 'agency-1',
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
    } as Parameters<typeof TaskForm>[0]);

    expect(
      screen.getByRole('button', { name: /update task/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^status/i)).toBeInTheDocument();
  });

  it('shows validation error when title is too short', async () => {
    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByLabelText(/task title/i);
    await user.type(titleInput, 'Hi');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/3 characters/i)).toBeInTheDocument();
    });
  });

  it('calls useCreateTask on valid submit in create mode', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByLabelText(/task title/i),
      'Send property brochure to Ahmed',
    );

    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Send property brochure to Ahmed',
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
      screen.getByLabelText(/task title/i),
      'Schedule property viewing for Thursday',
    );
    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(DEFAULT_PROPS.onSuccess).toHaveBeenCalled();
    });
  });
});
