import React, { useState, useMemo } from 'react';
import { User, Deal } from '../../../types';
import { WorkspaceHeader } from '../../workspace/WorkspaceHeader';
import { WorkspaceSearchBar } from '../../workspace/WorkspaceSearchBar';
import { WorkspaceEmptyState, EmptyStatePresets } from '../../workspace/WorkspaceEmptyState';
import { CommissionMetrics } from './CommissionMetrics';
import { CommissionList, CommissionAgent } from './CommissionList';
import { BulkCommissionActions } from './BulkCommissionActions';
import { DealCommissionDetailModal } from './DealCommissionDetailModal';
import { Button } from '../../ui/button';
import { getDeals, getDealById, updateDeal } from '../../../lib/deals';
import { getPropertyById } from '../../../lib/data';
import { formatPKR } from '../../../lib/currency';
import { toast } from 'sonner';
import { ArrowLeft, Download, CheckCircle, XCircle, Wallet } from 'lucide-react';

interface CommissionWorkspaceProps {
  user: User;
  onBack: () => void;
  onViewDeal?: (dealId: string) => void;
}

/**
 * CommissionWorkspace Component
 * 
 * Complete commission management workspace with:
 * - Real-time metrics from Deal commissions
 * - Searchable and filterable commission list
 * - Bulk actions (approve, reject, pay)
 * - Export to CSV/JSON
 * - Integration with Deal.financial.commission.agents
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
 * - Jakob's Law: Follows ContactsWorkspaceV4 pattern
 * - Aesthetic-Usability: Consistent design
 * 
 * Features:
 * - Real-time commission data from deals
 * - Multi-select with bulk actions
 * - Status filtering (pending, approved, paid)
 * - Agent filtering
 * - Search by agent name, deal number, property
 * - Export to CSV and JSON
 * - Admin-only approval workflow
 * 
 * @example
 * <CommissionWorkspace
 *   user={user}
 *   onBack={() => navigate('financials')}
 *   onViewDeal={(dealId) => navigate('deal-details', { dealId })}
 * />
 */
export const CommissionWorkspace: React.FC<CommissionWorkspaceProps> = ({
  user,
  onBack,
  onViewDeal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [agentFilter, setAgentFilter] = useState<string[]>([]);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'pay' | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [commissionDetailDealId, setCommissionDetailDealId] = useState<string | null>(null);

  // Get all commissions from deals
  const allCommissions = useMemo(() => {
    const deals = getDeals(user.id, user.role);
    const commissions: CommissionAgent[] = [];

    deals.forEach(deal => {
      if (deal.financial.commission.agents && deal.financial.commission.agents.length > 0) {
        deal.financial.commission.agents.forEach((agent: { agentId?: string; id?: string; name?: string; amount?: number; percentage?: number; status?: string; role?: string; approvedAt?: string; paidAt?: string }) => {
          const agentKey = agent.agentId ?? agent.id ?? '';
          let propertyTitle = 'Unknown Property';
          const propId = deal.cycles?.sellCycle?.propertyId ?? (deal.cycles?.purchaseCycle as { propertyId?: string } | undefined)?.propertyId;
          if (propId) {
            const prop = getPropertyById(propId);
            propertyTitle = prop?.title ?? propId;
          }

          commissions.push({
            id: `${deal.id}-${agentKey}`,
            agentId: agentKey,
            name: agent.name ?? 'Unknown',
            amount: agent.amount ?? 0,
            percentage: agent.percentage ?? 0,
            status: (agent.status as 'pending' | 'approved' | 'paid' | 'cancelled') ?? 'pending',
            role: agent.role,
            dealId: deal.id,
            dealNumber: deal.dealNumber,
            propertyTitle,
            createdAt: deal.metadata.createdAt,
            approvedAt: agent.approvedAt,
            paidAt: agent.paidAt,
          });
        });
      }
    });

    return commissions;
  }, [user.id, user.role, refreshKey]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalCommissions = allCommissions.reduce((sum, c) => sum + c.amount, 0);
    
    const pending = allCommissions.filter(c => c.status === 'pending');
    const pendingCount = pending.length;
    const pendingAmount = pending.reduce((sum, c) => sum + c.amount, 0);

    const approved = allCommissions.filter(c => c.status === 'approved');
    const approvedCount = approved.length;
    const approvedAmount = approved.reduce((sum, c) => sum + c.amount, 0);

    const paid = allCommissions.filter(c => c.status === 'paid');
    const paidCount = paid.length;
    const paidAmount = paid.reduce((sum, c) => sum + c.amount, 0);

    // Count unique agents
    const uniqueAgents = new Set(allCommissions.map(c => c.agentId));
    const agentCount = uniqueAgents.size;

    // Calculate average commission rate
    const avgCommissionRate = allCommissions.length > 0
      ? allCommissions.reduce((sum, c) => sum + c.percentage, 0) / allCommissions.length
      : 0;

    return {
      totalCommissions,
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      paidCount,
      paidAmount,
      agentCount,
      avgCommissionRate,
    };
  }, [allCommissions]);

  // Stats for WorkspaceHeader
  const stats = useMemo(() => [
    { label: 'Total Commissions', value: formatPKR(metrics.totalCommissions), variant: 'default' as const },
    { label: 'Pending', value: `${metrics.pendingCount}`, variant: metrics.pendingCount > 0 ? 'warning' as const : 'default' as const },
    { label: 'Approved', value: `${metrics.approvedCount}`, variant: 'info' as const },
    { label: 'Paid', value: `${metrics.paidCount}`, variant: 'success' as const },
    { label: 'Active Agents', value: `${metrics.agentCount}`, variant: 'default' as const },
  ], [metrics]);

  // Get unique agents for filter
  const uniqueAgents = useMemo(() => {
    const agents = new Map<string, string>();
    allCommissions.forEach(c => {
      agents.set(c.agentId, c.name);
    });
    return Array.from(agents.entries()).map(([id, name]) => ({ id, name }));
  }, [allCommissions]);

  // Filter commissions
  const filteredCommissions = useMemo(() => {
    return allCommissions.filter(commission => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = commission.name.toLowerCase().includes(query);
        const matchesDeal = commission.dealNumber?.toLowerCase().includes(query);
        const matchesProperty = commission.propertyTitle?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesDeal && !matchesProperty) {
          return false;
        }
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(commission.status)) {
        return false;
      }

      // Agent filter
      if (agentFilter.length > 0 && !agentFilter.includes(commission.agentId)) {
        return false;
      }

      return true;
    });
  }, [allCommissions, searchQuery, statusFilter, agentFilter]);

  // Get selected commission objects
  const selectedCommissionObjects = useMemo(() => {
    return filteredCommissions.filter(c => selectedCommissions.includes(c.id));
  }, [filteredCommissions, selectedCommissions]);

  // Handle bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject' | 'pay', reason?: string) => {
    console.log('🔧 Bulk action:', action, 'Count:', selectedCommissionObjects.length);

    try {
      // Group by deal ID
      const commissionsByDeal = new Map<string, CommissionAgent[]>();
      selectedCommissionObjects.forEach(commission => {
        if (!commission.dealId) return;
        
        const existing = commissionsByDeal.get(commission.dealId) || [];
        existing.push(commission);
        commissionsByDeal.set(commission.dealId, existing);
      });

      // Update each deal
      let successCount = 0;
      for (const [dealId, commissions] of commissionsByDeal) {
        const deal = getDeals(user.id, user.role).find(d => d.id === dealId);
        if (!deal) continue;

        // Update commission statuses
        const updatedAgents = deal.financial.commission.agents.map((agent: { agentId?: string; id?: string; [k: string]: any }) => {
          const agentKey = agent.agentId ?? agent.id;
          const matchingCommission = commissions.find(c => c.agentId === agentKey);
          if (!matchingCommission) return agent;

          const now = new Date().toISOString();

          switch (action) {
            case 'approve':
              return { ...agent, status: 'approved' as const, approvedAt: now };
            case 'reject':
              return { ...agent, status: 'pending' as const, rejectionReason: reason };
            case 'pay':
              return { ...agent, status: 'paid' as const, paidAt: now };
            default:
              return agent;
          }
        });

        updateDeal(dealId, {
          financial: {
            ...deal.financial,
            commission: { ...deal.financial.commission, agents: updatedAgents },
          },
        });
        successCount += commissions.length;
      }

      // Show success message
      const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked as paid';
      toast.success(`Successfully ${actionText} ${successCount} commission${successCount > 1 ? 's' : ''}`);

      // Reset selection and refresh
      setSelectedCommissions([]);
      setBulkAction(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Failed to perform bulk action. Please try again.');
    }
  };

  // Handle individual actions
  const handleApprove = async (commissionId: string) => {
    const commission = allCommissions.find(c => c.id === commissionId);
    if (!commission?.dealId) return;

    try {
      const deal = getDealById(commission.dealId);
      if (!deal) return;

      const updatedAgents = deal.financial.commission.agents.map((agent: { agentId?: string; id?: string; [k: string]: any }) =>
        (agent.agentId ?? agent.id) === commission.agentId
          ? { ...agent, status: 'approved' as const, approvedAt: new Date().toISOString() }
          : agent
      );

      updateDeal(deal.id, {
        financial: {
          ...deal.financial,
          commission: { ...deal.financial.commission, agents: updatedAgents },
        },
      });
      toast.success(`Commission approved for ${commission.name}`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Approve failed:', error);
      toast.error('Failed to approve commission');
    }
  };

  const handleReject = async (commissionId: string) => {
    const commission = allCommissions.find(c => c.id === commissionId);
    if (!commission?.dealId) return;

    try {
      const deal = getDealById(commission.dealId);
      if (!deal) return;

      const updatedAgents = deal.financial.commission.agents.map((agent: { agentId?: string; id?: string; [k: string]: any }) =>
        (agent.agentId ?? agent.id) === commission.agentId
          ? { ...agent, status: 'pending' as const }
          : agent
      );

      updateDeal(deal.id, {
        financial: {
          ...deal.financial,
          commission: { ...deal.financial.commission, agents: updatedAgents },
        },
      });
      toast.success(`Commission rejected for ${commission.name}`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Reject failed:', error);
      toast.error('Failed to reject commission');
    }
  };

  const handleMarkPaid = async (commissionId: string) => {
    const commission = allCommissions.find(c => c.id === commissionId);
    if (!commission?.dealId) return;

    try {
      const deal = getDealById(commission.dealId);
      if (!deal) return;

      const updatedAgents = deal.financial.commission.agents.map((agent: { agentId?: string; id?: string; [k: string]: any }) =>
        (agent.agentId ?? agent.id) === commission.agentId
          ? { ...agent, status: 'paid' as const, paidAt: new Date().toISOString() }
          : agent
      );

      updateDeal(deal.id, {
        financial: {
          ...deal.financial,
          commission: { ...deal.financial.commission, agents: updatedAgents },
        },
      });
      toast.success(`Commission marked as paid for ${commission.name}`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Mark paid failed:', error);
      toast.error('Failed to mark commission as paid');
    }
  };

  const handleChangeStatus = async (
    commissionId: string,
    status: 'pending' | 'approved' | 'paid' | 'cancelled'
  ) => {
    const commission = allCommissions.find(c => c.id === commissionId);
    if (!commission?.dealId) return;

    try {
      const deal = getDealById(commission.dealId);
      if (!deal) return;

      const now = new Date().toISOString();
      const updatedAgents = deal.financial.commission.agents.map(agent =>
        (agent.agentId ?? (agent as { id?: string }).id) === commission.agentId
          ? {
              ...agent,
              status,
              ...(status === 'approved' && { approvedAt: now }),
              ...(status === 'paid' && { paidAt: now }),
              ...((status === 'pending' || status === 'cancelled') && { approvedAt: undefined, paidAt: undefined }),
            }
          : agent
      );

      updateDeal(deal.id, {
        financial: {
          ...deal.financial,
          commission: { ...deal.financial.commission, agents: updatedAgents },
        },
      });

      const labels: Record<string, string> = { pending: 'Pending', approved: 'Approved', paid: 'Paid', cancelled: 'Cancelled' };
      toast.success(`Commission set to ${labels[status]} for ${commission.name}`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Change status failed:', error);
      toast.error('Failed to change commission status');
    }
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Agent', 'Deal Number', 'Property', 'Amount', 'Rate', 'Status', 'Created At'];
    const rows = filteredCommissions.map(c => [
      c.name,
      c.dealNumber || '',
      c.propertyTitle || '',
      c.amount.toString(),
      c.percentage.toFixed(2) + '%',
      c.status,
      c.createdAt || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Commissions exported to CSV');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(filteredCommissions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Commissions exported to JSON');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WorkspaceHeader */}
      <WorkspaceHeader
        title="Sales & Commissions"
        description="Track and manage commission payments across all deals"
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
        placeholder="Search by agent name, deal number, or property..."
        quickFilters={[
          {
            id: 'status',
            label: 'Status',
            type: 'multi-select',
            options: [
              { value: 'pending', label: 'Pending', count: allCommissions.filter(c => c.status === 'pending').length },
              { value: 'approved', label: 'Approved', count: allCommissions.filter(c => c.status === 'approved').length },
              { value: 'paid', label: 'Paid', count: allCommissions.filter(c => c.status === 'paid').length },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            id: 'agent',
            label: 'Agent',
            type: 'multi-select',
            options: uniqueAgents.map(agent => ({
              value: agent.id,
              label: agent.name,
              count: allCommissions.filter(c => c.agentId === agent.id).length,
            })),
            value: agentFilter,
            onChange: setAgentFilter,
          },
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setStatusFilter([]);
          setAgentFilter([]);
        }}
      />

      <div className="p-6 space-y-6">
        {/* Metrics */}
        <CommissionMetrics {...metrics} />

        {/* Bulk Actions Bar */}
        {selectedCommissions.length > 0 && user.role === 'admin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-blue-900">
                {selectedCommissions.length} commission{selectedCommissions.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('approve')}
                  disabled={!selectedCommissionObjects.some(c => c.status === 'pending')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('reject')}
                  disabled={!selectedCommissionObjects.some(c => c.status === 'pending')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('pay')}
                  disabled={!selectedCommissionObjects.some(c => c.status === 'approved')}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Commission List */}
        {filteredCommissions.length === 0 ? (
          <WorkspaceEmptyState
            {...(searchQuery || statusFilter.length > 0 || agentFilter.length > 0
              ? EmptyStatePresets.noResults()
              : {
                  variant: 'empty' as const,
                  title: 'No Commissions Yet',
                  description: 'Commissions will appear here once deals are created with commission structures.',
                }
            )}
          />
        ) : (
          <CommissionList
            commissions={filteredCommissions}
            selectedCommissions={selectedCommissions}
            onSelectionChange={setSelectedCommissions}
            onViewDeal={onViewDeal}
            onViewCommissionDetails={(dealId) => setCommissionDetailDealId(dealId)}
            onChangeStatus={handleChangeStatus}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkPaid={handleMarkPaid}
            userRole={user.role}
          />
        )}
      </div>

      {/* Bulk Actions Modal */}
      <BulkCommissionActions
        open={bulkAction !== null}
        onClose={() => setBulkAction(null)}
        action={bulkAction}
        selectedCommissions={selectedCommissionObjects}
        onConfirm={handleBulkAction}
      />

      {/* Deal Commission Detail Modal */}
      <DealCommissionDetailModal
        open={!!commissionDetailDealId}
        onClose={() => setCommissionDetailDealId(null)}
        dealId={commissionDetailDealId}
        onViewDeal={onViewDeal}
      />
    </div>
  );
};
