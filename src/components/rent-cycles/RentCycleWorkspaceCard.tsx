/**
 * RentCycleWorkspaceCard Component
 * Custom card for Rent Cycles Workspace V4
 * 
 * Uses WorkspaceCard with rent cycle-specific customization
 */

import React from 'react';
import { 
  Home, 
  MapPin, 
  Ruler, 
  DollarSign,
  User,
  Calendar,
  Clock,
  Tag,
  Eye,
  FileText,
  Users,
  Shield,
} from 'lucide-react';
import { RentCycle, Property } from '../../types';
import { WorkspaceCard } from '../workspace/cards/WorkspaceCard';
import { QuickActionMenu } from '../workspace/QuickActionMenu';
import { formatPKR } from '../../lib/currency';
import { formatPropertyAddressShort } from '../../lib/utils';

export interface RentCycleWorkspaceCardProps {
  cycle: RentCycle;
  property?: Property | null;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showSelection?: boolean;
}

/**
 * RentCycleWorkspaceCard - Custom card for rent cycle grid view
 */
export const RentCycleWorkspaceCard: React.FC<RentCycleWorkspaceCardProps> = ({
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
      case 'available':
        return { label: 'Available', variant: 'success' };
      case 'showing':
        return { label: 'Showing', variant: 'info' };
      case 'application-received':
        return { label: 'Application Received', variant: 'warning' };
      case 'leased':
        return { label: 'Leased', variant: 'success' };
      case 'active':
        return { label: 'Active', variant: 'success' };
      case 'renewal-pending':
        return { label: 'Renewal Pending', variant: 'warning' };
      case 'ending':
        return { label: 'Ending', variant: 'warning' };
      case 'ended':
        return { label: 'Ended', variant: 'secondary' };
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

  // Get landlord type label
  const getLandlordTypeLabel = () => {
    const labels = {
      agency: 'Agency',
      client: 'Client',
      investor: 'Investor',
    };
    return labels[cycle.landlordType] || cycle.landlordType;
  };

  // Calculate days until lease end (for active leases)
  const getDaysUntilLeaseEnd = () => {
    if (!cycle.leaseEndDate) return null;
    const endDate = new Date(cycle.leaseEndDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilEnd = getDaysUntilLeaseEnd();

  // Determine tags (max 3)
  const tags: Array<{ label: string; variant: 'default' | 'success' | 'info' | 'warning' }> = [];
  
  // Add landlord type tag
  tags.push({ 
    label: getLandlordTypeLabel(), 
    variant: cycle.landlordType === 'agency' ? 'info' : 
             cycle.landlordType === 'investor' ? 'warning' : 'default' 
  });
  
  // Add lease period tag
  if (cycle.leasePeriod) {
    tags.push({ 
      label: `${cycle.leasePeriod} months`, 
      variant: 'default' 
    });
  }
  
  // Add active tenant or applications tag
  if (cycle.currentTenantName) {
    tags.push({ label: 'Occupied', variant: 'success' });
  } else if (cycle.applications && cycle.applications.length > 0) {
    const pendingApps = cycle.applications.filter(app => app.status === 'pending').length;
    if (pendingApps > 0) {
      tags.push({ label: `${pendingApps} Application${pendingApps > 1 ? 's' : ''}`, variant: 'warning' });
    }
  }

  // Build metadata (max 5 items - Miller's Law)
  const metadata = [
    {
      label: 'Monthly Rent',
      value: formatPKR(cycle.monthlyRent).replace('PKR ', ''),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Security Deposit',
      value: formatPKR(cycle.securityDeposit).replace('PKR ', ''),
      icon: <Shield className="h-4 w-4" />,
    },
    {
      label: 'Area',
      value: formatArea(),
      icon: <Ruler className="h-4 w-4" />,
    },
  ];

  // Add tenant or landlord based on status
  if (cycle.currentTenantName) {
    metadata.push({
      label: 'Tenant',
      value: cycle.currentTenantName,
      icon: <User className="h-4 w-4" />,
    });
  } else {
    metadata.push({
      label: 'Landlord',
      value: cycle.landlordName,
      icon: <Users className="h-4 w-4" />,
    });
  }

  // Add available from date for available properties
  if (cycle.status === 'available' && cycle.availableFrom) {
    metadata.push({
      label: 'Available From',
      value: new Date(cycle.availableFrom).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      icon: <Calendar className="h-4 w-4" />,
    });
  }

  // Limit to 5 items
  const displayMetadata = metadata.slice(0, 5);

  const status = getStatusVariant();

  // Property title for display
  const propertyTitle = property ? formatPropertyAddressShort(property.address) : 'Property';
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
            {daysUntilEnd !== null && daysUntilEnd > 0 ? (
              <>
                <Clock className="h-3 w-3" />
                <span>
                  {daysUntilEnd === 1 ? '1 day left' : `${daysUntilEnd} days left`}
                </span>
              </>
            ) : cycle.leaseStartDate ? (
              <>
                <Calendar className="h-3 w-3" />
                <span>
                  Since {new Date(cycle.leaseStartDate).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3" />
                <span>
                  {cycle.leasePeriod} month lease
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