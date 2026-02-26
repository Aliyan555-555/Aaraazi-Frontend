/**
 * PropertyWorkspaceCard Component
 * Custom card for Properties Workspace V4
 * 
 * Uses WorkspaceCard with property-specific customization
 */

import React from 'react';
import {
  Home,
  MapPin,
  Ruler,
  Bed,
  Bath,
  DollarSign,
  User,
  Calendar
} from 'lucide-react';
import { Property } from '../../types';
import { WorkspaceCard } from '../workspace/cards/WorkspaceCard';
import { QuickActionMenu, QuickActionPresets } from '../workspace/QuickActionMenu';
import { formatPKR } from '../../lib/currency';
import { formatPropertyAddressShort } from '../../lib/utils';
import { Badge } from '../ui/badge';

export interface PropertyWorkspaceCardProps {
  property: Property;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onSubmitOffer?: () => void;
  showSelection?: boolean;
}

/**
 * PropertyWorkspaceCard - Custom card for property grid view
 */
export const PropertyWorkspaceCard: React.FC<PropertyWorkspaceCardProps> = ({
  property,
  isSelected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  onShare,
  onSubmitOffer,
  showSelection = true,
}) => {
  // Get active cycle status for display
  const getPropertyStatus = (): { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'secondary' } => {
    if ((property.activeSellCycleIds?.length || 0) > 0) {
      return { label: 'For Sale', variant: 'success' };
    }
    if ((property.activeRentCycleIds?.length || 0) > 0) {
      return { label: 'For Rent', variant: 'info' };
    }
    if ((property.activePurchaseCycleIds?.length || 0) > 0) {
      return { label: 'In Acquisition', variant: 'warning' };
    }
    return { label: 'Available', variant: 'secondary' };
  };

  // Format area with unit
  const formatArea = () => {
    const unitLabels: Record<string, string> = {
      sqft: 'sq ft', 'sq-feet': 'sq ft', SQFT: 'sq ft',
      sqyards: 'sq yd', 'sq-yards': 'sq yd', SQYARDS: 'sq yd',
      marla: 'marla', MARLA: 'marla',
      kanal: 'kanal', KANAL: 'kanal',
      acres: 'acres', ACRE: 'acres'
    };
    return `${property.area} ${unitLabels[property.areaUnit] || property.areaUnit}`;
  };

  // Get property type label
  const getPropertyTypeLabel = () => {
    const typeLabels = {
      house: 'House',
      apartment: 'Apartment',
      plot: 'Plot',
      commercial: 'Commercial',
      land: 'Land',
      industrial: 'Industrial',
    };
    return typeLabels[property.propertyType] || property.propertyType;
  };

  // Determine tags - show all features as tags with light green style
  const tags: Array<{ label: string; variant: 'default' | 'success' | 'info' | 'warning' }> = [];

  // Add all features as tags (all will use the same light green style)
  if (property.features && Array.isArray(property.features) && property.features.length > 0) {
    property.features.forEach((feature) => {
      if (feature && typeof feature === 'string') {
        // All features use the same style (light green) as shown in the design
        tags.push({ label: feature, variant: 'default' });
      }
    });
  }

  // Add internal listing tag if applicable
  if (property.isInternalListing && !tags.some(t => t.label.toLowerCase().includes('internal'))) {
    tags.push({ label: 'Internal', variant: 'default' });
  }

  // Calculate days since listing (from createdAt)
  const getDaysSinceListing = () => {
    const created = new Date(property.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceListing = getDaysSinceListing();

  // Build metadata (max 5 items - Miller's Law)
  const metadata = [
    {
      label: 'Area',
      value: formatArea(),
      icon: <Ruler className="h-4 w-4" />,
    },
  ];

  // Add bedrooms if exists
  if (property.bedrooms) {
    metadata.push({
      label: 'Bedrooms',
      value: property.bedrooms.toString(),
      icon: <Bed className="h-4 w-4" />,
    });
  }

  // Add bathrooms if exists
  if (property.bathrooms) {
    metadata.push({
      label: 'Bathrooms',
      value: property.bathrooms.toString(),
      icon: <Bath className="h-4 w-4" />,
    });
  }

  // Add owner
  metadata.push({
    label: 'Owner',
    value: property.currentOwnerName || 'Unknown',
    icon: <User className="h-4 w-4" />,
  });

  // Limit to 5 items
  const displayMetadata = metadata.slice(0, 5);

  const status = getPropertyStatus();

  return (
    <WorkspaceCard
      title={formatPropertyAddressShort(property.address)}
      subtitle={getPropertyTypeLabel()}
      image={property.images?.[0]}
      imageFallback={<Home className="h-12 w-12 text-gray-400" />}
      status={status}
      metadata={displayMetadata}
      tags={tags}
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
            actions={QuickActionPresets.property({
              onView: onClick,
              onEdit: onEdit,
              onShare: onShare,
              onSubmitOffer: onSubmitOffer,
              onDelete: onDelete,
            })}
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
