import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../../types';
import { WorkspaceHeader } from '../../workspace/WorkspaceHeader';
import { WorkspaceSearchBar } from '../../workspace/WorkspaceSearchBar';
import { WorkspaceEmptyState, EmptyStatePresets } from '../../workspace/WorkspaceEmptyState';
import { InvestorDistributionMetrics } from './InvestorDistributionMetrics';
import { InvestorDistributionList, InvestorDistributionRecord } from './InvestorDistributionList';
import { DistributionFormModal } from './DistributionFormModal';
import { BulkDistributionActions } from './BulkDistributionActions';
import { Button } from '../../ui/button';
import { getInvestors } from '../../../lib/investors';
import { getProperties } from '../../../lib/data';
import { formatPKR } from '../../../lib/currency';
import { toast } from 'sonner';
import { Plus, Download, CheckCircle, XCircle, Send } from 'lucide-react';

interface InvestorDistributionWorkspaceProps {
  user: User;
  onBack: () => void;
  onViewInvestor?: (investorId: string) => void;
  onViewProperty?: (propertyId: string) => void;
}

const DISTRIBUTIONS_KEY = 'investor_distributions';

/**
 * InvestorDistributionWorkspace Component
 * 
 * Complete investor profit distribution management workspace with:
 * - Real-time distribution metrics
 * - Schedule new distributions
 * - Approve/reject distributions
 * - Mark distributions as paid
 * - Bulk actions
 * - Export capabilities
 * - Persistent storage in localStorage
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
 * - Hick's Law: Progressive disclosure (filters, bulk actions)
 * - Jakob's Law: Follows Commission/Expense workspace pattern
 * - Aesthetic-Usability: Consistent design
 * 
 * Features:
 * - View all investor distributions
 * - Schedule new distribution
 * - Filter by status, type, investor, property
 * - Search by investor/property name
 * - Approve/reject/mark paid (admin only)
 * - Bulk actions
 * - Export to CSV/JSON
 * - Persistent storage in localStorage
 * 
 * @example
 * <InvestorDistributionWorkspace
 *   user={user}
 *   onBack={() => navigate('financials')}
 *   onViewInvestor={(id) => navigate('investor-details', { investorId: id })}
 *   onViewProperty={(id) => navigate('property-details', { propertyId: id })}
 * />
 */
export const InvestorDistributionWorkspace: React.FC<InvestorDistributionWorkspaceProps> = ({
  user,
  onBack,
  onViewInvestor,
  onViewProperty,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [selectedDistributions, setSelectedDistributions] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'mark-paid' | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load distributions from localStorage
  const [allDistributions, setAllDistributions] = useState<InvestorDistributionRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(DISTRIBUTIONS_KEY);
    if (stored) {
      try {
        setAllDistributions(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load distributions:', error);
        setAllDistributions([]);
      }
    }
  }, [refreshKey]);

  // Save distributions to localStorage
  const saveDistributions = (distributions: InvestorDistributionRecord[]) => {
    localStorage.setItem(DISTRIBUTIONS_KEY, JSON.stringify(distributions));
    setAllDistributions(distributions);
  };

  // Get investors and properties
  const investors = useMemo(() => {
    return getInvestors().map(inv => ({
      id: inv.id,
      name: inv.name,
      totalInvested: inv.totalInvested || 0,
    }));
  }, [refreshKey]);

  const properties = useMemo(() => {
    return getProperties(user.id, user.role)
      .filter(p => p.acquisitionType === 'investor-purchase')
      .map(p => ({
        id: p.id,
        title: p.title || p.address,
        investors: (p.purchaseDetails?.assignedInvestors || []).map((investorId: string, index: number) => ({
          investorId,
          percentage: (p.purchaseDetails?.investorShares || [])[index] || 0,
        })),
      }));
  }, [user.id, user.role, refreshKey]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const totalInvestors = new Set(allDistributions.map(d => d.investorId)).size;
    const totalDistributed = allDistributions
      .filter(d => d.status === 'Paid')
      .reduce((sum, d) => sum + d.amount, 0);

    const pending = allDistributions.filter(d => d.status === 'Pending');
    const pendingDistributions = pending.length;
    const pendingAmount = pending.reduce((sum, d) => sum + d.amount, 0);

    const thisMonthPaid = allDistributions.filter(d => {
      if (d.status !== 'Paid') return false;
      const distDate = new Date(d.distributionDate);
      return distDate.getMonth() === thisMonth && distDate.getFullYear() === thisYear;
    });
    const thisMonthDistributions = thisMonthPaid.length;
    const thisMonthAmount = thisMonthPaid.reduce((sum, d) => sum + d.amount, 0);

    const averageROI = 15.5; // Placeholder - calculate from actual data

    return {
      totalInvestors,
      totalDistributed,
      pendingDistributions,
      pendingAmount,
      thisMonthDistributions,
      thisMonthAmount,
      averageROI,
    };
  }, [allDistributions]);

  // Stats for WorkspaceHeader
  const stats = useMemo(() => [
    { label: 'Total Investors', value: `${metrics.totalInvestors}`, variant: 'default' as const },
    { label: 'Total Distributed', value: formatPKR(metrics.totalDistributed), variant: 'success' as const },
    { label: 'Pending', value: `${metrics.pendingDistributions}`, variant: metrics.pendingDistributions > 0 ? 'warning' as const : 'default' as const },
    { label: 'This Month', value: formatPKR(metrics.thisMonthAmount), variant: 'default' as const },
    { label: 'Avg ROI', value: `${metrics.averageROI.toFixed(2)}%`, variant: 'success' as const },
  ], [metrics]);

  // Filter distributions
  const filteredDistributions = useMemo(() => {
    return allDistributions.filter(distribution => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesInvestor = distribution.investorName.toLowerCase().includes(query);
        const matchesProperty = distribution.propertyTitle.toLowerCase().includes(query);

        if (!matchesInvestor && !matchesProperty) {
          return false;
        }
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(distribution.status)) {
        return false;
      }

      // Type filter
      if (typeFilter.length > 0 && !typeFilter.includes(distribution.distributionType)) {
        return false;
      }

      return true;
    });
  }, [allDistributions, searchQuery, statusFilter, typeFilter]);

  // Get selected distribution objects
  const selectedDistributionObjects = useMemo(() => {
    return filteredDistributions.filter(d => selectedDistributions.includes(d.id));
  }, [filteredDistributions, selectedDistributions]);

  // Handle bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject' | 'mark-paid', reason?: string) => {
    console.log('🔧 Bulk action:', action, 'Count:', selectedDistributionObjects.length);

    try {
      const updatedDistributions = allDistributions.map(dist => {
        if (!selectedDistributions.includes(dist.id)) return dist;

        switch (action) {
          case 'approve':
            return { ...dist, status: 'Approved' as const, updatedAt: new Date().toISOString() };
          case 'reject':
            return { ...dist, status: 'Scheduled' as const, notes: reason, updatedAt: new Date().toISOString() };
          case 'mark-paid':
            return { 
              ...dist, 
              status: 'Paid' as const, 
              distributionDate: new Date().toISOString(),
              updatedAt: new Date().toISOString() 
            };
          default:
            return dist;
        }
      });

      saveDistributions(updatedDistributions);

      const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked as paid';
      toast.success(`Successfully ${actionText} ${selectedDistributions.length} distribution${selectedDistributions.length > 1 ? 's' : ''}`);

      setSelectedDistributions([]);
      setBulkAction(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Failed to perform bulk action. Please try again.');
    }
  };

  // Handle individual actions
  const handleApprove = async (distributionId: string) => {
    const updated = allDistributions.map(dist =>
      dist.id === distributionId
        ? { ...dist, status: 'Approved' as const, updatedAt: new Date().toISOString() }
        : dist
    );
    saveDistributions(updated);
    toast.success('Distribution approved');
    setRefreshKey(prev => prev + 1);
  };

  const handleReject = async (distributionId: string) => {
    const updated = allDistributions.map(dist =>
      dist.id === distributionId
        ? { ...dist, status: 'Scheduled' as const, updatedAt: new Date().toISOString() }
        : dist
    );
    saveDistributions(updated);
    toast.success('Distribution rejected');
    setRefreshKey(prev => prev + 1);
  };

  const handleMarkPaid = async (distributionId: string) => {
    const updated = allDistributions.map(dist =>
      dist.id === distributionId
        ? { 
            ...dist, 
            status: 'Paid' as const, 
            distributionDate: new Date().toISOString(),
            updatedAt: new Date().toISOString() 
          }
        : dist
    );
    saveDistributions(updated);
    toast.success('Distribution marked as paid');
    setRefreshKey(prev => prev + 1);
  };

  // Handle save new distribution
  const handleSaveDistribution = async (distributionData: Omit<InvestorDistributionRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDistribution: InvestorDistributionRecord = {
        ...distributionData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveDistributions([...allDistributions, newDistribution]);
      toast.success('Distribution scheduled successfully');
      setShowAddModal(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Save distribution failed:', error);
      throw error;
    }
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Investor', 'Property', 'Type', 'Ownership %', 'Amount', 'Scheduled Date', 'Status'];
    const rows = filteredDistributions.map(d => [
      d.investorName,
      d.propertyTitle,
      d.distributionType,
      d.ownershipPercentage.toFixed(2),
      d.amount.toString(),
      d.scheduledDate,
      d.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investor-distributions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Distributions exported to CSV');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(filteredDistributions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investor-distributions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Distributions exported to JSON');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WorkspaceHeader */}
      <WorkspaceHeader
        title="Investor Distributions"
        description="Manage investor profit sharing and distribution schedules"
        stats={stats}
        onBack={onBack}
        primaryAction={{
          label: 'Schedule Distribution',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setShowAddModal(true),
        }}
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
        placeholder="Search by investor or property name..."
        quickFilters={[
          {
            id: 'status',
            label: 'Status',
            type: 'multi-select',
            options: [
              { value: 'Scheduled', label: 'Scheduled', count: allDistributions.filter(d => d.status === 'Scheduled').length },
              { value: 'Pending', label: 'Pending', count: allDistributions.filter(d => d.status === 'Pending').length },
              { value: 'Approved', label: 'Approved', count: allDistributions.filter(d => d.status === 'Approved').length },
              { value: 'Paid', label: 'Paid', count: allDistributions.filter(d => d.status === 'Paid').length },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            id: 'type',
            label: 'Type',
            type: 'multi-select',
            options: [
              { value: 'rental-income', label: 'Rental Income', count: allDistributions.filter(d => d.distributionType === 'rental-income').length },
              { value: 'sale-profit', label: 'Sale Profit', count: allDistributions.filter(d => d.distributionType === 'sale-profit').length },
              { value: 'quarterly-dividend', label: 'Quarterly', count: allDistributions.filter(d => d.distributionType === 'quarterly-dividend').length },
              { value: 'annual-dividend', label: 'Annual', count: allDistributions.filter(d => d.distributionType === 'annual-dividend').length },
            ],
            value: typeFilter,
            onChange: setTypeFilter,
          },
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setStatusFilter([]);
          setTypeFilter([]);
        }}
      />

      <div className="p-6 space-y-6">
        {/* Metrics */}
        <InvestorDistributionMetrics {...metrics} />

        {/* Bulk Actions Bar */}
        {selectedDistributions.length > 0 && user.role === 'admin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-blue-900">
                {selectedDistributions.length} distribution{selectedDistributions.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('approve')}
                  disabled={!selectedDistributionObjects.some(d => d.status === 'Pending')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('reject')}
                  disabled={!selectedDistributionObjects.some(d => d.status === 'Pending')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('mark-paid')}
                  disabled={!selectedDistributionObjects.some(d => d.status === 'Approved')}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Mark Paid
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Distribution List */}
        {filteredDistributions.length === 0 ? (
          <WorkspaceEmptyState
            {...(searchQuery || statusFilter.length > 0 || typeFilter.length > 0
              ? EmptyStatePresets.noResults()
              : {
                  variant: 'empty' as const,
                  title: 'No Distributions Yet',
                  description: 'Start tracking investor profit distributions by scheduling your first distribution.',
                  primaryAction: {
                    label: 'Schedule Distribution',
                    onClick: () => setShowAddModal(true),
                  },
                }
            )}
          />
        ) : (
          <InvestorDistributionList
            distributions={filteredDistributions}
            selectedDistributions={selectedDistributions}
            onSelectionChange={setSelectedDistributions}
            onViewInvestor={onViewInvestor}
            onViewProperty={onViewProperty}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkPaid={handleMarkPaid}
            userRole={user.role}
          />
        )}
      </div>

      {/* Add Distribution Modal */}
      <DistributionFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
        onSave={handleSaveDistribution}
        investors={investors}
        properties={properties}
      />

      {/* Bulk Actions Modal */}
      <BulkDistributionActions
        open={bulkAction !== null}
        onClose={() => setBulkAction(null)}
        action={bulkAction}
        selectedDistributions={selectedDistributionObjects}
        onConfirm={handleBulkAction}
      />
    </div>
  );
};