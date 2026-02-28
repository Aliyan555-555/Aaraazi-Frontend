import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactFormModal } from '@/components/ContactFormModal';
import type { Contact } from '@/types/schema';

const mockMutateAsync = vi.fn();
vi.mock('@/hooks/useContacts', () => ({
    useCreateContact: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
    useUpdateContact: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

const DEFAULT_PROPS = {
    isOpen: true as boolean,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    agentId: 'agent-001',
    tenantId: 'tenant-001',
    agencyId: 'agency-001',
};

function renderModal(overrides: Partial<typeof DEFAULT_PROPS & { editingContact: Contact | null }> = {}) {
    const props = { ...DEFAULT_PROPS, ...overrides };
    return render(<ContactFormModal {...props} />);
}

// ── Mock contact for edit mode (schema Contact) ─────────────────────────────

const MOCK_CONTACT: Contact = {
    id: 'c-001',
    tenantId: 'tenant-001',
    agencyId: 'agency-001',
    branchId: null,
    agentId: 'agent-001',
    contactNumber: '03111234567',
    type: 'CLIENT',
    category: 'BUYER',
    status: 'ACTIVE',
    name: 'Ayesha Khan',
    phone: '03111234567',
    email: 'ayesha@example.com',
    alternatePhone: null,
    cnic: '42101-1234567-3',
    address: null,
    preferences: null,
    tags: '',
    isShared: false,
    originLeadId: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    createdBy: 'agent-001',
    updatedBy: null,
};


describe('<ContactFormModal /> — rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders when isOpen=true', () => {
        renderModal();
        expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    });

    it('does not render when isOpen=false', () => {
        renderModal({ isOpen: false });
        expect(screen.queryByTestId('contact-form')).not.toBeInTheDocument();
    });

    it('shows "Add New Contact" title in create mode', () => {
        renderModal();
        expect(screen.getByRole('heading', { name: /Add New Contact/i })).toBeInTheDocument();
    });

    it('shows "Edit Contact" title in edit mode', () => {
        renderModal({ editingContact: MOCK_CONTACT });
        expect(screen.getByRole('heading', { name: /Edit Contact/i })).toBeInTheDocument();
    });

    it('renders all key form fields', () => {
        renderModal();
        expect(screen.getByTestId('input-name')).toBeInTheDocument();
        expect(screen.getByTestId('input-phone')).toBeInTheDocument();
        expect(screen.getByTestId('input-email')).toBeInTheDocument();
        expect(screen.getByTestId('select-type')).toBeInTheDocument();
        expect(screen.getByTestId('input-notes')).toBeInTheDocument();
    });

    it('shows Pakistani format hint next to phone field', () => {
        renderModal();
        expect(screen.getByText(/Pakistani format/i)).toBeInTheDocument();
    });
});

// ============================================================================
// Edit mode — pre-population
// ============================================================================

describe('<ContactFormModal /> — edit mode pre-population', () => {
    it('pre-populates name field from editingContact', () => {
        renderModal({ editingContact: MOCK_CONTACT });
        expect(screen.getByTestId('input-name')).toHaveValue('Ayesha Khan');
    });

    it('pre-populates phone field from editingContact', () => {
        renderModal({ editingContact: MOCK_CONTACT });
        expect(screen.getByTestId('input-phone')).toHaveValue('03111234567');
    });

    it('pre-populates email field from editingContact', () => {
        renderModal({ editingContact: MOCK_CONTACT });
        expect(screen.getByTestId('input-email')).toHaveValue('ayesha@example.com');
    });

});

// ============================================================================
// Validation error messages
// ============================================================================

describe('<ContactFormModal /> — Zod validation errors', () => {
    it('shows name error when name is empty and form is submitted', async () => {
        const user = userEvent.setup();
        renderModal();

        // Form starts with empty name (default) — just submit
        await user.click(screen.getByTestId('btn-submit'));

        // FormField renders errors in <p role="alert"><span>message</span></p>
        const alerts = await screen.findAllByRole('alert', {}, { timeout: 3000 });
        expect(alerts.length).toBeGreaterThan(0);

        // At least one alert should mention 2 characters or similar
        const alertTexts = alerts.map((el) => el.textContent ?? '').join(' ');
        expect(alertTexts).toMatch(/2 characters|required|valid/i);
    });

    it('shows phone error when phone is invalid', async () => {
        const user = userEvent.setup();
        renderModal();

        // Fill name so only phone fails
        await user.type(screen.getByTestId('input-name'), 'Valid Name');
        await user.clear(screen.getByTestId('input-phone'));
        await user.type(screen.getByTestId('input-phone'), '0213456789'); // landline — invalid
        await user.click(screen.getByTestId('btn-submit'));

        const alerts = await screen.findAllByRole('alert', {}, { timeout: 3000 });
        const alertTexts = alerts.map((el) => el.textContent ?? '').join(' ');
        expect(alertTexts).toMatch(/Pakistani/i);
    });

});


// ============================================================================
// Cancel button
// ============================================================================

describe('<ContactFormModal /> — cancel behaviour', () => {
    it('calls onClose when Cancel is clicked', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        renderModal({ onClose });

        await user.click(screen.getByTestId('btn-cancel'));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('does NOT call onSuccess when Cancel is clicked', async () => {
        const user = userEvent.setup();
        const onSuccess = vi.fn();
        renderModal({ onSuccess });

        await user.click(screen.getByTestId('btn-cancel'));

        expect(onSuccess).not.toHaveBeenCalled();
    });
});

// ============================================================================
// Successful submission
// ============================================================================

describe('<ContactFormModal /> — successful submission', () => {
    beforeEach(() => {
        mockMutateAsync.mockResolvedValue({
            id: 'new-id-123',
            name: 'Tariq Bashir',
            phone: '03451234567',
        } as Contact);
    });

    it('calls useCreateContact.mutateAsync and onSuccess on valid submit', async () => {
        const user = userEvent.setup();
        const onSuccess = vi.fn();
        const onClose = vi.fn();
        renderModal({ onSuccess, onClose });

        await user.type(screen.getByTestId('input-name'), 'Tariq Bashir');
        await user.type(screen.getByTestId('input-phone'), '03451234567');
        await user.click(screen.getByTestId('btn-submit'));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalled();
            expect(onSuccess).toHaveBeenCalledOnce();
            expect(onSuccess.mock.calls[0]?.[0].name).toBe('Tariq Bashir');
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('calls onClose after successful submission', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        renderModal({ onClose });

        await user.type(screen.getByTestId('input-name'), 'Tariq Bashir');
        await user.type(screen.getByTestId('input-phone'), '03451234567');
        await user.click(screen.getByTestId('btn-submit'));

        await waitFor(() => {
            expect(onClose).toHaveBeenCalledOnce();
        });
    });
});
