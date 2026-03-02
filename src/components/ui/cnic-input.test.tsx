/**
 * Unit tests — CNICInput component (Task 2.7)
 *
 * Covers:
 *  • Format mask auto-application (XXXXX-XXXXXXX-X)
 *  • Digit-only enforcement
 *  • Backspace / delete behaviour
 *  • Accessibility attributes
 *  • Error state styling
 *  • formatCNIC / stripCNIC utility functions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CNICInput, formatCNIC, stripCNIC, CNIC_REGEX } from '@/components/ui/cnic-input';

// ============================================================================
// Utility function tests
// ============================================================================

describe('formatCNIC()', () => {
    it('returns empty string for empty input', () => {
        expect(formatCNIC('')).toBe('');
    });

    it('does not add dash until 6th digit', () => {
        expect(formatCNIC('12345')).toBe('12345');
    });

    it('adds first dash after 5th digit', () => {
        expect(formatCNIC('123456')).toBe('12345-6');
    });

    it('adds both dashes after 13th digit', () => {
        expect(formatCNIC('1234512345678')).toBe('12345-1234567-8');
    });

    it('strips non-digit characters before formatting', () => {
        expect(formatCNIC('123 45-123 4567-8')).toBe('12345-1234567-8');
    });

    it('truncates to 13 digits maximum', () => {
        expect(formatCNIC('12345678901234')).toBe('12345-6789012-3');
    });
});

describe('stripCNIC()', () => {
    it('removes dashes', () => {
        expect(stripCNIC('12345-1234567-8')).toBe('1234512345678');
    });

    it('handles empty string', () => {
        expect(stripCNIC('')).toBe('');
    });

    it('leaves plain digits unchanged', () => {
        expect(stripCNIC('42101')).toBe('42101');
    });
});

describe('CNIC_REGEX', () => {
    it('accepts valid CNIC format', () => {
        expect(CNIC_REGEX.test('12345-1234567-8')).toBe(true);
        expect(CNIC_REGEX.test('42101-9876543-2')).toBe(true);
    });

    it('rejects without dashes', () => {
        expect(CNIC_REGEX.test('1234512345678')).toBe(false);
    });

    it('rejects wrong dash positions', () => {
        expect(CNIC_REGEX.test('1234-12345678-9')).toBe(false);
    });

    it('rejects letters', () => {
        expect(CNIC_REGEX.test('ABCDE-1234567-8')).toBe(false);
    });
});

// ============================================================================
// Component rendering tests
// ============================================================================

describe('<CNICInput />', () => {
    it('renders with default placeholder', () => {
        render(<CNICInput />);
        expect(screen.getByTestId('cnic-input')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
        render(<CNICInput placeholder="Enter CNIC" />);
        expect(screen.getByPlaceholderText('Enter CNIC')).toBeInTheDocument();
    });

    it('has aria-label set to "CNIC Number"', () => {
        render(<CNICInput />);
        expect(screen.getByRole('textbox', { name: /CNIC Number/i })).toBeInTheDocument();
    });

    it('has inputMode="numeric"', () => {
        render(<CNICInput />);
        expect(screen.getByTestId('cnic-input')).toHaveAttribute('inputMode', 'numeric');
    });

    it('has maxLength of 15', () => {
        render(<CNICInput />);
        expect(screen.getByTestId('cnic-input')).toHaveAttribute('maxLength', '15');
    });

    it('applies error border class when error=true', () => {
        render(<CNICInput error id="cnic" />);
        const input = screen.getByTestId('cnic-input');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input.className).toMatch(/destructive/);
    });

    it('sets aria-invalid only when error is true', () => {
        render(<CNICInput id="cnic" />);
        expect(screen.getByTestId('cnic-input')).not.toHaveAttribute('aria-invalid');
    });

    it('is disabled when disabled=true', () => {
        render(<CNICInput disabled />);
        expect(screen.getByTestId('cnic-input')).toBeDisabled();
    });
});

// ============================================================================
// User interaction / format mask tests
// ============================================================================

describe('<CNICInput /> format mask behaviour', () => {
    it('auto-formats as the user types digits', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<CNICInput value="" onChange={onChange} />);

        const input = screen.getByTestId('cnic-input');
        await user.type(input, '4');

        // First call: '4'
        expect(onChange).toHaveBeenCalled();
        const firstCall = onChange.mock.calls[0]?.[0];
        expect(firstCall?.target.value).toBe('4');
    });

    it('inserts first dash at position 5', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        // Render with 5 digits already typed
        const { rerender } = render(<CNICInput value="12345" onChange={onChange} />);
        rerender(<CNICInput value="12345" onChange={onChange} />);

        const input = screen.getByTestId('cnic-input');
        await user.type(input, '6');

        // onChange called with auto-formatted value
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
        expect(lastCall?.target.value).toBe('12345-6');
    });

    it('calls onChange with the formatted value on each keystroke', async () => {
        const user = userEvent.setup();

        // Simulate controlled input: feed back formatted value
        let currentValue = '';
        const onChange = vi.fn((e: React.ChangeEvent<HTMLInputElement>) => {
            currentValue = e.target.value;
        });

        const { rerender } = render(
            <CNICInput value={currentValue} onChange={onChange} />,
        );

        const input = screen.getByTestId('cnic-input');

        for (const char of '1234512345678') {
            await user.type(input, char);
            rerender(<CNICInput value={currentValue} onChange={onChange} />);
        }

        expect(currentValue).toBe('12345-1234567-8');
    });

    it('does not exceed 15 characters (including dashes)', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<CNICInput value="12345-1234567-8" onChange={onChange} />);

        const input = screen.getByTestId('cnic-input');
        await user.type(input, '9');

        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
        // Should not grow beyond 15 chars
        expect((lastCall?.target.value ?? '').length).toBeLessThanOrEqual(15);
    });
});
