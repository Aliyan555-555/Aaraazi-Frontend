/**
 * DealKanbanCard Component
 * Custom Kanban card for Deals Workspace - Kanban View
 * 
 * Uses WorkspaceKanbanCard with deal-specific customization
 */

import React from 'react';
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Deal } from '../../types/deals';
import { WorkspaceKanbanCard } from '../workspace/cards/WorkspaceKanbanCard';
import { formatPKR } from '../../lib/currency';

export interface DealKanbanCardProps {
  deal: Deal;
  onClick?: () => void;
}

/**
 * DealKanbanCard - Custom card for deal kanban view
 */
export const DealKanbanCard: React.FC<DealKanbanCardProps> = ({
  deal,
  onClick,
}) => {
  // Calculate payment progress
  const paymentProgress = deal.financial.agreedPrice > 0
    ? Math.round((deal.financial.totalPaid / deal.financial.agreedPrice) * 100)
    : 0;

  // Calculate days to closing
  const getDaysToClosing = () => {
    const expectedDate = new Date(deal.lifecycle.timeline.expectedClosingDate);
    const now = new Date();
    const diffTime = expectedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysToClosing = getDaysToClosing();

  // Determine priority based on days to closing
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  if (daysToClosing < 0) {
    priority = 'urgent';
  } else if (daysToClosing <= 3) {
    priority = 'high';
  } else if (daysToClosing <= 7) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  // Build tags (as strings for WorkspaceKanbanCard)
  const tags: string[] = [];

  if (deal.cycles.purchaseCycle) {
    tags.push('Dual Agent');
  }

  if (paymentProgress === 100) {
    tags.push('Paid');
  } else if (paymentProgress > 0) {
    tags.push(`${paymentProgress}% Paid`);
  }

  if (daysToClosing < 0) {
    tags.push('Overdue');
  }

  // Build metrics (for WorkspaceKanbanCard)
  const metrics = [
    {
      icon: <DollarSign className="h-3.5 w-3.5" />,
      label: 'Value',
      value: formatPKR(deal.financial.agreedPrice),
    },
    {
      icon: <Users className="h-3.5 w-3.5" />,
      label: 'Buyer',
      value: deal.parties.buyer.name,
    },
    {
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      label: 'Paid',
      value: `${paymentProgress}%`,
    },
  ];

  // Add closing date or overdue indicator
  if (daysToClosing >= 0) {
    metrics.push({
      icon: <Calendar className="h-3.5 w-3.5" />,
      label: 'Closing',
      value: `${daysToClosing} days`,
    });
  } else {
    metrics.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      label: 'Overdue',
      value: `${Math.abs(daysToClosing)} days`,
    });
  }

  // Build title with buyer and value info
  const title = `${deal.dealNumber} • ${deal.parties.buyer.name}`;

  return (
    <WorkspaceKanbanCard
      id={deal.id}
      title={title}
      reference={formatPKR(deal.financial.agreedPrice)}
      priority={priority}
      tags={tags.slice(0, 2)} // Max 2 tags for kanban
      metrics={metrics.slice(0, 3)} // Max 3 metrics for kanban
      progress={paymentProgress}
      onClick={onClick}
    />
  );
};
