import React, { useState, useMemo } from 'react';
import { User } from '../../../types';
import { WorkspaceHeader } from '../../workspace/WorkspaceHeader';
import { WorkspaceSearchBar } from '../../workspace/WorkspaceSearchBar';
import { WorkspaceEmptyState, EmptyStatePresets } from '../../workspace/WorkspaceEmptyState';
import { PropertyFinancialMetrics } from './PropertyFinancialMetrics';
import { PropertyFinancialList, PropertyFinancialSummary } from './PropertyFinancialList';
import { PropertyProfitLossModal } from './PropertyProfitLossModal';
import { Button } from '../../ui/button';
// [STUBBED] import { getProperties } from '../../../lib/data';
// [STUBBED] import { getAllAgencyTransactions } from '../../../lib/agencyTransactions';
import { formatPKR } from '../../../lib/currency';
import { formatPropertyAddressShort } from '../../../lib/utils';
import { toast } from 'sonner';
import { Download, FileText } from 'lucide-react';

// ===== STUBS for removed prototype functions =====
const getProperties = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getAllAgencyTransactions = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface PropertyFinancialWorkspaceProps {
  user: User;
  onBack: () => void;
  onViewProperty?: (propertyId: string) => void;
}

/**
 * PropertyFinancialWorkspace Component
 * 
 * Complete property-level financial tracking workspace with:
 * - Real-time financial metrics per property
 * - P&L reports for each property
 * - ROI calculations
 * - Transaction history
 * - Export capabilities
 * 
 * Design System V4.1 Compliant:
 * - Uses WorkspaceHeader with stats
 * - Uses WorkspaceSearchBar with filters
 * - Uses MetricCard components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Miller's Law: 5 stats, 7 filters (within 7±2)
 * - Fitts's Law: Large action buttons
 * - Hick's Law: Progressive disclosure (filters, details)
 * - Jakob's Law: Follows Commission/Expense workspace pattern
 * - Aesthetic-Usability: Consistent design
 * 
 * Features:
 * - View all property financials
 * - Filter by status (active, sold, rented)
 * - Search by property name/address
 * - View detailed P&L per property
 * - ROI calculations
 * - Transaction history
 * - Export to CSV/JSON
 * 
 * @example
 * <PropertyFinancialWorkspace
 *   user={user}
 *   onBack={() => navigate('financials')}
 *   onViewProperty={(propertyId) => navigate('property-details', { propertyId })}
 * />
 */
export const PropertyFinancialWorkspace: React.FC<PropertyFinancialWorkspaceProps> = ({
  user,
  onBack,
  onViewProperty,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedPropertyForPL, setSelectedPropertyForPL] = useState<PropertyFinancialSummary | null>(null);

  // Get all properties and calculate financials from real agency transactions
  const propertyFinancials = useMemo(() => {
    const properties = getProperties(user.id, user.role);
    const agencyTransactions = getAllAgencyTransactions();

    // Calculate real financial summaries from agency transactions
    const financials: PropertyFinancialSummary[] = properties.map(property => {
      const propertyTransactions = agencyTransactions.filter(t => t.propertyId === property.id);

      // Calculate total investment (purchases + expenses)
      const totalInvestment = propertyTransactions
        .filter(t => t.category === 'acquisition' || t.category === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total revenue (sales + rental income)
      const totalRevenue = propertyTransactions
        .filter(t => t.category === 'sale' || t.category === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total expenses (operating expenses)
      const totalExpenses = propertyTransactions
        .filter(t => t.category === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = totalRevenue - totalInvestment - totalExpenses;
      const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

      return {
        propertyId: property.id,
        propertyTitle: property.title || 'Untitled Property',
        propertyAddress: formatPropertyAddressShort(property.address),
        status: property.status as 'active' | 'sold' | 'rented',
        totalInvestment,
        totalRevenue,
        totalExpenses,
        netProfit,
        roi,
        acquisitionDate: property.createdAt,
        transactionCount: propertyTransactions.length,
      };
    });

    return financials;
  }, [user.id, user.role]);

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const totalProperties = propertyFinancials.length;
    const totalInvestment = propertyFinancials.reduce((sum, p) => sum + p.totalInvestment, 0);
    const totalRevenue = propertyFinancials.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalExpenses = propertyFinancials.reduce((sum, p) => sum + p.totalExpenses, 0);
    const netProfit = propertyFinancials.reduce((sum, p) => sum + p.netProfit, 0);
    const averageROI = totalProperties > 0
      ? propertyFinancials.reduce((sum, p) => sum + p.roi, 0) / totalProperties
      : 0;
    const propertiesWithProfit = propertyFinancials.filter(p => p.netProfit > 0).length;
    const averageHoldingPeriod = 180; // Placeholder

    return {
      totalProperties,
      totalInvestment,
      totalRevenue,
      totalExpenses,
      netProfit,
      averageROI,
      propertiesWithProfit,
      averageHoldingPeriod,
    };
  }, [propertyFinancials]);

  // Stats for WorkspaceHeader
  const stats = useMemo(() => [
    { label: 'Total Properties', value: `${metrics.totalProperties}`, variant: 'default' as const },
    { label: 'Total Investment', value: formatPKR(metrics.totalInvestment), variant: 'default' as const },
    { label: 'Net Profit', value: formatPKR(metrics.netProfit), variant: metrics.netProfit >= 0 ? 'success' as const : 'destructive' as const },
    { label: 'Average ROI', value: `${metrics.averageROI.toFixed(2)}%`, variant: metrics.averageROI >= 10 ? 'success' as const : 'default' as const },
    { label: 'Profitable Properties', value: `${metrics.propertiesWithProfit}/${metrics.totalProperties}`, variant: 'default' as const },
  ], [metrics]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return propertyFinancials.filter(property => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = property.propertyTitle.toLowerCase().includes(query);
        const matchesAddress = property.propertyAddress.toLowerCase().includes(query);

        if (!matchesTitle && !matchesAddress) {
          return false;
        }
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(property.status)) {
        return false;
      }

      return true;
    });
  }, [propertyFinancials, searchQuery, statusFilter]);

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Property', 'Address', 'Status', 'Investment', 'Revenue', 'Expenses', 'Net Profit', 'ROI (%)'];
    const rows = filteredProperties.map(p => [
      p.propertyTitle,
      p.propertyAddress,
      p.status,
      p.totalInvestment.toString(),
      p.totalRevenue.toString(),
      p.totalExpenses.toString(),
      p.netProfit.toString(),
      p.roi.toFixed(2),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-financials-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Property financials exported to CSV');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(filteredProperties, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-financials-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Property financials exported to JSON');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
  };

  const handleViewProfitLoss = (propertyId: string) => {
    const property = filteredProperties.find(p => p.propertyId === propertyId);
    if (property) {
      setSelectedPropertyForPL(property);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WorkspaceHeader */}
      <WorkspaceHeader
        title="Property Financials"
        description="Track property-level P&L, ROI, and ownership costs"
        stats={stats}
        onBack={onBack}
        secondaryActions={[
          {
            label: 'Export CSV',
            icon: <Download className="h-4 w-4" />,
            onClick: handleExportCSV,
          },
          {
            label: 'Export JSON',
            icon: <Download className="h-4 w-4" />,
            onClick: handleExportJSON,
          },
        ]}
      />

      {/* WorkspaceSearchBar */}
      <WorkspaceSearchBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by property name or address..."
        quickFilters={[
          {
            id: 'status',
            label: 'Status',
            type: 'multi-select',
            options: [
              {
                value: 'active',
                label: 'Active',
                count: propertyFinancials.filter(p => p.status === 'active').length
              },
              {
                value: 'sold',
                label: 'Sold',
                count: propertyFinancials.filter(p => p.status === 'sold').length
              },
              {
                value: 'rented',
                label: 'Rented',
                count: propertyFinancials.filter(p => p.status === 'rented').length
              },
            ],
            value: statusFilter,
            onChange: (val) => setStatusFilter(val as string[]),
          },
        ]}
        onClearAll={handleClearFilters}
      />

      <div className="p-6 space-y-6">
        {/* Metrics */}
        <PropertyFinancialMetrics {...metrics} />

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-900 mb-1">Property Financial Tracking</p>
              <p className="text-blue-700">
                Track all financial transactions for each property from acquisition to sale.
                View detailed P&L reports by clicking "View P&L Report" in the actions menu.
              </p>
            </div>
          </div>
        </div>

        {/* Property Financial List */}
        {filteredProperties.length === 0 ? (
          <WorkspaceEmptyState
            {...(searchQuery || statusFilter.length > 0
              ? EmptyStatePresets.noResults(handleClearFilters)
              : {
                variant: 'empty' as const,
                title: 'No Properties Yet',
                description: 'Property financial data will appear here once properties are added to the system.',
              }
            )}
          />
        ) : (
          <PropertyFinancialList
            properties={filteredProperties}
            selectedProperties={selectedProperties}
            onSelectionChange={setSelectedProperties}
            onViewProperty={onViewProperty}
            onViewProfitLoss={handleViewProfitLoss}
          />
        )}
      </div>

      {/* Profit & Loss Modal */}
      <PropertyProfitLossModal
        open={selectedPropertyForPL !== null}
        onClose={() => setSelectedPropertyForPL(null)}
        property={selectedPropertyForPL}
        transactions={[]} // In production, fetch AgencyTransaction[] for this property
      />
    </div>
  );
};
