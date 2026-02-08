/**
 * DealWorkspaceCard Component
 * Custom card for Deals Workspace - Grid View
 * 
 * Uses WorkspaceCard with deal-specific customization
 */

import React from 'react';
import {
  FileText,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Deal } from '../../types/deals';
import { WorkspaceCard } from '../workspace/cards/WorkspaceCard';
import { QuickActionMenu, QuickActionPresets } from '../workspace/QuickActionMenu';
import { formatPKR } from '../../lib/currency';

export interface DealWorkspaceCardProps {
  deal: Deal;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onChangeStage?: () => void;
  showSelection?: boolean;
}

/**
 * DealWorkspaceCard - Custom card for deal grid view
 */
export const DealWorkspaceCard: React.FC<DealWorkspaceCardProps> = ({
  deal,
  isSelected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  onChangeStage,
  showSelection = true,
}) => {
  // Get deal status for display
  const getStatusBadge = (): { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'secondary' } => {
    switch (deal.lifecycle.status) {
      case 'active':
        return { label: 'Active', variant: 'success' };
      case 'on-hold':
        return { label: 'On Hold', variant: 'warning' };
      case 'completed':
        return { label: 'Completed', variant: 'info' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'secondary' };
      default:
        return { label: deal.lifecycle.status, variant: 'default' };
    }
  };

  // Get stage label
  const getStageLabel = () => {
    const stageLabels = {
      'offer-accepted': 'Offer Accepted',
      'agreement-signing': 'Agreement Signing',
      'documentation': 'Documentation',
      'payment-processing': 'Payment Processing',
      'handover-prep': 'Handover Prep',
      'transfer-registration': 'Transfer Registration',
      'final-handover': 'Final Handover',
      'completed': 'Completed',
    };
    return (stageLabels as any)[deal.lifecycle.stage] || deal.lifecycle.stage;
  };

  // Calculate payment progress
  const paymentProgress = deal.financial.agreedPrice > 0
    ? Math.round((deal.financial.totalPaid / deal.financial.agreedPrice) * 100)
    : 0;

  // Determine tags
  const tags: Array<{ label: string; variant: 'default' | 'success' | 'info' | 'warning' }> = [];

  if (deal.cycles.purchaseCycle) {
    tags.push({ label: 'Dual Agent', variant: 'info' });
  }

  if (paymentProgress === 100) {
    tags.push({ label: 'Paid', variant: 'success' });
  } else if (paymentProgress > 50) {
    tags.push({ label: `${paymentProgress}% Paid`, variant: 'info' });
  }

  // Calculate days to closing
  const getDaysToClosing = () => {
    const expectedDate = new Date(deal.lifecycle.timeline.expectedClosingDate);
    const now = new Date();
    const diffTime = expectedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysToClosing = getDaysToClosing();

  // Build metadata (max 5 items - Miller's Law)
  const metadata = [
    {
      label: 'Deal Value',
      value: formatPKR(deal.financial.agreedPrice),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Buyer',
      value: deal.parties.buyer.name,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'Seller',
      value: deal.parties.seller.name,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'Payment',
      value: `${paymentProgress}%`,
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  // Add closing date info
  if (daysToClosing > 0) {
    metadata.push({
      label: 'Closes in',
      value: `${daysToClosing} days`,
      icon: <Calendar className="h-4 w-4" />,
    });
  } else if (daysToClosing < 0) {
    metadata.push({
      label: 'Overdue',
      value: `${Math.abs(daysToClosing)} days`,
      icon: <AlertCircle className="h-4 w-4" />,
    });
  }

  // Limit to 5 items
  const displayMetadata = metadata.slice(0, 5);

  const status = getStatusBadge();

  return (
    <WorkspaceCard
      title={deal.dealNumber}
      subtitle={getStageLabel()}
      imageFallback={<FileText className="h-12 w-12 text-gray-400" />}
      status={status}
      metadata={displayMetadata}
      tags={tags.slice(0, 3)}
      footer={
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-3 w-3" />
            <span>
              {new Date(deal.lifecycle.timeline.offerAcceptedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <QuickActionMenu
            actions={[
              {
                id: 'view',
                label: 'View Details',
                icon: <FileText className="h-4 w-4" />,
                onClick: onClick || (() => { }),
              },
              {
                id: 'stage',
                label: 'Change Stage',
                icon: <CheckCircle2 className="h-4 w-4" />,
                onClick: onChangeStage || (() => { }),
              },
              ...(onEdit ? [{
                id: 'edit',
                label: 'Edit',
                icon: <FileText className="h-4 w-4" />,
                onClick: onEdit,
              }] : []),
            ]}
            showOnHover={true}
          />
        </div>
      }
      onClick={onClick}
      isSelected={isSelected}
      onSelect={onSelect}
      showSelection={showSelection}
    />
  );
};
