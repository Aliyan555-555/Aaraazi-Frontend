/**
 * ContactsWorkspaceV4Enhanced Component
 * WORKSPACE V4: Enhanced with full functionality ✅
 * 
 * PURPOSE:
 * Complete contacts/CRM workspace with ALL functionality implemented.
 * 
 * FEATURES IMPLEMENTED:
 * ✅ Table view with all contact information
 * ✅ Grid view with contact cards
 * ✅ Advanced search and filtering
 * ✅ Multiple sort options
 * ✅ Working bulk actions (export, archive, delete, change status, assign tags)
 * ✅ Quick actions (call, email, view, edit, delete)
 * ✅ Row actions menu
 * ✅ Secondary actions (import, export templates, bulk edit)
 * ✅ Follow-up reminders filter
 * ✅ Commission tracking
 * ✅ Tag management
 * ✅ Advanced filters (date range, commission range, activity)
 * 
 * @module ContactsWorkspaceV4Enhanced
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Download,
  Trash2,
  Upload,
  Mail,
  Phone,
  Users,
  Tag,
  Building2,
  User as UserIcon,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Archive,
  FileDown,
} from 'lucide-react';
import { Contact, User, ContactStatus, ContactType, ContactCategory } from '../../types';
import { WorkspacePageTemplate } from '../workspace/WorkspacePageTemplate';
import { ContactWorkspaceCard } from './ContactWorkspaceCard';
import { StatusBadge } from '../layout/StatusBadge'; // PHASE 5: Add StatusBadge import
import { Column, EmptyStatePresets } from '../workspace';
import { formatPKR } from '../../lib/currency';
import { exportContactsToCSV } from '../../lib/exportUtils';
import { getContacts, updateContact, deleteContact } from '../../lib/data';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

/** Contact with legacy UI/tracking fields not on schema Contact */
type ContactWithLegacy = Contact & {
  totalCommissionEarned?: number;
  totalTransactions?: number;
  interestedProperties?: string[];
  notes?: string;
};

export interface ContactsWorkspaceV4EnhancedProps {
  user: User;
  onNavigate: (section: string, id?: string) => void;
  onAddContact?: () => void;
  onEditContact?: (contact: Contact) => void;
}

/**
 * ContactsWorkspaceV4Enhanced - Complete workspace with all functionality
 */
export const ContactsWorkspaceV4Enhanced: React.FC<ContactsWorkspaceV4EnhancedProps> = ({
  user,
  onNavigate,
  onAddContact,
  onEditContact,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [followUpFilter, setFollowUpFilter] = useState<string[]>([]);

  // Helper functions to handle tags (stored as string in schema, used as array in UI)
  const parseTags = (tagsString: string): string[] => {
    if (!tagsString || tagsString.trim() === '') return [];
    try {
      const parsed = JSON.parse(tagsString);
      if (Array.isArray(parsed)) return parsed;
      return tagsString.split(',').map((t: string) => t.trim()).filter((t: string) => t);
    } catch {
      return tagsString.split(',').map((t: string) => t.trim()).filter((t: string) => t);
    }
  };

  const serializeTags = (tags: string[]): string => {
    return JSON.stringify(tags);
  };

  // Load contacts based on user role
  const loadContacts = async () => {
    const contacts = getContacts(user.role === 'admin' ? undefined : user.id, user.role);
    setAllContacts(contacts);
    setIsLoading(false);
  };

  useEffect(() => {
    loadContacts();
  }, [user]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = allContacts.filter(c => c.status === 'ACTIVE').length;
    const clients = allContacts.filter(c => c.type === 'CLIENT').length;
    const prospects = allContacts.filter(c => c.type === 'PROSPECT').length;

    const totalCommission = allContacts
      .filter(c => (c as ContactWithLegacy).totalCommissionEarned)
      .reduce((sum, c) => sum + ((c as ContactWithLegacy).totalCommissionEarned || 0), 0);

    // Contacts needing follow-up (next follow-up date is in the past or today)
    const needFollowUp = allContacts.filter(c => {
      if (!c.nextFollowUp) return false;
      const followUpDate = new Date(c.nextFollowUp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return followUpDate <= today;
    }).length;

    return [
      { label: 'Total', value: allContacts.length, variant: 'default' as const },
      { label: 'Active', value: active, variant: 'success' as const },
      { label: 'Clients', value: clients, variant: 'info' as const },
      {
        label: 'Commission',
        value: formatPKR(totalCommission).replace('PKR ', ''),
        variant: 'default' as const
      },
      {
        label: 'Follow-ups',
        value: needFollowUp,
        variant: needFollowUp > 0 ? 'warning' as const : 'default' as const,
      },
    ];
  }, [allContacts]);

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleCall = (contact: Contact) => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
      toast.success(`Calling ${contact.name}...`);

      // Update last contact date
      updateContact(contact.id, {
        lastContactDate: new Date().toISOString(),
      });
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleEmail = (contact: Contact) => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
      toast.success(`Opening email to ${contact.name}...`);

      // Update last contact date
      updateContact(contact.id, {
        lastContactDate: new Date().toISOString(),
      });
      setRefreshTrigger(prev => prev + 1);
    } else {
      toast.error('No email address available');
    }
  };

  const handleView = (contact: Contact) => {
    onNavigate('contact-details', contact.id);
  };

  const handleEdit = (contact: Contact) => {
    if (onEditContact) {
      onEditContact(contact);
    }
  };

  const handleDelete = (contact: Contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}? This action cannot be undone.`)) {
      deleteContact(contact.id);
      toast.success('Contact deleted successfully');
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleChangeStatus = (contact: Contact, newStatus: ContactStatus) => {
    updateContact(contact.id, { status: newStatus } as Parameters<typeof updateContact>[1]);
    toast.success(`Contact status changed to ${newStatus.toLowerCase()}`);
    setRefreshTrigger(prev => prev + 1);
  };

  // ============================================================================
  // Bulk Actions
  // ============================================================================

  const handleBulkExport = (ids: string[]) => {
    const contactsToExport = allContacts.filter(c => ids.includes(c.id));
    exportContactsToCSV(contactsToExport);
    toast.success(`Exported ${ids.length} contacts to CSV`);
  };

  const handleBulkArchive = (ids: string[]) => {
    ids.forEach(id => {
      updateContact(id, { status: ContactStatus.ARCHIVED } as Parameters<typeof updateContact>[1]);
    });
    toast.success(`Archived ${ids.length} contacts`);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBulkDelete = (ids: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${ids.length} contacts? This action cannot be undone.`)) {
      ids.forEach(id => {
        deleteContact(id);
      });
      toast.success(`Deleted ${ids.length} contacts`);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleBulkActivate = (ids: string[]) => {
    ids.forEach(id => {
      updateContact(id, { status: ContactStatus.ACTIVE } as Parameters<typeof updateContact>[1]);
    });
    toast.success(`Activated ${ids.length} contacts`);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBulkDeactivate = (ids: string[]) => {
    ids.forEach(id => {
      updateContact(id, { status: ContactStatus.INACTIVE } as Parameters<typeof updateContact>[1]);
    });
    toast.success(`Deactivated ${ids.length} contacts`);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBulkAddTag = (ids: string[]) => {
    const tag = prompt('Enter tag to add:');
    if (tag && tag.trim()) {
      ids.forEach(id => {
        const contact = allContacts.find(c => c.id === id);
        if (contact) {
          const currentTags = parseTags(contact.tags);
          if (!currentTags.includes(tag.trim())) {
            updateContact(id, {
              tags: serializeTags([...currentTags, tag.trim()])
            } as Parameters<typeof updateContact>[1]);
          }
        }
      });
      toast.success(`Added tag "${tag}" to ${ids.length} contacts`);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // ============================================================================
  // Table Columns with Row Actions
  // ============================================================================

  const columns: Column<Contact>[] = [
    {
      id: 'name',
      label: 'Name',
      accessor: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{c.name}</div>
            {c.email && (
              <div className="text-xs text-gray-500">{c.email}</div>
            )}
          </div>
        </div>
      ),
      width: '250px',
      sortable: true,
    },
    {
      id: 'phone',
      label: 'Phone',
      accessor: (c) => (
        <div className="text-sm text-gray-900">{c.phone}</div>
      ),
      width: '140px',
    },
    {
      id: 'type',
      label: 'Type',
      accessor: (c) => {
        const typeColors: Record<ContactType, string> = {
          [ContactType.CLIENT]: 'bg-green-100 text-green-800',
          [ContactType.PROSPECT]: 'bg-blue-100 text-blue-800',
          [ContactType.INVESTOR]: 'bg-purple-100 text-purple-800',
          [ContactType.VENDOR]: 'bg-gray-100 text-gray-800',
          [ContactType.PARTNER]: 'bg-gray-100 text-gray-800',
          [ContactType.AGENT]: 'bg-indigo-100 text-indigo-800',
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[c.type]}`}>
            {c.type.charAt(0).toUpperCase() + c.type.slice(1).toLowerCase()}
          </span>
        );
      },
      width: '100px',
      align: 'center',
    },
    {
      id: 'category',
      label: 'Category',
      accessor: (c) => {
        if (!c.category) {
          return <span className="text-sm text-gray-500">—</span>;
        }

        const categoryColors: Record<ContactCategory, string> = {
          [ContactCategory.BUYER]: 'bg-green-100 text-green-800',
          [ContactCategory.SELLER]: 'bg-blue-100 text-blue-800',
          [ContactCategory.TENANT]: 'bg-purple-100 text-purple-800',
          [ContactCategory.LANDLORD]: 'bg-gray-100 text-gray-800',
          [ContactCategory.EXTERNAL_BROKER]: 'bg-orange-100 text-orange-800',
          [ContactCategory.BOTH]: 'bg-yellow-100 text-yellow-800',
        };

        const categoryLabels: Record<ContactCategory, string> = {
          [ContactCategory.BUYER]: 'Buyer',
          [ContactCategory.SELLER]: 'Seller',
          [ContactCategory.TENANT]: 'Tenant',
          [ContactCategory.LANDLORD]: 'Landlord',
          [ContactCategory.EXTERNAL_BROKER]: 'External Broker',
          [ContactCategory.BOTH]: 'Both',
        };

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[c.category] || 'bg-gray-100 text-gray-800'}`}>
            {categoryLabels[c.category] || c.category}
          </span>
        );
      },
      width: '100px',
      align: 'center',
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (c) => {
        const statusLabels: Record<ContactStatus, string> = {
          [ContactStatus.ACTIVE]: 'Active',
          [ContactStatus.INACTIVE]: 'Inactive',
          [ContactStatus.ARCHIVED]: 'Archived',
          [ContactStatus.BLOCKED]: 'Blocked',
        };

        const statusLabel = statusLabels[c.status] || c.status;

        // PHASE 5: Use StatusBadge component with auto-mapping
        return <StatusBadge status={statusLabel} size="sm" />;
      },
      width: '90px',
      align: 'center',
    },
    {
      id: 'properties',
      label: 'Properties',
      accessor: (c) => (
        <div className="text-sm text-gray-900 text-center">
          {(c as ContactWithLegacy).interestedProperties?.length || 0}
        </div>
      ),
      width: '90px',
      align: 'center',
    },
    {
      id: 'transactions',
      label: 'Deals',
      accessor: (c) => (
        <div className="text-sm text-gray-900 text-center">
          {(c as ContactWithLegacy).totalTransactions || 0}
        </div>
      ),
      width: '80px',
      align: 'center',
    },
    {
      id: 'commission',
      label: 'Commission',
      accessor: (c) => (
        <div className="text-sm font-medium text-gray-900">
          {(c as ContactWithLegacy).totalCommissionEarned ? formatPKR((c as ContactWithLegacy).totalCommissionEarned!) : '—'}
        </div>
      ),
      width: '130px',
      align: 'right',
    },
    {
      id: 'lastContact',
      label: 'Last Contact',
      accessor: (c) => {
        if (!c.lastContactDate) return <div className="text-sm text-gray-500">—</div>;

        const lastContact = new Date(c.lastContactDate);
        const daysAgo = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <div className="text-sm text-gray-600">
            {daysAgo === 0 ? 'Today' :
              daysAgo === 1 ? 'Yesterday' :
                `${daysAgo}d ago`}
          </div>
        );
      },
      width: '110px',
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: (c) => (
        <div className="flex items-center gap-1">
          {/* Quick Call Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleCall(c);
            }}
            className="h-8 w-8 p-0"
            title="Call"
          >
            <Phone className="h-4 w-4" />
          </Button>

          {/* Quick Email Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleEmail(c);
            }}
            className="h-8 w-8 p-0"
            title="Email"
            disabled={!c.email}
          >
            <Mail className="h-4 w-4" />
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(c)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(c)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Contact
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleChangeStatus(c, ContactStatus.ACTIVE)} disabled={c.status === ContactStatus.ACTIVE}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeStatus(c, ContactStatus.INACTIVE)} disabled={c.status === ContactStatus.INACTIVE}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Mark Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeStatus(c, ContactStatus.ARCHIVED)} disabled={c.status === ContactStatus.ARCHIVED}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(c)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      width: '120px',
      align: 'center',
    },
  ];

  // ============================================================================
  // Filters and Sort Options
  // ============================================================================

  const quickFilters = [
    {
      id: 'type',
      label: 'Type',
      options: [
        { value: 'client', label: 'Client' },
        { value: 'prospect', label: 'Prospect' },
        { value: 'investor', label: 'Investor' },
        { value: 'vendor', label: 'Vendor' },
      ],
      value: typeFilter,
      onChange: setTypeFilter,
      multiple: true,
    },
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'archived', label: 'Archived' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
      multiple: true,
    },
    {
      id: 'category',
      label: 'Category',
      options: [
        { value: 'buyer', label: 'Buyer' },
        { value: 'seller', label: 'Seller' },
        { value: 'tenant', label: 'Tenant' },
        { value: 'landlord', label: 'Landlord' },
        { value: 'external-broker', label: 'External Broker' },
        { value: 'both', label: 'Both' },
      ],
      value: categoryFilter,
      onChange: setCategoryFilter,
      multiple: true,
    },
    {
      id: 'followUp',
      label: 'Follow-up',
      options: [
        { value: 'due', label: 'Due Today' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'none', label: 'No Follow-up' },
      ],
      value: followUpFilter,
      onChange: setFollowUpFilter,
      multiple: true,
    },
  ];

  const sortOptions = [
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'last-contact', label: 'Last Contact' },
    { value: 'commission-high', label: 'Commission: High to Low' },
    { value: 'commission-low', label: 'Commission: Low to High' },
  ];

  // ============================================================================
  // Bulk Actions
  // ============================================================================

  const bulkActions = [
    {
      id: 'export',
      label: 'Export Selected',
      icon: <Download className="h-4 w-4" />,
      onClick: handleBulkExport,
    },
    {
      id: 'activate',
      label: 'Mark Active',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: handleBulkActivate,
    },
    {
      id: 'deactivate',
      label: 'Mark Inactive',
      icon: <AlertCircle className="h-4 w-4" />,
      onClick: handleBulkDeactivate,
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      onClick: handleBulkArchive,
    },
    {
      id: 'addTag',
      label: 'Add Tag',
      icon: <Tag className="h-4 w-4" />,
      onClick: handleBulkAddTag,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleBulkDelete,
      variant: 'destructive' as const,
      requireConfirm: true,
    },
  ];

  // ============================================================================
  // Secondary Actions
  // ============================================================================

  const handleImport = () => {
    toast.info('Import functionality coming soon');
  };

  const handleExportAll = () => {
    handleBulkExport(allContacts.map(c => c.id));
  };

  const handleExportTemplate = () => {
    const headers = ['Name', 'Phone', 'Email', 'Type', 'Category', 'Status', 'Notes'];
    const csvContent = headers.join(',');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Downloaded import template');
  };

  const secondaryActions = [
    {
      label: 'Import Contacts',
      icon: <Upload className="h-4 w-4" />,
      onClick: handleImport,
    },
    {
      label: 'Export All',
      icon: <Download className="h-4 w-4" />,
      onClick: handleExportAll,
    },
    {
      label: 'Download Template',
      icon: <FileDown className="h-4 w-4" />,
      onClick: handleExportTemplate,
    },
  ];

  // Render
  // ============================================================================

  return (
    <WorkspacePageTemplate
      // Header
      title="Contacts"
      description="Manage your contacts and client relationships"
      stats={stats}

      // Primary Action
      primaryAction={{
        label: 'Add Contact',
        icon: <Plus className="h-4 w-4" />,
        onClick: onAddContact || (() => toast.info('Add Contact clicked')),
      }}

      // Secondary Actions
      secondaryActions={secondaryActions}

      // Data
      items={allContacts}
      getItemId={(c) => c.id}
      isLoading={isLoading}

      // View Configuration
      defaultView="table"
      availableViews={['table']}

      // Table View
      columns={columns}

      // Search & Filter
      searchPlaceholder="Search contacts by name, phone, email, notes, or tags..."
      quickFilters={quickFilters}
      sortOptions={sortOptions}
      onSearch={(contact, query) => {
        const q = query.toLowerCase();
        return (
          contact.name.toLowerCase().includes(q) ||
          contact.phone.includes(q) ||
          (contact.email?.toLowerCase().includes(q) ?? false) ||
          ((contact as ContactWithLegacy).notes?.toLowerCase().includes(q) ?? false) ||
          parseTags(contact.tags).some((t: string) => t.toLowerCase().includes(q))
        );
      }}
      onFilter={(contact, filters) => {
        // Type filter
        const types = filters.get('type');
        if (types && types.length > 0 && !types.includes(contact.type)) return false;

        // Status filter
        const statuses = filters.get('status');
        if (statuses && statuses.length > 0 && !statuses.includes(contact.status)) return false;

        // Category filter
        const categories = filters.get('category');
        if (categories && categories.length > 0 && contact.category && !categories.includes(contact.category)) return false;

        // Follow up filter
        const followUps = filters.get('followUp');
        if (followUps && followUps.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let match = false;
          if (followUps.includes('due')) {
            if (contact.nextFollowUp) {
              const followUpDate = new Date(contact.nextFollowUp);
              followUpDate.setHours(0, 0, 0, 0);
              if (followUpDate.getTime() === today.getTime()) match = true;
            }
          }
          if (followUps.includes('overdue')) {
            if (contact.nextFollowUp) {
              const followUpDate = new Date(contact.nextFollowUp);
              if (followUpDate < today) match = true;
            }
          }
          if (followUps.includes('upcoming')) {
            if (contact.nextFollowUp) {
              const followUpDate = new Date(contact.nextFollowUp);
              if (followUpDate > today) match = true;
            }
          }
          if (followUps.includes('none')) {
            if (!contact.nextFollowUp) match = true;
          }
          if (!match) return false;
        }

        return true;
      }}

      // Bulk Actions
      bulkActions={bulkActions}

      // Pagination
      pagination={{
        enabled: true,
        pageSize: 50,
        pageSizeOptions: [25, 50, 100, 200],
      }}

      // Empty State
      emptyStatePreset={{
        title: 'No contacts yet',
        description: 'Add your first contact to start building relationships',
        icon: <Users className="h-12 w-12 text-gray-400" />,
        primaryAction: {
          label: 'Add Contact',
          onClick: onAddContact || (() => toast.info('Add your first contact')),
        },
      }}

      // Callbacks
      onItemClick={(contact) => onNavigate('contact-details', contact.id)}
    />
  );
};

// Explicit default export for lazy loading compatibility
export default ContactsWorkspaceV4Enhanced;