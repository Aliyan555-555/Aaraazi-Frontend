import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'destructive' | 'default' | 'info' | 'secondary' | 'neutral' | 'progress';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * StatusBadge - Unified semantic status indicators
 * 
 * PHASE 5: Brand Redesign - Semantic Color System
 * ================================================
 * Uses the aaraazi brand color palette:
 * - Success: Forest Green (#2D6A54) - positive outcomes
 * - Warning: Terracotta (#C17052) - attention needed
 * - Progress: Warm tones - in-progress states
 * - Neutral: Warm grays - completed/inactive
 * - Destructive: Red - errors/cancelled
 * - Info: Blue - informational
 * 
 * Auto-mapping for common statuses ensures consistency.
 * 
 * Usage:
 * <StatusBadge status="Available" />          // Auto: success (forest green)
 * <StatusBadge status="Under Contract" />     // Auto: warning (terracotta)
 * <StatusBadge status="Sold" />               // Auto: neutral (gray)
 * <StatusBadge status="Pending" variant="warning" size="sm" />
 */
export function StatusBadge({ status, variant, size = 'md' }: StatusBadgeProps) {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5',
    lg: 'px-3 py-1'
  };

  // Handle undefined/null status
  if (!status) {
    return (
      <Badge variant="secondary" className={cn(sizeClasses[size])}>
        N/A
      </Badge>
    );
  }

  // Map common statuses to brand-aligned variants
  const getVariant = (status: string): StatusBadgeProps['variant'] => {
    const statusLower = status.toLowerCase().replace(/_/g, ' ');

    // SUCCESS (Forest Green #2D6A54) - Positive, ready states
    if ([
      'available',
      'active',
      'approved',
      'accepted',
      'success',
      'paid',
      'verified',
      'qualified', // Lead status
      'won', // Deal won
      'published'
    ].includes(statusLower)) {
      return 'success';
    }

    // WARNING (Terracotta #C17052) - Attention needed, in negotiation
    if ([
      'pending',
      'in progress',
      'review',
      'offers received',
      'negotiation',
      'under contract',
      'contacted', // Lead status
      'processing',
      'scheduled',
      'on hold'
    ].includes(statusLower)) {
      return 'warning';
    }

    // PROGRESS (Warm blue) - Active work in progress
    if ([
      'new',
      'draft',
      'in pipeline',
      'viewing scheduled'
    ].includes(statusLower)) {
      return 'progress';
    }

    // NEUTRAL (Warm gray) - Completed, sold, inactive (not negative)
    if ([
      'sold',
      'completed',
      'closed',
      'archived',
      'finalized',
      'settled',
      'delivered'
    ].includes(statusLower)) {
      return 'neutral';
    }

    // DESTRUCTIVE (Red) - Errors, rejections, cancellations
    if ([
      'rejected',
      'cancelled',
      'overdue',
      'failed',
      'expired',
      'inactive',
      'lost', // Deal lost
      'declined',
      'terminated'
    ].includes(statusLower)) {
      return 'destructive';
    }

    // INFO (Blue) - Informational, matched
    if ([
      'matched',
      'assigned',
      'notified',
      'sent'
    ].includes(statusLower)) {
      return 'info';
    }

    return 'default';
  };

  const finalVariant = (variant || getVariant(status) || 'default') as keyof typeof variantClasses;

  // Variant classes using aaraazi brand palette
  const variantClasses = {
    // SUCCESS: Forest Green - positive, ready states
    success: 'bg-success-bg text-success border-success/20',

    // WARNING: Terracotta - attention needed
    warning: 'bg-warning-bg text-warning-foreground border-warning/20',

    // PROGRESS: Warm blue - active work
    progress: 'bg-info-bg text-info-foreground border-info/20',

    // NEUTRAL: Warm gray - completed (not negative)
    neutral: 'bg-neutral-100 text-slate-700 border-neutral-200',

    // DESTRUCTIVE: Red - errors, cancellations
    destructive: 'bg-destructive-bg text-destructive border-destructive/20',

    // INFO: Blue - informational
    info: 'bg-info-bg text-info-foreground border-info/20',

    // DEFAULT: Light neutral
    default: 'bg-muted text-muted-foreground border-border',

    // SECONDARY: Brand secondary
    secondary: 'bg-secondary text-secondary-foreground border-secondary/20'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${variantClasses[finalVariant]}`}
      role="status"
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}

/**
 * SEMANTIC STATUS MAPPINGS - Quick Reference
 * ============================================
 * 
 * PROPERTY STATUSES:
 * - Available → SUCCESS (Forest Green)
 * - Under Contract → WARNING (Terracotta)
 * - Sold → NEUTRAL (Gray)
 * - Off Market → NEUTRAL (Gray)
 * - Pending → WARNING (Terracotta)
 * 
 * LEAD STATUSES:
 * - New → PROGRESS (Blue)
 * - Contacted → WARNING (Terracotta)
 * - Qualified → SUCCESS (Forest Green)
 * - Negotiation → WARNING (Terracotta)
 * - Won → SUCCESS (Forest Green)
 * - Lost → DESTRUCTIVE (Red)
 * 
 * DEAL STATUSES:
 * - Active → SUCCESS (Forest Green)
 * - On Hold → WARNING (Terracotta)
 * - Completed → NEUTRAL (Gray)
 * - Cancelled → DESTRUCTIVE (Red)
 * 
 * TRANSACTION STATUSES:
 * - Pending → WARNING (Terracotta)
 * - In Progress → PROGRESS (Blue)
 * - Completed → NEUTRAL (Gray)
 * - Failed → DESTRUCTIVE (Red)
 * 
 * COMMISSION STATUSES:
 * - Pending → WARNING (Terracotta)
 * - Approved → SUCCESS (Forest Green)
 * - Paid → SUCCESS (Forest Green)
 * - Cancelled → DESTRUCTIVE (Red)
 */