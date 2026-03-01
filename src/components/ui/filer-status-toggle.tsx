'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BadgeCheck, AlertTriangle, Info } from 'lucide-react';

export type FilerStatus = 'filer' | 'non-filer';

export interface FilerStatusToggleProps {
    /** Controlled value */
    value?: FilerStatus;
    /** Called when the user changes the status */
    onChange?: (status: FilerStatus) => void;
    /** Disable the toggle */
    disabled?: boolean;
    /** Show the expanded WHT info panel beneath the toggle */
    showInfo?: boolean;
    /** Additional class names for the wrapper */
    className?: string;
    /** For react-hook-form compatibility */
    name?: string;
    /** For unit tests */
    'data-testid'?: string;
}


const WHT_RATES = {
    filer: {
        seller: '1%',
        buyer: '2%',
        token: '1%',
    },
    'non-filer': {
        seller: '2%',
        buyer: '4%',
        token: '2%',
    },
} as const;


export const FilerStatusToggle: React.FC<FilerStatusToggleProps> = ({
    value = 'non-filer',
    onChange,
    disabled = false,
    showInfo = true,
    className,
    name,
    'data-testid': testId = 'filer-status-toggle',
}) => {
    const isFiler = value === 'filer';

    const handleSelect = (status: FilerStatus) => {
        if (!disabled && status !== value) {
            onChange?.(status);
        }
    };

    const rates = WHT_RATES[value];

    return (
        <div className={cn('space-y-3', className)} data-testid={testId}>
            {/* Hidden input for form serialisation */}
            {name && <input type="hidden" name={name} value={value} />}

            {/* Toggle pill */}
            <div
                role="radiogroup"
                aria-label="Tax Filer Status"
                className={cn(
                    'inline-flex rounded-lg border bg-muted p-1 gap-1',
                    disabled && 'opacity-50 cursor-not-allowed',
                )}
            >
                {/* Filer option */}
                <button
                    type="button"
                    role="radio"
                    aria-checked={isFiler}
                    disabled={disabled}
                    data-testid="filer-option"
                    onClick={() => handleSelect('filer')}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
                        'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
                        'focus-visible:ring-ring focus-visible:ring-offset-1',
                        isFiler
                            ? 'bg-background text-emerald-700 shadow-sm border border-emerald-200 dark:text-emerald-400 dark:border-emerald-800'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                    )}
                >
                    <BadgeCheck
                        className={cn(
                            'h-4 w-4 transition-colors',
                            isFiler ? 'text-emerald-600' : 'text-muted-foreground/50',
                        )}
                    />
                    <span>Filer</span>
                </button>

                {/* Non-Filer option */}
                <button
                    type="button"
                    role="radio"
                    aria-checked={!isFiler}
                    disabled={disabled}
                    data-testid="non-filer-option"
                    onClick={() => handleSelect('non-filer')}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
                        'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
                        'focus-visible:ring-ring focus-visible:ring-offset-1',
                        !isFiler
                            ? 'bg-background text-amber-700 shadow-sm border border-amber-200 dark:text-amber-400 dark:border-amber-800'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                    )}
                >
                    <AlertTriangle
                        className={cn(
                            'h-4 w-4 transition-colors',
                            !isFiler ? 'text-amber-500' : 'text-muted-foreground/50',
                        )}
                    />
                    <span>Non-Filer</span>
                </button>
            </div>

            {/* WHT Rate Info Panel */}
            {showInfo && (
                <div
                    data-testid="filer-info-panel"
                    className={cn(
                        'rounded-lg border p-3 text-xs',
                        isFiler
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300',
                    )}
                >
                    <div className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                            <p className="font-semibold">
                                {isFiler ? '✅ Active Taxpayer (Filer)' : '⚠️ Non-Active Taxpayer (Non-Filer)'}
                            </p>
                            <p>
                                Applicable WHT rates under Income Tax Ordinance 2001 (Finance Act 2024):
                            </p>
                            <ul className="grid grid-cols-3 gap-x-4 gap-y-0.5 mt-1 font-mono">
                                <li>
                                    <span className="font-sans font-medium">Seller WHT:</span>{' '}
                                    <strong>{rates.seller}</strong>
                                </li>
                                <li>
                                    <span className="font-sans font-medium">Buyer WHT:</span>{' '}
                                    <strong>{rates.buyer}</strong>
                                </li>
                                <li>
                                    <span className="font-sans font-medium">Token WHT:</span>{' '}
                                    <strong>{rates.token}</strong>
                                </li>
                            </ul>
                            {!isFiler && (
                                <p className="mt-1 italic">
                                    Non-filers pay double WHT. Advise client to register on FBR IRIS to reduce transfer costs.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

FilerStatusToggle.displayName = 'FilerStatusToggle';
