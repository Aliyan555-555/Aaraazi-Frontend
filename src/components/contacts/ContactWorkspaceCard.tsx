/**
 * ContactWorkspaceCard Component
 * Custom card for Contacts Workspace - Grid View
 * 
 * Uses WorkspaceCard with contact-specific customization
 */

import React from 'react';
import {
  User,
  Mail,
  Phone,
  Tag,
  Calendar,
  Building2,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { Contact, ContactType, ContactStatus } from '../../types';
import { WorkspaceCard } from '../workspace/cards/WorkspaceCard';
import { QuickActionMenu } from '../workspace/QuickActionMenu';
import { formatPKR } from '../../lib/currency';

/** Contact with legacy UI/tracking fields not on schema Contact */
type ContactWithLegacy = Contact & {
  totalCommissionEarned?: number;
  totalTransactions?: number;
  interestedProperties?: string[];
};

export interface ContactWorkspaceCardProps {
  contact: Contact;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showSelection?: boolean;
}

/**
 * ContactWorkspaceCard - Custom card for contact grid view
 */
export const ContactWorkspaceCard: React.FC<ContactWorkspaceCardProps> = ({
  contact,
  isSelected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  showSelection = true,
}) => {
  // Get contact type badge
  const getTypeBadge = (): { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'secondary' } => {
    switch (contact.type) {
      case ContactType.CLIENT:
        return { label: 'Client', variant: 'success' };
      case ContactType.PROSPECT:
        return { label: 'Prospect', variant: 'info' };
      case ContactType.INVESTOR:
        return { label: 'Investor', variant: 'warning' };
      case ContactType.VENDOR:
        return { label: 'Vendor', variant: 'secondary' };
      case ContactType.PARTNER:
        return { label: 'Partner', variant: 'secondary' };
      default:
        return { label: contact.type, variant: 'default' };
    }
  };

  // Get status badge
  const getStatusBadge = (): { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'secondary' } => {
    switch (contact.status) {
      case ContactStatus.ACTIVE:
        return { label: 'Active', variant: 'success' };
      case ContactStatus.INACTIVE:
        return { label: 'Inactive', variant: 'secondary' };
      case ContactStatus.ARCHIVED:
        return { label: 'Archived', variant: 'warning' };
      case ContactStatus.BLOCKED:
        return { label: 'Blocked', variant: 'warning' };
      default:
        return { label: contact.status, variant: 'default' };
    }
  };

  // Cast contact to legacy type for UI-specific fields
  const legacy = contact as ContactWithLegacy;

  // Build tags (max 3 - Miller's Law)
  const tags: Array<{ label: string; variant: 'default' | 'success' | 'info' | 'warning' | 'secondary' }> = [];

  const typeBadge = getTypeBadge();
  tags.push({ label: typeBadge.label, variant: typeBadge.variant });

  if (contact.category) {
    const categoryLabel = contact.category.charAt(0).toUpperCase() + contact.category.slice(1).toLowerCase().replace('_', ' ');
    tags.push({ label: categoryLabel, variant: 'info' });
  }

  if (legacy.totalTransactions && legacy.totalTransactions > 0) {
    tags.push({ label: `${legacy.totalTransactions} deals`, variant: 'success' });
  }

  // Build metadata (max 5 items - Miller's Law)
  const metadata = [];

  if (contact.phone) {
    metadata.push({
      label: 'Phone',
      value: contact.phone,
      icon: <Phone className="h-4 w-4" />,
    });
  }

  if (contact.email) {
    metadata.push({
      label: 'Email',
      value: contact.email,
      icon: <Mail className="h-4 w-4" />,
    });
  }

  if (legacy.interestedProperties && legacy.interestedProperties.length > 0) {
    metadata.push({
      label: 'Properties',
      value: `${legacy.interestedProperties.length} interested`,
      icon: <Building2 className="h-4 w-4" />,
    });
  }

  if (legacy.totalCommissionEarned && legacy.totalCommissionEarned > 0) {
    metadata.push({
      label: 'Commission',
      value: formatPKR(legacy.totalCommissionEarned),
      icon: <TrendingUp className="h-4 w-4" />,
    });
  }

  if (contact.lastContactDate) {
    const lastContact = new Date(contact.lastContactDate);
    const daysAgo = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    metadata.push({
      label: 'Last Contact',
      value: daysAgo === 0 ? 'Today' : `${daysAgo}d ago`,
      icon: <Calendar className="h-4 w-4" />,
    });
  }

  // Limit to 5 items
  const displayMetadata = metadata.slice(0, 5);

  const status = getStatusBadge();

  return (
    <WorkspaceCard
      title={contact.name}
      subtitle={contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
      imageFallback={<User className="h-12 w-12 text-gray-400" />}
      status={status}
      metadata={displayMetadata}
      tags={tags.slice(0, 3)}
      footer={
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(contact.createdAt).toLocaleDateString('en-US', {
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
                icon: <UserCheck className="h-4 w-4" />,
                onClick: onClick || (() => { }),
              },
              ...(onEdit ? [{
                id: 'edit',
                label: 'Edit',
                icon: <User className="h-4 w-4" />,
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
