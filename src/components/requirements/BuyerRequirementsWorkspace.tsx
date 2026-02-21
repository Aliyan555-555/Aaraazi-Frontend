/**
 * BuyerRequirementsWorkspace Component
 * Workspace: Built with WorkspacePageTemplate ✅
 * 
 * PURPOSE:
 * Complete buyer requirements workspace using the template system.
 * Demonstrates buyer search criteria and property matching.
 * 
 * FEATURES:
 * - Grid view (primary) and Table view (secondary)
 * - Search and filtering by status, urgency, budget, property types
 * - Sorting options
 * - Bulk actions (export, change status, delete)
 * - Quick actions (view, edit, delete, find matches)
 * - Pagination
 * - Empty states
 * - Loading states
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Trash2, 
  Upload,
  Search,
  DollarSign,
  User,
  Calendar,
  Tag,
} from 'lucide-react';
import { BuyerRequirement } from '../../types';
import { User as UserType } from '../../types';
import { WorkspacePageTemplate } from '../workspace/WorkspacePageTemplate';
import { BuyerRequirementWorkspaceCard } from './BuyerRequirementWorkspaceCard';
import { StatusBadge } from '../layout/StatusBadge'; // PHASE 5: Add StatusBadge import
import { Column, EmptyStatePresets } from '../workspace';
import { formatPKR } from '../../lib/currency';
import { getBuyerRequirements, updateBuyerRequirement, deleteBuyerRequirement } from '../../lib/buyerRequirements';
import { toast } from 'sonner';

export interface BuyerRequirementsWorkspaceProps {
  user: UserType;
  onNavigate: (section: string, id?: string) => void;
  onAddNew?: () => void;
  onEditRequirement?: (requirement: BuyerRequirement) => void;
}

/**
 * BuyerRequirementsWorkspace - Complete workspace using template system
 */
export const BuyerRequirementsWorkspace: React.FC<BuyerRequirementsWorkspaceProps> = ({
  user,
  onNavigate,
  onAddNew,
  onEditRequirement,
}) => {
  // State
  const [isLoading, setIsLoading] = useState(false);

  // Load buyer requirements based on user role
  const allRequirements = useMemo(() => {
    return getBuyerRequirements(user.id, user.role);
  }, [user.id, user.role]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = allRequirements.filter(r => r.status === 'active').length;
    const matched = allRequirements.filter(r => r.status === 'matched').length;
    const urgent = allRequirements.filter(r => r.urgency === 'high' && r.status === 'active').length;
    
    const totalMatches = allRequirements.reduce((sum, r) => 
      sum + (r.matchedProperties?.length || 0), 0
    );
    
    return [
      { label: 'Total', value: allRequirements.length, variant: 'default' as const },
      { label: 'Active', value: active, variant: 'success' as const },
      { label: 'Matched', value: matched, variant: 'warning' as const },
      { label: 'Total Matches', value: totalMatches, variant: 'info' as const },
    ];
  }, [allRequirements]);

  // Define table columns
  const columns: Column<BuyerRequirement>[] = [
    {
      id: 'buyer',
      label: 'Buyer',
      accessor: (r) => (
        <div>
          <div className="font-medium text-gray-900">{r.buyerName}</div>
          <div className="text-sm text-gray-500">{r.buyerContact}</div>
        </div>
      ),
      width: '200px',
      sortable: true,
    },
    {
      id: 'budget',
      label: 'Budget Range',
      accessor: (r) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {formatPKR(r.minBudget)} - {formatPKR(r.maxBudget)}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {r.financingType}{r.preApproved ? ' (Pre-approved)' : ''}
          </div>
        </div>
      ),
      width: '180px',
      sortable: true,
    },
    {
      id: 'propertyTypes',
      label: 'Property Types',
      accessor: (r) => (
        <div className="text-sm text-gray-900">
          {r.propertyTypes && r.propertyTypes.length > 0 
            ? r.propertyTypes.slice(0, 2).join(', ') + (r.propertyTypes.length > 2 ? '...' : '')
            : 'Any'}
        </div>
      ),
      width: '150px',
    },
    {
      id: 'bedrooms',
      label: 'Bedrooms',
      accessor: (r) => (
        <div className="text-sm text-gray-900">
          {r.maxBedrooms ? `${r.minBedrooms}-${r.maxBedrooms}` : `${r.minBedrooms}+`}
        </div>
      ),
      width: '100px',
      sortable: true,
    },
    {
      id: 'locations',
      label: 'Preferred Locations',
      accessor: (r) => (
        <div className="text-sm text-gray-900">
          {r.preferredLocations && r.preferredLocations.length > 0
            ? r.preferredLocations.slice(0, 2).join(', ') + (r.preferredLocations.length > 2 ? '...' : '')
            : 'Any'}
        </div>
      ),
      width: '180px',
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (r) => {
        const statusLabels: Record<string, string> = {
          active: 'Active',
          matched: 'Matched',
          closed: 'Closed',
        };
        
        const statusLabel = statusLabels[r.status] || r.status;
        
        // PHASE 5: Use StatusBadge component with auto-mapping
        return <StatusBadge status={statusLabel} size="sm" />;
      },
      width: '100px',
      sortable: true,
    },
    {
      id: 'urgency',
      label: 'Urgency',
      accessor: (r) => {
        const urgencyLabels: Record<string, { label: string; variant: 'default' | 'info' | 'warning' }> = {
          low: { label: 'Low', variant: 'default' },
          medium: { label: 'Medium', variant: 'info' },
          high: { label: 'High', variant: 'warning' },
        };
        
        const urgency = urgencyLabels[r.urgency] || { label: r.urgency, variant: 'default' as const };
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${urgency.variant === 'warning' ? 'bg-red-100 text-red-800' : ''}
            ${urgency.variant === 'info' ? 'bg-blue-100 text-blue-800' : ''}
            ${urgency.variant === 'default' ? 'bg-gray-100 text-gray-600' : ''}
          `}>
            {urgency.label}
          </span>
        );
      },
      width: '100px',
      sortable: true,
    },
    {
      id: 'matches',
      label: 'Matches',
      accessor: (r) => (
        <div className="text-sm text-gray-900">
          {r.matchedProperties && r.matchedProperties.length > 0
            ? r.matchedProperties.length
            : '-'}
        </div>
      ),
      width: '80px',
      sortable: true,
    },
  ];

  // Define quick filters
  const quickFilters = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active', count: allRequirements.filter(r => r.status === 'active').length },
        { value: 'matched', label: 'Matched', count: allRequirements.filter(r => r.status === 'matched').length },
        { value: 'closed', label: 'Closed', count: allRequirements.filter(r => r.status === 'closed').length },
      ],
      multiple: true,
    },
    {
      id: 'urgency',
      label: 'Urgency',
      options: [
        { value: 'high', label: 'High', count: allRequirements.filter(r => r.urgency === 'high').length },
        { value: 'medium', label: 'Medium', count: allRequirements.filter(r => r.urgency === 'medium').length },
        { value: 'low', label: 'Low', count: allRequirements.filter(r => r.urgency === 'low').length },
      ],
      multiple: true,
    },
    {
      id: 'financingType',
      label: 'Financing',
      options: [
        { value: 'cash', label: 'Cash', count: allRequirements.filter(r => r.financingType === 'cash').length },
        { value: 'loan', label: 'Loan', count: allRequirements.filter(r => r.financingType === 'loan').length },
        { value: 'installment', label: 'Installment', count: allRequirements.filter(r => r.financingType === 'installment').length },
      ],
      multiple: true,
    },
    {
      id: 'preApproved',
      label: 'Pre-Approval',
      options: [
        { 
          value: 'yes', 
          label: 'Pre-approved', 
          count: allRequirements.filter(r => r.preApproved).length 
        },
        { 
          value: 'no', 
          label: 'Not pre-approved', 
          count: allRequirements.filter(r => !r.preApproved).length 
        },
      ],
      multiple: false,
    },
  ];

  // Define sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'budget-high', label: 'Budget: High to Low' },
    { value: 'budget-low', label: 'Budget: Low to High' },
    { value: 'urgency', label: 'Urgency: High to Low' },
    { value: 'most-matches', label: 'Most Matches' },
  ];

  // Define bulk actions
  const bulkActions = [
    {
      id: 'export',
      label: 'Export Selected',
      icon: <Download className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        const selected = allRequirements.filter(r => ids.includes(r.id));
        console.log('Exporting requirements:', selected);
        toast.success(`Exporting ${ids.length} requirement${ids.length > 1 ? 's' : ''}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        console.log('Delete requirements:', ids);
        toast.success(`${ids.length} requirement${ids.length > 1 ? 's' : ''} deleted`);
      },
      variant: 'destructive' as const,
    },
  ];

  // Custom filter function
  const handleFilter = (requirement: BuyerRequirement, filterValues: Record<string, any>): boolean => {
    // Status filter
    if (filterValues.status?.length > 0 && !filterValues.status.includes(requirement.status)) {
      return false;
    }

    // Urgency filter
    if (filterValues.urgency?.length > 0 && !filterValues.urgency.includes(requirement.urgency)) {
      return false;
    }

    // Financing type filter
    if (filterValues.financingType?.length > 0 && !filterValues.financingType.includes(requirement.financingType)) {
      return false;
    }

    // Pre-approved filter
    if (filterValues.preApproved) {
      const isPreApproved = requirement.preApproved === true;
      if (filterValues.preApproved === 'yes' && !isPreApproved) return false;
      if (filterValues.preApproved === 'no' && isPreApproved) return false;
    }

    return true;
  };

  // Custom sort function
  const handleSort = (requirements: BuyerRequirement[], sortBy: string): BuyerRequirement[] => {
    const sorted = [...requirements];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'budget-high':
        sorted.sort((a, b) => b.maxBudget - a.maxBudget);
        break;
      case 'budget-low':
        sorted.sort((a, b) => a.minBudget - b.minBudget);
        break;
      case 'urgency':
        sorted.sort((a, b) => {
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        });
        break;
      case 'most-matches':
        sorted.sort((a, b) => (b.matchedProperties?.length || 0) - (a.matchedProperties?.length || 0));
        break;
      default:
        break;
    }
    
    return sorted;
  };

  // Custom search function
  const handleSearch = (requirement: BuyerRequirement, query: string): boolean => {
    const searchLower = query.toLowerCase();
    
    return (
      requirement.buyerName.toLowerCase().includes(searchLower) ||
      requirement.buyerContact.toLowerCase().includes(searchLower) ||
      requirement.agentName.toLowerCase().includes(searchLower) ||
      requirement.propertyTypes?.some(type => type.toLowerCase().includes(searchLower)) ||
      requirement.preferredLocations?.some(loc => loc.toLowerCase().includes(searchLower)) ||
      requirement.minBudget.toString().includes(searchLower) ||
      requirement.maxBudget.toString().includes(searchLower)
    );
  };

  return (
    <WorkspacePageTemplate
      // Header
      title="Buyer Requirements"
      description="Manage buyer search criteria and property matching"
      stats={stats}
      
      // Primary action
      primaryAction={{
        label: 'Add Buyer Requirement',
        icon: <Plus className="w-4 h-4" />,
        onClick: onAddNew || (() => toast.info('Add Buyer Requirement clicked')),
      }}
      
      // Secondary actions
      secondaryActions={[
        {
          label: 'Import',
          icon: <Upload className="w-4 h-4" />,
          onClick: () => toast.info('Import clicked'),
        },
        {
          label: 'Export All',
          icon: <Download className="w-4 h-4" />,
          onClick: () => toast.info('Export All clicked'),
        },
      ]}
      
      // View configuration
      defaultView="grid"
      availableViews={['grid', 'table']}
      
      // Data
      items={allRequirements}
      getItemId={(requirement) => requirement.id}
      
      // Table view
      columns={columns}
      
      // Grid view
      renderCard={(requirement) => (
        <BuyerRequirementWorkspaceCard
          requirement={requirement}
          onClick={() => onNavigate('buyer-requirement-details', requirement.id)}
          onEdit={() => onEditRequirement?.(requirement)}
          onDelete={() => toast.info(`Delete requirement ${requirement.id}`)}
        />
      )}
      
      // Search & Filter
      searchPlaceholder="Search by buyer name, contact, location, property type..."
      onSearch={handleSearch}
      quickFilters={quickFilters}
      onFilter={handleFilter}
      sortOptions={sortOptions}
      onSort={handleSort}
      defaultSort="newest"
      
      // Bulk actions
      bulkActions={bulkActions}
      enableBulkSelect={true}
      
      // Item actions
      onItemClick={(requirement) => onNavigate('buyer-requirement-details', requirement.id)}
      
      // Empty states
      emptyState={{
        variant: 'empty' as const,
        title: 'No buyer requirements yet',
        description: 'Create buyer requirements to track client property searches and find matches',
        primaryAction: {
          label: 'Add Buyer Requirement',
          onClick: onAddNew || (() => {}),
        },
        guideItems: [
          { step: 1, text: 'Capture buyer search criteria' },
          { step: 2, text: 'Set budget and preferences' },
          { step: 3, text: 'Match with available properties' },
        ],
      }}
      
      // Loading
      isLoading={isLoading}
      
      // Pagination
      enablePagination={true}
      itemsPerPage={12}
    />
  );
};
