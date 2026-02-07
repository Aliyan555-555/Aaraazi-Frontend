/**
 * QuickActionsPanel - Standardized quick actions sidebar component
 * 
 * Features:
 * - Consistent styling for action buttons
 * - Icon support
 * - Max 7 actions (Miller's Law)
 * - Large touch targets (Fitts's Law)
 * - Loading states
 * 
 * Usage:
 * <QuickActionsPanel
 *   title="Quick Actions"
 *   actions={[
 *     { label: 'Record Offer', icon: <Plus />, onClick: handleRecordOffer },
 *     { label: 'Update Status', icon: <Edit />, onClick: handleUpdateStatus }
 *   ]}
 * />
 */

import React from 'react';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

export interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
}

export interface QuickActionsPanelProps {
  title?: string;
  actions: QuickAction[];
  className?: string;
}

export function QuickActionsPanel({
  title = 'Quick Actions',
  actions,
  className = '',
}: QuickActionsPanelProps) {
  // Limit to 7 actions (Miller's Law)
  const displayActions = actions.slice(0, 7);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-5 ${className}`}>
      <h3 className="text-sm mb-4">{title}</h3>
      <div className="space-y-2">
        {displayActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outline'}
            className="w-full justify-start gap-2 text-sm h-10" // Fitts's Law: 40px height
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
          >
            {action.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              action.icon
            )}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
