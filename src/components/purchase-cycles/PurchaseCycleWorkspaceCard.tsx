/**
 * PurchaseCycleWorkspaceCard Component
 * Custom card for Purchase Cycles Workspace
 * 
 * Uses WorkspaceCard with purchase cycle-specific customization
 */

import React from 'react';
import { Property, PurchaseCycle } from '../../types';
import { formatPKR } from '../../lib/currency';
import { formatPropertyAddress } from '../../lib/utils';
import { WorkspaceCard } from '../workspace/cards/WorkspaceCard';
import { 
  Home,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  User as UserIcon,
  Eye,
  Ruler,
} from 'lucide-react';
import { QuickActionMenu } from '../workspace/QuickActionMenu';

export interface PurchaseCycleWorkspaceCardProps {
  cycle: PurchaseCycle;
  property?: Property | null;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showSelection?: boolean;
}

/**
 * PurchaseCycleWorkspaceCard - Custom card for purchase cycle grid view
 */
export const PurchaseCycleWorkspaceCard: React.FC<PurchaseCycleWorkspaceCardProps> = ({
  cycle,
  property,
  isSelected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  showSelection = true,
}) => {
  // Get status badge variant
  const getStatusVariant = (): { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'secondary' } => {
    switch (cycle.status) {
      case 'prospecting':
        return { label: 'Prospecting', variant: 'info' };
      case 'offer-made':
        return { label: 'Offer Made', variant: 'warning' };
      case 'negotiation':
        return { label: 'Negotiation', variant: 'warning' };
      case 'under-contract':
        return { label: 'Under Contract', variant: 'success' };
      case 'due-diligence':
        return { label: 'Due Diligence', variant: 'info' };
      case 'closing':
        return { label: 'Closing', variant: 'success' };
      case 'completed':
        return { label: 'Completed', variant: 'secondary' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'default' };
      default:
        return { label: cycle.status, variant: 'default' };
    }
  };

  // Format area with unit
  const formatArea = () => {
    if (!property) return 'N/A';
    const unitLabels = {
      sqft: 'sq ft',
      sqyards: 'sq yd',
      marla: 'marla',
      kanal: 'kanal',
    };
    return `${property.area} ${unitLabels[property.areaUnit] || property.areaUnit}`;
  };

  // Get purchaser type label
  const getPurchaserTypeLabel = () => {
    const labels = {
      agency: 'Agency',
      investor: 'Investor',
      client: 'Client',
    };
    return labels[cycle.purchaserType] || cycle.purchaserType;
  };

  // Get financing type label
  const getFinancingLabel = () => {
    const labels = {
      cash: 'Cash',
      loan: 'Loan',
      installment: 'Installment',
      other: 'Other',
    };
    return labels[cycle.financingType] || cycle.financingType;
  };

  // Determine tags (max 3)
  const tags: Array<{ label: string; variant: 'default' | 'success' | 'info' | 'warning' }> = [];
  
  // Add purchaser type tag
  tags.push({ 
    label: getPurchaserTypeLabel(), 
    variant: cycle.purchaserType === 'agency' ? 'info' : 
             cycle.purchaserType === 'investor' ? 'warning' : 'default' 
  });
  
  // Add financing tag
  if (cycle.financingType === 'cash') {
    tags.push({ label: 'Cash Deal', variant: 'success' });
  } else if (cycle.loanApproved) {
    tags.push({ label: 'Loan Approved', variant: 'success' });
  }
  
  // Add due diligence status
  if (cycle.titleClear && cycle.inspectionDone && cycle.documentsVerified) {
    tags.push({ label: 'DD Complete', variant: 'success' });
  }

  // Calculate days in cycle
  const getDaysInCycle = () => {
    const startDate = cycle.offerDate ? new Date(cycle.offerDate) : new Date();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysInCycle = getDaysInCycle();

  // Build metadata (max 5 items - Miller's Law)
  const metadata = [
    {
      label: 'Offer Amount',
      value: formatPKR(cycle.offerAmount).replace('PKR ', ''),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Area',
      value: formatArea(),
      icon: <Ruler className="h-4 w-4" />,
    },
    {
      label: 'Purchaser',
      value: cycle.purchaserName,
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      label: 'Seller',
      value: cycle.sellerName,
      icon: <UserIcon className="h-4 w-4" />,
    },
  ];

  // Add negotiated price if exists
  if (cycle.negotiatedPrice && cycle.negotiatedPrice !== cycle.offerAmount) {
    metadata.splice(1, 0, {
      label: 'Negotiated',
      value: formatPKR(cycle.negotiatedPrice).replace('PKR ', ''),
      icon: <TrendingUp className="h-4 w-4" />,
    });
  }

  // Limit to 5 items
  const displayMetadata = metadata.slice(0, 5);

  const status = getStatusVariant();

  // Property title for display
  const propertyTitle = property ? formatPropertyAddress(property.address) : 'Address not set';
  const propertyType = property?.propertyType ? 
    property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1) : 
    'Property';

  return (
    <WorkspaceCard
      title={propertyTitle}
      subtitle={propertyType}
      image={property?.images?.[0]}
      imageFallback={<Home className="h-12 w-12 text-gray-400" />}
      status={status}
      metadata={displayMetadata}
      tags={tags.slice(0, 3)}
      footer={
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>
              {daysInCycle === 0 ? 'Today' : 
               daysInCycle === 1 ? '1 day' :
               `${daysInCycle} days`}
            </span>
          </div>
          <QuickActionMenu
            actions={[
              ...(onClick ? [{
                id: 'view',
                label: 'View Details',
                icon: <Eye className="h-4 w-4" />,
                onClick: onClick,
              }] : []),
              ...(onEdit ? [{
                id: 'edit',
                label: 'Edit',
                icon: <FileText className="h-4 w-4" />,
                onClick: onEdit,
              }] : []),
              ...(onDelete ? [{
                id: 'delete',
                label: 'Delete',
                icon: <FileText className="h-4 w-4" />,
                onClick: onDelete,
                variant: 'destructive' as const,
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