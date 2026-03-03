/**
 * SellCycleWorkspaceCard Component
 * Custom card for Sell Cycles Workspace
 * 
 * Uses WorkspaceCard with sell cycle-specific customization
 */

import React from 'react';
import { Property, SellCycle } from '../../types';
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
import { QuickActionMenu, QuickActionPresets } from '../workspace/QuickActionMenu';
import { Badge } from '../ui/badge';

export interface SellCycleWorkspaceCardProps {
  cycle: SellCycle;
  property?: Property | null;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  showSelection?: boolean;
}

/**
 * SellCycleWorkspaceCard - Custom card for sell cycle grid view
 */
export const SellCycleWorkspaceCard: React.FC<SellCycleWorkspaceCardProps> = ({
  cycle,
  property,
  isSelected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  onPublish,
  showSelection = true,
}) => {
  // Get status badge variant
  const getStatusVariant = (): { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'secondary' } => {
    switch (cycle.status) {
      case 'listed':
        return { label: 'Listed', variant: 'success' };
      case 'offer-received':
        return { label: 'Offer Received', variant: 'info' };
      case 'under-contract':
        return { label: 'Under Contract', variant: 'warning' };
      case 'sold-pending':
        return { label: 'Sold (Pending)', variant: 'warning' };
      case 'sold':
        return { label: 'Sold', variant: 'secondary' };
      case 'expired':
        return { label: 'Expired', variant: 'default' };
      case 'withdrawn':
        return { label: 'Withdrawn', variant: 'default' };
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

  // Get seller type label
  const getSellerTypeLabel = () => {
    const labels = {
      agency: 'Agency',
      client: 'Client',
      investor: 'Investor',
    };
    return labels[cycle.sellerType] || cycle.sellerType;
  };

  // Determine tags (max 3)
  const tags: Array<{ label: string; variant: 'default' | 'success' | 'info' | 'warning' }> = [];
  
  if (cycle.isPublished) {
    tags.push({ label: 'Published', variant: 'success' });
  }
  
  if (cycle.offers?.length > 0) {
    tags.push({ label: `${cycle.offers.length} Offer${cycle.offers.length > 1 ? 's' : ''}`, variant: 'info' });
  }
  
  if (cycle.acceptedOfferId) {
    tags.push({ label: 'Offer Accepted', variant: 'warning' });
  }

  // Calculate days since listing
  const getDaysSinceListing = () => {
    const listed = new Date(cycle.listedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - listed.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceListing = getDaysSinceListing();

  // Build metadata (max 5 items - Miller's Law)
  const metadata = [
    {
      label: 'Asking Price',
      value: formatPKR(cycle.askingPrice).replace('PKR ', ''),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Area',
      value: formatArea(),
      icon: <Ruler className="h-4 w-4" />,
    },
    {
      label: 'Seller',
      value: `${getSellerTypeLabel()} - ${cycle.sellerName}`,
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      label: 'Commission',
      value: cycle.commissionType === 'percentage' 
        ? `${cycle.commissionRate}%` 
        : formatPKR(cycle.commissionRate).replace('PKR ', ''),
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

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
      image={cycle.images?.[0] || property?.images?.[0]}
      imageFallback={<Home className="h-12 w-12 text-gray-400" />}
      status={status}
      metadata={displayMetadata}
      tags={tags.slice(0, 3)}
      footer={
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>
              {daysSinceListing === 0 ? 'Today' : 
               daysSinceListing === 1 ? '1 day ago' :
               `${daysSinceListing} days ago`}
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
              ...(onPublish && !cycle.isPublished ? [{
                id: 'publish',
                label: 'Publish',
                icon: <TrendingUp className="h-4 w-4" />,
                onClick: onPublish,
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