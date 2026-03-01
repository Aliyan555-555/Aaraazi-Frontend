'use client';

import React, { forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

/**
 * Format a raw digit string (up to 13 chars) into XXXXX-XXXXXXX-X mask.
 * @param raw - string of digits only
 */
export function formatCNIC(raw: string): string {
    // Strip everything that isn't a digit
    const digits = raw.replace(/\D/g, '').slice(0, 13);

    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

/**
 * Strip the CNIC mask dashes, returning only the raw digits (max 13).
 */
export function stripCNIC(masked: string): string {
    return masked.replace(/\D/g, '').slice(0, 13);
}

// ============================================================================
// Props
// ============================================================================

export interface CNICInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'maxLength' | 'minLength'> {
    /** Controlled value — should be the masked string (XXXXX-XXXXXXX-X) */
    value?: string;
    /** Called with the full masked value whenever it changes */
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Whether the field is in an error state */
    error?: boolean;
    /** Data-testid for unit tests */
    'data-testid'?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * CNICInput
 *
 * Renders a masked text input for Pakistani National ID numbers.
 * Enforces the XXXXX-XXXXXXX-X format automatically.
 */
export const CNICInput = forwardRef<HTMLInputElement, CNICInputProps>(
    (
        {
            value = '',
            onChange,
            onBlur,
            className,
            placeholder = '12345-1234567-8',
            error,
            disabled,
            id,
            name,
            'data-testid': testId,
            ...rest
        },
        ref,
    ) => {
        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;

                // If user is deleting a dash, erase the digit before it too
                const previousFormatted = value ?? '';
                const isDeleting = raw.length < previousFormatted.length;

                let formatted: string;
                if (isDeleting) {
                    // Strip one extra digit when backspacing over a dash position
                    const digits = stripCNIC(raw);
                    formatted = formatCNIC(digits.length > 0 ? digits.slice(0, -1) : digits);
                    // Special case: if cursor is right after a dash, raw already stripped
                    // the dash so we just re-format whatever digits remain
                    if (!raw.endsWith('-') || raw.length < previousFormatted.length - 1) {
                        formatted = formatCNIC(stripCNIC(raw));
                    }
                } else {
                    formatted = formatCNIC(raw);
                }

                // Synthesise a new event carrying the formatted value so react-hook-form
                // and controlled parents receive the canonical masked string
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, value: formatted, name: name ?? '' },
                    currentTarget: { ...e.currentTarget, value: formatted, name: name ?? '' },
                } as React.ChangeEvent<HTMLInputElement>;

                onChange?.(syntheticEvent);
            },
            [value, onChange, name],
        );

        return (
            <div className="relative">
                <input
                    ref={ref}
                    id={id}
                    name={name}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    maxLength={15} // XXXXX-XXXXXXX-X = 15 chars
                    data-testid={testId ?? 'cnic-input'}
                    aria-label="CNIC Number"
                    aria-describedby={error ? `${id ?? 'cnic'}-error` : undefined}
                    aria-invalid={error ? true : undefined}
                    className={cn(
                        // Match the project's Input component styles exactly
                        'flex h-10 w-full rounded-md border bg-background px-3 py-2',
                        'text-sm ring-offset-background font-mono tracking-wider',
                        'placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error
                            ? 'border-destructive focus-visible:ring-destructive'
                            : 'border-input',
                        className,
                    )}
                    {...rest}
                />
                {/* Subtle format hint beneath right edge */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 font-mono select-none"
                >
                    {value ? '' : 'XXXXX-XXXXXXX-X'}
                </span>
            </div>
        );
    },
);

CNICInput.displayName = 'CNICInput';
