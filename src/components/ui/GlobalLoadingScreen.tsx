'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from './utils';

const DEFAULT_APP_NAME = 'Aaraazi';

export interface GlobalLoadingScreenProps {
  /** Loading message shown below the spinner */
  message?: string;
  /** Show app/portal name (white label) below the message; uses branding.portalTitle when available */
  showAppName?: boolean;
  /** Optional class for the outer container (e.g. height, padding) */
  className?: string;
  /** Spinner size: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

/**
 * Global loading screen with white-label support.
 * Uses CSS variable --primary for the spinner so it follows tenant branding.
 * Use for page-level or section-level loading states.
 */
export function GlobalLoadingScreen({
  message = 'Loading...',
  showAppName = false,
  className,
  size = 'md',
}: GlobalLoadingScreenProps) {
  const branding = useAuthStore((state) => state.branding);
  const appName = branding?.portalTitle ?? DEFAULT_APP_NAME;

  return (
    <div
      className={cn(
        'flex flex-col min-h-screen items-center justify-center',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2
        className={cn(
          'animate-spin text-primary shrink-0',
          sizeClasses[size]
        )}
      />
      <p className="mt-3 text-sm font-medium text-muted-foreground">
        {message}
      </p>
      {showAppName && (
        <p className="mt-1 text-xs text-muted-foreground/80">
          {appName}
        </p>
      )}
    </div>
  );
}
