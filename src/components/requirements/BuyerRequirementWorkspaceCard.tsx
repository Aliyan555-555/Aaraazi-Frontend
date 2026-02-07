/**
 * BuyerRequirementWorkspaceCard Component
 * Custom card for Buyer Requirements Workspace V4
 * 
 * Uses WorkspaceCard with buyer requirement-specific customization
 */

import React from 'react';
import { 
  Home, 
  MapPin, 
  DollarSign,
  User,
  Calendar,
  TrendingUp,
  Tag,
  Eye,
  FileText,
  Search,
  CheckCircle,
} from 'lucide-react';
import { BuyerRequirement } from '../../types';
import { WorkspaceCard } from '../workspace/cards/WorkspaceCard';
import { QuickActionMenu } from '../workspace/QuickActionMenu';
import { formatPKR } from '../../lib/currency';

export interface BuyerRequirementWorkspaceCardProps {
  requirement: BuyerRequirement;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showSelection?: boolean;
}

/**
 * BuyerRequirementWorkspaceCard - Custom card for buyer requirement grid view
 */
export const BuyerRequirementWorkspaceCard: React.FC<BuyerRequirementWorkspaceCardProps> = ({
  requirement,
  isSelected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  showSelection = true,
}) => {
  // Get status badge variant
  const getStatusVariant = (): { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'secondary' } => {
    switch (requirement.status) {
      case 'active':
        return { label: 'Active', variant: 'success' };
      case 'matched':
        return { label: 'Matched', variant: 'warning' };
      case 'closed':
        return { label: 'Closed', variant: 'secondary' };
      default:
        return { label: requirement.status, variant: 'default' };
    }
  };

  // Get urgency label
  const getUrgencyLabel = () => {
    const labels = {
      low: 'Low Priority',
      medium: 'Medium Priority',
      high: 'Urgent',
    };
    return labels[requirement.urgency] || requirement.urgency;
  };

  // Get urgency variant
  const getUrgencyVariant = (): 'default' | 'success' | 'info' | 'warning' => {
    switch (requirement.urgency) {
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  // Determine tags (max 3)
  const tags: Array<{ label: string; variant: 'default' | 'success' | 'info' | 'warning' }> = [];
  
  // Add urgency tag
  tags.push({ 
    label: getUrgencyLabel(), 
    variant: getUrgencyVariant()
  });
  
  // Add financing tag
  if (requirement.financingType === 'cash') {
    tags.push({ label: 'Cash Buyer', variant: 'success' });
  } else if (requirement.preApproved) {
    tags.push({ label: 'Pre-approved', variant: 'success' });
  } else if (requirement.financingType === 'loan') {
    tags.push({ label: 'Loan', variant: 'info' });
  }
  
  // Add matched properties tag
  if (requirement.matchedProperties && requirement.matchedProperties.length > 0) {
    tags.push({ 
      label: `${requirement.matchedProperties.length} Match${requirement.matchedProperties.length > 1 ? 'es' : ''}`, 
      variant: 'warning' 
    });
  }

  // Build metadata (max 5 items - Miller's Law)
  const metadata = [
    {
      label: 'Budget Range',
      value: `${formatPKR(requirement.minBudget).replace('PKR ', '')} - ${formatPKR(requirement.maxBudget).replace('PKR ', '')}`,
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Buyer',
      value: requirement.buyerName,
      icon: <User className="h-4 w-4" />,
    },
    {
      label: 'Bedrooms',
      value: requirement.maxBedrooms 
        ? `${requirement.minBedrooms}-${requirement.maxBedrooms}` 
        : `${requirement.minBedrooms}+`,
      icon: <Home className="h-4 w-4" />,
    },
  ];

  // Add property types
  if (requirement.propertyTypes && requirement.propertyTypes.length > 0) {
    metadata.push({
      label: 'Types',
      value: requirement.propertyTypes.slice(0, 2).join(', '),
      icon: <Tag className="h-4 w-4" />,
    });
  }

  // Add preferred locations
  if (requirement.preferredLocations && requirement.preferredLocations.length > 0) {
    metadata.push({
      label: 'Locations',
      value: requirement.preferredLocations.slice(0, 2).join(', '),
      icon: <MapPin className="h-4 w-4" />,
    });
  }

  // Limit to 5 items
  const displayMetadata = metadata.slice(0, 5);

  const status = getStatusVariant();

  // Title based on buyer name or property types
  const title = requirement.buyerName;
  const subtitle = requirement.propertyTypes && requirement.propertyTypes.length > 0
    ? requirement.propertyTypes.join(', ')
    : 'Property Search';

  return (
    <WorkspaceCard
      title={title}
      subtitle={subtitle}
      imageFallback={<Search className="h-12 w-12 text-gray-400" />}
      status={status}
      metadata={displayMetadata}
      tags={tags.slice(0, 3)}
      footer={
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            {requirement.targetMoveDate ? (
              <>
                <Calendar className="h-3 w-3" />
                <span>
                  Target: {new Date(requirement.targetMoveDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3" />
                <span>
                  Created {new Date(requirement.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            )}
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
