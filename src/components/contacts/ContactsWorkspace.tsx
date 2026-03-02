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
import { User } from '../../types';
import { ContactStatus, ContactType, ContactCategory } from '@/types/schema';
import { WorkspacePageTemplate } from '../workspace/WorkspacePageTemplate';
import { ContactWorkspaceCard } from './ContactWorkspaceCard';
import { ContactCard } from '../layout/ContactCard';
import { StatusBadge } from '../layout/StatusBadge'; // PHASE 5: Add StatusBadge import
import { Column, EmptyStatePresets } from '../workspace';
import { formatPKR } from '../../lib/currency';
import { exportContactsToCSV } from '../../lib/exportUtils';
import { useAuthStore } from '../../store/useAuthStore';
import { useContacts, useUpdateContact, useDeleteContact, useBulkUpdateContacts, useBulkDeleteContacts } from '../../hooks/useContacts';
import { mapApiContactToUIContact, type UIContact } from './mappers/contact.mappers';
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
import { ContactFormModal } from '../ContactFormModal';

/** Contact with legacy UI/tracking fields for display */
type ContactWithLegacy = UIContact & {
  totalCommissionEarned?: number;
  totalTransactions?: number;
  interestedProperties?: string[];
  notes?: string;
};

/** Alias for handlers - accepts UIContact (has id, etc.) */
type ContactForHandlers = UIContact;

export interface ContactsWorkspaceV4EnhancedProps {
  user: User;
  onNavigate: (section: string, id?: string) => void;
  onAddContact?: () => void;
  onEditContact?: (contact: ContactForHandlers) => void;
}

/**
 * ContactsWorkspaceV4Enhanced - Complete workspace with all functionality
 */
export const ContactsWorkspace: React.FC<ContactsWorkspaceV4EnhancedProps> = ({
  user,
  onNavigate,
  onAddContact,
  onEditContact,
}) => {
  const { tenantId, agencyId } = useAuthStore();
  const query = useMemo(() => ({
    agentId: user.role === 'admin' ? undefined : user.id,
    limit: 500,
  }), [user.id, user.role]);
  const { data: apiContacts, isLoading, refetch } = useContacts(query);
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  const bulkUpdateMutation = useBulkUpdateContacts();
  const bulkDeleteMutation = useBulkDeleteContacts();

  const allContacts = useMemo(() => (apiContacts ?? []).map(mapApiContactToUIContact), [apiContacts]);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<import('@/types/schema').Contact | null>(null);

  // Filter state
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [followUpFilter, setFollowUpFilter] = useState<string[]>([]);

  // Helper functions to handle tags (can be string or array)
  const getTagArray = (tags: string | string[] | undefined | null): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string' && tags.trim() !== '') {
      try {
        const parsed = JSON.parse(tags) as unknown;
        if (Array.isArray(parsed)) return parsed as string[];
        return tags.split(',').map(t => t.trim()).filter(t => t);
      } catch {
        return tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }
    return [];
  };

  // UI Contact type (types/contacts) uses tags as string[]; pass-through for data layer.
  const serializeTags = (tags: string[]): string[] => tags;

  // Calculate stats
  const stats = useMemo(() => {
    const active = allContacts.filter((c) => c.status === ContactStatus.ACTIVE).length;
    const clients = allContacts.filter((c) => c.type === ContactType.CLIENT).length;
    const prospects = allContacts.filter((c) => c.type === ContactType.PROSPECT).length;

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

  const handleCall = (contact: ContactForHandlers) => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
      toast.success(`Calling ${contact.name}...`);
    }
  };

  const handleEmail = (contact: ContactForHandlers) => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
      toast.success(`Opening email to ${contact.name}...`);
    } else {
      toast.error('No email address available');
    }
  };

  const handleView = (contact: ContactForHandlers) => {
    onNavigate('contact-details', contact.id);
  };

  const handleEdit = (contact: ContactForHandlers) => {
    const apiContact = (apiContacts ?? []).find((c) => c.id === contact.id);
    setEditingContact(apiContact ?? null);
    onEditContact?.(contact);
  };

  const handleDelete = async (contact: ContactForHandlers) => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}? This action cannot be undone.`)) {
      try {
        await deleteContactMutation.mutateAsync(contact.id);
        refetch();
      } catch { /* toast handled by store */ }
    }
  };

  const handleChangeStatus = async (contact: ContactForHandlers, newStatus: ContactStatus) => {
    try {
      await updateContactMutation.mutateAsync({ id: contact.id, data: { status: newStatus } });
      toast.success(`Contact status changed to ${newStatus}`);
      refetch();
    } catch { /* toast handled by store */ }
  };

  // ============================================================================
  // Bulk Actions
  // ============================================================================

  const handleBulkExport = (ids: string[]) => {
    const contactsToExport = allContacts.filter(c => ids.includes(c.id));
    exportContactsToCSV(contactsToExport);
    toast.success(`Exported ${ids.length} contacts to CSV`);
  };

  const handleBulkArchive = async (ids: string[]) => {
    try {
      await bulkUpdateMutation.mutateAsync({ ids, updates: { status: ContactStatus.ARCHIVED } });
      toast.success(`Archived ${ids.length} contacts`);
      refetch();
    } catch { /* toast handled by store */ }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${ids.length} contacts? This action cannot be undone.`)) {
      try {
        await bulkDeleteMutation.mutateAsync(ids);
        toast.success(`Deleted ${ids.length} contacts`);
        refetch();
      } catch { /* toast handled by store */ }
    }
  };

  const handleBulkActivate = async (ids: string[]) => {
    try {
      await bulkUpdateMutation.mutateAsync({ ids, updates: { status: ContactStatus.ACTIVE } });
      toast.success(`Activated ${ids.length} contacts`);
      refetch();
    } catch { /* toast handled by store */ }
  };

  const handleBulkDeactivate = async (ids: string[]) => {
    try {
      await bulkUpdateMutation.mutateAsync({ ids, updates: { status: ContactStatus.INACTIVE } });
      toast.success(`Deactivated ${ids.length} contacts`);
      refetch();
    } catch { /* toast handled by store */ }
  };

  const handleBulkAddTag = async (ids: string[]) => {
    const tag = prompt('Enter tag to add:');
    if (tag && tag.trim()) {
      const updates: { id: string; tags: string }[] = [];
      for (const id of ids) {
        const contact = allContacts.find(c => c.id === id);
        if (contact) {
          const currentTags = getTagArray(contact.tags);
          if (!currentTags.includes(tag.trim())) {
            updates.push({ id, tags: [...currentTags, tag.trim()].join(',') });
          }
        }
      }
      if (updates.length > 0) {
        try {
          await Promise.all(updates.map(({ id, tags }) => updateContactMutation.mutateAsync({ id, data: { tags } })));
          toast.success(`Added tag "${tag}" to ${updates.length} contacts`);
          refetch();
        } catch { /* toast handled by store */ }
      }
    }
  };

  // ============================================================================
  // Table Columns with Row Actions
  // ============================================================================

  const columns: Column<UIContact>[] = [
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
        const typeColors: Record<string, string> = {
          [ContactType.CLIENT]: 'bg-green-100 text-green-800',
          [ContactType.PROSPECT]: 'bg-blue-100 text-blue-800',
          [ContactType.INVESTOR]: 'bg-purple-100 text-purple-800',
          [ContactType.VENDOR]: 'bg-gray-100 text-gray-800',
          [ContactType.PARTNER]: 'bg-gray-100 text-gray-800',
          [ContactType.AGENT]: 'bg-indigo-100 text-indigo-800',
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[c.type] || 'bg-gray-100 text-gray-800'}`}>
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

        const categoryColors: Record<string, string> = {
          [ContactCategory.BUYER]: 'bg-green-100 text-green-800',
          [ContactCategory.SELLER]: 'bg-blue-100 text-blue-800',
          [ContactCategory.TENANT]: 'bg-purple-100 text-purple-800',
          [ContactCategory.LANDLORD]: 'bg-gray-100 text-gray-800',
          [ContactCategory.EXTERNAL_BROKER]: 'bg-orange-100 text-orange-800',
          [ContactCategory.BOTH]: 'bg-yellow-100 text-yellow-800',
        };

        const categoryLabels: Record<string, string> = {
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
        const statusLabels: Record<string, string> = {
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

  /**
   * Consolidated Role filter.
   *
   * Maps the acceptance-criteria roles to their underlying fields:
   *   buyer   -> category === 'buyer'
   *   seller  -> category === 'seller'
   *   investor -> type === 'investor'
   *   agent   -> type === 'agent'
   *   developer -> type === 'developer'
   */
  const quickFilters = [
    {
      id: 'role',
      label: 'Contact Type',
      options: [
        { value: 'buyer', label: 'Buyer' },
        { value: 'seller', label: 'Seller' },
        { value: 'investor', label: 'Investor' },
        { value: 'agent', label: 'Agent' },
        { value: 'developer', label: 'Developer' },
      ],
      value: roleFilter,
      onChange: setRoleFilter,
      multiple: true,
    },
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: ContactStatus.ACTIVE, label: 'Active' },
        { value: ContactStatus.INACTIVE, label: 'Inactive' },
        { value: ContactStatus.ARCHIVED, label: 'Archived' },
        { value: ContactStatus.BLOCKED, label: 'Blocked' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
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
    <>
      <WorkspacePageTemplate
        // Header
        title="Contacts"
        description="Manage your contacts and client relationships"
        stats={stats}

        // Primary Action
        primaryAction={{
          label: 'Add Contact',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => {
            setEditingContact(null);
            setShowAddContactModal(true);
            onAddContact?.();
          },
        }}

        // Secondary Actions
        secondaryActions={secondaryActions}

        // Data
        items={allContacts}
        getItemId={(c) => c.id}
        isLoading={isLoading}

        // View Configuration — table on desktop, grid (ContactCard stacked) on mobile
        defaultView="table"
        availableViews={['table', 'grid']}

        // Table View
        columns={columns}

        // Grid / Mobile Card View — Task 1.3 AC
        renderCard={(contact) => (
          <ContactCard
            name={contact.name}
            role={contact.category ?? contact.type}
            phone={contact.phone}
            email={contact.email ?? undefined}
            address={contact.address ?? undefined}
            company={(contact as ContactWithLegacy & { company?: string }).company}
            lastContact={contact.lastContactDate}
            notes={(contact as ContactWithLegacy).notes}
            tags={getTagArray(contact.tags)}
            onCall={() => handleCall(contact)}
            onEmail={() => handleEmail(contact)}
            onEdit={() => handleEdit(contact)}
            onClick={() => handleView(contact)}
          />
        )}

        // Search & Filter
        searchPlaceholder="Search by name, phone, CNIC, email, notes or tags..."
        quickFilters={quickFilters}
        sortOptions={sortOptions}
        // Global search: Name, Phone, CNIC, Email, Notes, Tags — Task 1.2 AC
        onSearch={(contact, query) => {
          const q = query.toLowerCase();
          return (
            contact.name.toLowerCase().includes(q) ||
            contact.phone.includes(q) ||
            (contact.cnic?.toLowerCase().includes(q) ?? false) ||
            (contact.email?.toLowerCase().includes(q) ?? false) ||
            ((contact as ContactWithLegacy).notes?.toLowerCase().includes(q) ?? false) ||
            getTagArray(contact.tags).some((t: string) => t.toLowerCase().includes(q))
          );
        }}
        // Filter: consolidated Role filter + Status + Follow-up — Task 1.4 AC
        onFilter={(contact, filters) => {
          // Role filter — maps buyer/seller to category, investor/agent/developer to type
          const roles = filters.get('role');
          if (roles && roles.length > 0) {
            const categoryRoles = ['buyer', 'seller'] as string[];
            const typeRoles = ['investor', 'agent', 'developer'] as string[];

            const wantedCategories = roles.filter((r: string) => categoryRoles.includes(r));
            const wantedTypes = roles.filter((r: string) => typeRoles.includes(r));

            // Normalize contact category/type to lowercase so they can be compared
            // against the lowercase UI role strings (buyer, seller, investor, etc.).
            const contactCategoryLower = contact.category
              ? String(contact.category).toLowerCase()
              : undefined;
            const contactTypeLower = contact.type
              ? String(contact.type).toLowerCase()
              : undefined;

            let matchesRole = false;
            if (wantedCategories.length > 0 && contactCategoryLower &&
              wantedCategories.includes(contactCategoryLower)) {
              matchesRole = true;
            }
            if (wantedTypes.length > 0 && contactTypeLower &&
              wantedTypes.includes(contactTypeLower)) {
              matchesRole = true;
            }
            if (!matchesRole) return false;
          }

          // Status filter — statusFilter uses ContactStatus enum values, contact.status matches
          const statuses = filters.get('status');
          if (statuses && statuses.length > 0 && !statuses.includes(contact.status)) return false;

          // Follow-up filter
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
            onClick: () => {
              setEditingContact(null);
              setShowAddContactModal(true);
              onAddContact?.();
            },
          },
        }}

        // Callbacks
        onItemClick={(contact) => onNavigate('contact-details', contact.id)}
      />

      {/* Add/Edit Contact Modal */}
      <ContactFormModal
        isOpen={showAddContactModal || editingContact !== null}
        onClose={() => {
          setShowAddContactModal(false);
          setEditingContact(null);
        }}
        onSuccess={() => {
          setShowAddContactModal(false);
          setEditingContact(null);
          refetch();
        }}
        agentId={user.id}
        tenantId={tenantId ?? undefined}
        agencyId={agencyId ?? undefined}
        editingContact={editingContact}
        defaultType={
          !editingContact
            ? undefined
            : editingContact.type === ContactType.INVESTOR
              ? 'investor'
              : editingContact.type === ContactType.VENDOR
                ? 'vendor'
                : editingContact.category === ContactCategory.BOTH
                  ? undefined
                  : (editingContact.category === ContactCategory.EXTERNAL_BROKER
                      ? 'external-broker'
                      : editingContact.category?.toLowerCase()) as 'buyer' | 'seller' | 'tenant' | 'landlord' | 'investor' | 'vendor' | 'external-broker'
        }
      />
    </>
  );
};
