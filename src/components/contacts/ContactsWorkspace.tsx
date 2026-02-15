import React, { useState, useMemo } from 'react';
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
import { Contact, User, UserRole, ContactStatus, ContactType, ContactCategory } from '@/types/schema';
import { useConfirmStore } from '@/store/useConfirmStore';
import { WorkspacePageTemplate } from '../workspace/WorkspacePageTemplate';
import { StatusBadge } from '../layout/StatusBadge';
import { Column, EmptyStatePresets } from '../workspace';
import { formatPKR } from '../../lib/currency';
import { exportContactsToCSV } from '@/lib/exportUtils';
import { useContacts, useDeleteContact, useUpdateContact } from '@/hooks/useContacts';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ContactFormModal } from '../ContactFormModal';
import { useRouter } from 'next/navigation';

// Define a flexible User interface for props to handle different User types across the app
interface WorkspaceUser {
  id: string;
  role: UserRole | string;
  [key: string]: any;
}

export interface ContactsWorkspaceProps {
  user: WorkspaceUser;
  onAddContact?: () => void;
  onEditContact?: (contact: Contact) => void;
}

/**
 * ContactsWorkspace - Contact list and management
 */
export const ContactsWorkspace: React.FC<ContactsWorkspaceProps> = ({
  user,
  onAddContact,
  onEditContact,
}) => {
  const router = useRouter();
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Use professional Zustand hooks
  const { contacts: allContacts, isLoading, refetch } = useContacts({
    agentId: user.role === 'SAAS_ADMIN' ? undefined : user.id, // Fallback if enum is not used in user object at runtime, but for TS correctness:
    // Actually, let's use the Enum if imported, or cast.
    // If user.role is string at runtime, this comparison works for string enums.
    // But for TS, if user.role is UserRole, we should use UserRole.SAAS_ADMIN.
  });

  // Hook returns the mutation object directly
  const { mutateAsync: removeContact } = useDeleteContact();
  const { mutateAsync: updateContactMutation } = useUpdateContact();

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [followUpFilter, setFollowUpFilter] = useState<string[]>([]);

  // Helper functions to handle tags (can be string or array)
  const getTagArray = (tags: string | undefined | null): string[] => {
    if (!tags) return [];
    if (typeof tags === 'string') {
      return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return [];
  };

  const serializeTags = (tags: string[]): string => {
    return tags.join(',');
  };

  // Safe preferences accessor
  const getPreferences = (contact: Contact): Record<string, any> => {
    try {
      if (typeof contact.preferences === 'string') return JSON.parse(contact.preferences);
      return (contact.preferences as Record<string, any>) || {};
    } catch {
      return {};
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const active = allContacts.filter(c => c.status === ContactStatus.ACTIVE).length;
    const clients = allContacts.filter(c => c.type === ContactType.CLIENT).length;

    // Determine commission from preferences or legacy fields if supported, usually 0
    // We assume commission is not available for now. 
    const totalCommission = 0;

    const needFollowUp = allContacts.filter(c => {
      // Use preferences.nextFollowUp if contact.nextFollowUp is missing (frontend field precedence)
      // Actually contact.nextFollowUp is "Frontend-only" field in model, but backend might not return it.
      // So check both.
      const prefs = getPreferences(c);
      const followUpStr = c.nextFollowUp || prefs.nextFollowUp;

      if (!followUpStr) return false;
      const followUpDate = new Date(followUpStr);
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

  const handleCall = async (contact: Contact) => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
      toast.success(`Calling ${contact.name}...`);

      // We can't update lastContactDate via API if backend doesn't support it strictly.
      // But we can try or skip.
    }
  };

  const handleEmail = async (contact: Contact) => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
      toast.success(`Opening email to ${contact.name}...`);
    } else {
      toast.error('No email address available');
    }
  };

  const handleView = (contact: Contact) => {
    router.push(`/dashboard/contacts/${contact.id}`);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    // Explicitly open modal
    setShowAddContactModal(true);
    onEditContact?.(contact);
  };

  const handleDelete = async (contact: Contact) => {
    useConfirmStore.getState().ask({
      title: 'Delete Contact',
      description: `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await removeContact(contact.id);
        } catch (error) {
          console.error('Delete failed:', error);
        }
      },
    });
  };

  const handleChangeStatus = async (contact: Contact, newStatus: ContactStatus) => {
    try {
      await updateContactMutation({
        id: contact.id,
        data: { status: newStatus }
      });
      toast.success(`Contact status changed to ${newStatus}`);
    } catch (error) {
      console.error('Status change failed:', error);
    }
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
      await Promise.all(ids.map(id =>
        updateContactMutation({ id, data: { status: ContactStatus.ARCHIVED } })
      ));
      toast.success(`Archived ${ids.length} contacts`);
    } catch (error) {
      console.error('Bulk archive failed:', error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    useConfirmStore.getState().ask({
      title: 'Delete Contacts',
      description: `Are you sure you want to delete ${ids.length} contacts? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await Promise.all(ids.map(id => removeContact(id)));
        } catch (error) {
          console.error('Bulk delete failed:', error);
        }
      },
    });
  };

  const handleBulkActivate = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id =>
        updateContactMutation({ id, data: { status: ContactStatus.ACTIVE } })
      ));
      toast.success(`Activated ${ids.length} contacts`);
    } catch (error) {
      console.error('Bulk activate failed:', error);
    }
  };

  const handleBulkDeactivate = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id =>
        updateContactMutation({ id, data: { status: ContactStatus.INACTIVE } })
      ));
      toast.success(`Deactivated ${ids.length} contacts`);
    } catch (error) {
      console.error('Bulk deactivate failed:', error);
    }
  };

  const handleBulkAddTag = async (ids: string[]) => {
    const tag = prompt('Enter tag to add:');
    if (tag && tag.trim()) {
      try {
        await Promise.all(ids.map(async (id) => {
          const contact = allContacts.find(c => c.id === id);
          if (contact) {
            const currentTags = getTagArray(contact.tags);
            if (!currentTags.includes(tag.trim())) {
              await updateContactMutation({
                id,
                data: {
                  tags: serializeTags([...currentTags, tag.trim()])
                }
              });
            }
          }
        }));
        toast.success(`Added tag "${tag}" to ${ids.length} contacts`);
      } catch (error) {
        console.error('Bulk add tag failed:', error);
      }
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
        // Enums mapping
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
            {c.type.toString().charAt(0).toUpperCase() + c.type.toString().slice(1).toLowerCase()}
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
        return <StatusBadge status={statusLabel} size="sm" />;
      },
      width: '90px',
      align: 'center',
    },
    {
      id: 'commission',
      label: 'Commission',
      accessor: (c) => (
        <div className="text-sm font-medium text-gray-900">
          {/* Placeholder for now */}
          —
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
        { value: ContactType.CLIENT, label: 'Client' },
        { value: ContactType.PROSPECT, label: 'Prospect' },
        { value: ContactType.INVESTOR, label: 'Investor' },
        { value: ContactType.VENDOR, label: 'Vendor' },
      ],
      value: typeFilter,
      onChange: setTypeFilter,
      multiple: true,
    },
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: ContactStatus.ACTIVE, label: 'Active' },
        { value: ContactStatus.INACTIVE, label: 'Inactive' },
        { value: ContactStatus.ARCHIVED, label: 'Archived' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
      multiple: true,
    },
    {
      id: 'category',
      label: 'Category',
      options: [
        { value: ContactCategory.BUYER, label: 'Buyer' },
        { value: ContactCategory.SELLER, label: 'Seller' },
        { value: ContactCategory.TENANT, label: 'Tenant' },
        { value: ContactCategory.LANDLORD, label: 'Landlord' },
        { value: ContactCategory.EXTERNAL_BROKER, label: 'External Broker' },
        { value: ContactCategory.BOTH, label: 'Both' },
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

  // Sort options omitted for brevity, assuming existing ones fine or need enum tweaks?
  // Existing are: 'name-asc', etc. Logic is handled by `useContacts` or sorting function.
  // Assuming frontend sorting or backend sorting by string params. Backend DTO has sortBy: string.

  const sortOptions = [
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
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
      onClick: () => toast.info('Import functionality coming soon'),
    },
    {
      label: 'Export All',
      icon: <Download className="h-4 w-4" />,
      onClick: () => handleBulkExport(allContacts.map(c => c.id)),
    },
    {
      label: 'Download Template',
      icon: <FileDown className="h-4 w-4" />,
      onClick: handleExportTemplate,
    },
  ];

  return (
    <>
      <WorkspacePageTemplate
        title="Contacts"
        description="Manage your contacts and client relationships"
        stats={stats}
        primaryAction={{
          label: 'Add Contact',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => {
            setEditingContact(null);
            setShowAddContactModal(true);
            onAddContact?.();
          },
        }}
        secondaryActions={secondaryActions}
        items={allContacts}
        getItemId={(c) => c.id}
        isLoading={isLoading}
        defaultView="table"
        availableViews={['table']}
        columns={columns}
        searchPlaceholder="Search contacts..."
        quickFilters={quickFilters}
        sortOptions={sortOptions}
        onSearch={(contact, query) => {
          const q = query.toLowerCase();
          const prefs = getPreferences(contact);
          const notes = (prefs.notes || '').toLowerCase();
          return (
            contact.name.toLowerCase().includes(q) ||
            contact.phone.includes(q) ||
            (contact.email?.toLowerCase().includes(q) ?? false) ||
            notes.includes(q) ||
            getTagArray(contact.tags).some((t: string) => t.toLowerCase().includes(q))
          );
        }}
        onFilter={(contact, filters) => {
          const types = filters.get('type');
          if (types && types.length > 0 && !types.includes(contact.type)) return false;

          const statuses = filters.get('status');
          if (statuses && statuses.length > 0 && !statuses.includes(contact.status)) return false;

          const categories = filters.get('category');
          if (categories && categories.length > 0 && !categories.includes(contact.category)) return false;

          const followups = filters.get('followUp');
          if (followups && followups.length > 0) {
            const prefs = getPreferences(contact);
            const followUpStr = contact.nextFollowUp || prefs.nextFollowUp;
            if (followups.includes('none') && !followUpStr) return true;
            if (!followUpStr) return false;

            const fuDate = new Date(followUpStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (followups.includes('overdue') && fuDate < today) return true;
            if (followups.includes('due') && fuDate.getTime() === today.getTime()) return true;
            if (followups.includes('upcoming') && fuDate > today) return true;

            return false;
          }

          return true;
        }}
        bulkActions={bulkActions}
      />

      <ContactFormModal
        isOpen={showAddContactModal}
        onClose={() => {
          setShowAddContactModal(false);
          setEditingContact(null);
        }}
        agentId={user.id}
        editingContact={editingContact}
        onSuccess={() => {
          refetch();
          toast.success(editingContact ? 'Contact updated successfully' : 'Contact added successfully');
        }}
      />
    </>
  );
};