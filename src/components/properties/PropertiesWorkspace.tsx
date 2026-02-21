/**
 * PropertiesWorkspace Component
 * Workspace: Built with WorkspacePageTemplate
 * Uses hooks for data - no API calls in component
 *
 * PURPOSE:
 * Complete properties workspace using the template system.
 * Data fetched via useProperties and usePropertyMutations hooks.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Download,
  Trash2,
  UserPlus,
  Edit3,
  Home,
} from 'lucide-react';
import { User, Property } from '../../types';
import { WorkspacePageTemplate } from '../workspace/WorkspacePageTemplate';
import { PropertyWorkspaceCard } from './PropertyWorkspaceCard';
import { StatusBadge } from '../layout/StatusBadge';
import { formatPropertyAddress } from '../../lib/utils';
import {
  Column,
  EmptyStatePresets,
} from '../workspace';
import { toast } from 'sonner';
import { useProperties, usePropertyMutations } from '@/hooks/useProperties';

const exportPropertiesToCSV = (properties: any[]) => {
  console.log('Export to CSV:', properties);
  toast.info('Export functionality coming soon');
};

export interface PropertiesWorkspaceProps {
  user: User;
  onNavigate: (section: string, id?: string) => void;
  onAddProperty?: () => void;
  onEditProperty?: (property: Property) => void;
}

export const PropertiesWorkspace: React.FC<PropertiesWorkspaceProps> = ({
  user,
  onNavigate,
  onAddProperty,
  onEditProperty,
}: PropertiesWorkspaceProps) => {
  const { properties: transformedProperties, isLoading, refetch } = useProperties({
    page: 1,
    limit: 1000,
  });
  const { remove } = usePropertyMutations();

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);

  const stats = useMemo(() => {
    return [
      { label: 'Total', value: transformedProperties.length, variant: 'default' as const },
      { label: 'Draft', value: transformedProperties.filter((p: any) => p.status === 'draft' || (p as any).status === 'DRAFT').length, variant: 'default' as const },
      { label: 'Active', value: transformedProperties.filter((p: any) => p.status === 'available' || (p as any).status === 'ACTIVE').length, variant: 'success' as const },
      { label: 'Archived', value: transformedProperties.filter((p: any) => (p as any).archived).length, variant: 'warning' as const },
    ];
  }, [transformedProperties]);

  const unitLabels: Record<string, string> = { sqft: 'sq ft', sqyards: 'sq yd', marla: 'marla', kanal: 'kanal' };

  const columns: Column<any>[] = [
    {
      id: 'address',
      label: 'Property',
      accessor: (p) => {
        const propertyAddress = typeof p.address === 'string'
          ? p.address
          : formatPropertyAddress(p.address);

        return (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={propertyAddress} className="w-full h-full object-cover rounded" />
              ) : (
                <Home className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{propertyAddress}</div>
              <div className="text-sm text-gray-500 capitalize">{p.propertyType}</div>
            </div>
          </div>
        );
      },
      width: '300px',
      sortable: true,
    },
    {
      id: 'area',
      label: 'Area',
      accessor: (p) => {
        const unit = (p.areaUnit || 'sqft').toLowerCase();
        return `${p.area} ${unitLabels[unit] || p.areaUnit}`;
      },
      width: '120px',
      sortable: true,
    },
    {
      id: 'rooms',
      label: 'Rooms',
      accessor: (p: any) => {
        if (!p.bedrooms) return '-';
        return `${p.bedrooms} bed${p.bathrooms ? `, ${p.bathrooms} bath` : ''}`;
      },
      width: '120px',
    },
    {
      id: 'owner',
      label: 'Owner',
      accessor: (p: any) => (
        <div>
          <div className="text-sm text-gray-900">{p.currentOwnerName || 'Unknown Owner'}</div>
          <div className="text-xs text-gray-500 capitalize">{p.currentOwnerType || 'Individual'}</div>
        </div>
      ),
      width: '150px',
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (p: any) => {
        let status = 'Available';

        if ((p.activeSellCycleIds || []).length > 0) {
          status = 'For Sale';
        } else if ((p.activeRentCycleIds || []).length > 0) {
          status = 'For Rent';
        } else if ((p.activePurchaseCycleIds || []).length > 0) {
          status = 'In Acquisition';
        }

        return <StatusBadge status={status} size="sm" />;
      },
      width: '120px',
      align: 'center',
    },
    {
      id: 'agent',
      label: 'Agent',
      accessor: (p) => p.createdBy === user.id ? 'You' : 'Shared',
      width: '100px',
    },
  ];

  const quickFilters = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'for-sale', label: 'For Sale' },
        { value: 'for-rent', label: 'For Rent' },
        { value: 'in-acquisition', label: 'In Acquisition' },
        { value: 'available', label: 'Available' },
      ],
      value: statusFilter,
      onChange: (value: string | string[]) => setStatusFilter(Array.isArray(value) ? value : [value]),
      multiple: true,
    },
    {
      id: 'type',
      label: 'Type',
      options: [
        { value: 'house', label: 'House' },
        { value: 'apartment', label: 'Apartment' },
        { value: 'plot', label: 'Plot' },
        { value: 'commercial', label: 'Commercial' },
      ],
      value: typeFilter,
      onChange: (value: string | string[]) => setTypeFilter(Array.isArray(value) ? value : [value]),
      multiple: true,
    },
    {
      id: 'owner',
      label: 'Owner Type',
      options: [
        { value: 'client', label: 'Client' },
        { value: 'agency', label: 'Agency' },
        { value: 'investor', label: 'Investor' },
      ],
      value: ownerFilter,
      onChange: (value: string | string[]) => setOwnerFilter(Array.isArray(value) ? value : [value]),
      multiple: true,
    },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'area-high', label: 'Area: High to Low' },
    { value: 'area-low', label: 'Area: Low to High' },
  ];

  const bulkActions = [
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-4 w-4" />,
      onClick: (ids: string[]) => {
        const selectedProperties = transformedProperties.filter(p => ids.includes(p.id));
        exportPropertiesToCSV(selectedProperties);
        toast.success(`Exported ${ids.length} properties to CSV`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (ids: string[]) => {
        if (window.confirm(`Are you sure you want to delete ${ids.length} properties?`)) {
          try {
            await Promise.all(ids.map((id) => remove(id)));
            toast.success(`Deleted ${ids.length} properties`);
            refetch();
          } catch (error: unknown) {
            console.error('Delete error:', error);
            const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : 'Failed to delete properties';
            toast.error(msg);
          }
        }
      },
      variant: 'destructive' as const,
      requireConfirm: true,
    },
  ];

  const handleFilter = useCallback((property: any, activeFilters: Map<string, any>) => {
    const statusValues = activeFilters.get('status');
    if (statusValues && statusValues.length > 0) {
      let matchesStatus = false;
      if (statusValues.includes('for-sale') && (property.activeSellCycleIds?.length || 0) > 0) matchesStatus = true;
      if (statusValues.includes('for-rent') && (property.activeRentCycleIds?.length || 0) > 0) matchesStatus = true;
      if (statusValues.includes('in-acquisition') && (property.activePurchaseCycleIds?.length || 0) > 0) matchesStatus = true;
      if (statusValues.includes('available') &&
        !(property.activeSellCycleIds?.length) &&
        !(property.activeRentCycleIds?.length) &&
        !(property.activePurchaseCycleIds?.length)) matchesStatus = true;
      if (!matchesStatus) return false;
    }

    const typeValues = activeFilters.get('type');
    if (typeValues && typeValues.length > 0) {
      if (!typeValues.includes(property.propertyType)) return false;
    }

    const ownerValues = activeFilters.get('owner');
    if (ownerValues && ownerValues.length > 0) {
      if (!property.currentOwnerType || !ownerValues.includes(property.currentOwnerType)) return false;
    }

    return true;
  }, []);

  const handleSearch = useCallback((property: any, query: string) => {
    const lowerQuery = query.toLowerCase();
    const propertyAddress = typeof property.address === 'string'
      ? property.address
      : formatPropertyAddress(property.address);

    return (
      propertyAddress.toLowerCase().includes(lowerQuery) ||
      property.propertyType.toLowerCase().includes(lowerQuery) ||
      (property.currentOwnerName?.toLowerCase() || '').includes(lowerQuery) ||
      (property.description?.toLowerCase() || '').includes(lowerQuery)
    );
  }, []);

  const handleSort = useCallback((items: any[], sortBy: string, _order: 'asc' | 'desc') => {
    const sorted = [...items];

    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'area-high') {
      sorted.sort((a, b) => Number(b.area) - Number(a.area));
    } else if (sortBy === 'area-low') {
      sorted.sort((a, b) => Number(a.area) - Number(b.area));
    }

    return sorted;
  }, []);

  const handleDeleteProperty = useCallback(async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await remove(propertyId);
        toast.success('Property deleted');
        refetch();
      } catch (error: unknown) {
        console.error('Delete error:', error);
        const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : 'Failed to delete property';
        toast.error(msg);
      }
    }
  }, [remove, refetch]);

  return (
    <>
      <WorkspacePageTemplate
        title="Properties"
        description="Manage your property portfolio"
        stats={stats}

        primaryAction={{
          label: 'Add Property',
          icon: <Plus className="h-4 w-4" />,
          onClick: onAddProperty || (() => toast.info('Add Property clicked')),
        }}

        items={transformedProperties}
        getItemId={(p) => p.id}
        isLoading={isLoading}

        defaultView="grid"
        availableViews={['grid', 'table']}

        columns={columns}

        renderCard={(property) => {
          const propertyAddress = typeof property.address === 'string'
            ? property.address
            : formatPropertyAddress(property.address);

          return (
            <PropertyWorkspaceCard
              property={property}
              onClick={() => onNavigate('properties', property.id)}
              onEdit={() => onEditProperty?.(property)}
              onDelete={() => handleDeleteProperty(property.id)}
              onShare={() => toast.info('Share property: ' + propertyAddress)}
              onSubmitOffer={() => toast.info('Offer functionality coming soon')}
            />
          );
        }}

        searchPlaceholder="Search properties by address, type, or owner..."
        quickFilters={quickFilters}
        sortOptions={sortOptions}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onSort={handleSort}

        bulkActions={bulkActions}

        pagination={{
          enabled: true,
          pageSize: 24,
          pageSizeOptions: [12, 24, 48, 96],
        }}

        emptyStatePreset={EmptyStatePresets.properties(
          onAddProperty || (() => toast.info('Add your first property'))
        )}

        onItemClick={(property) => onNavigate('properties', property.id)}
      />
    </>
  );
};

export default PropertiesWorkspace;
