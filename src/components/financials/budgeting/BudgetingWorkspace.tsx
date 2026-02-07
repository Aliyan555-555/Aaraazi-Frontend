import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../../types';
import { WorkspaceHeader } from '../../workspace/WorkspaceHeader';
import { WorkspaceSearchBar } from '../../workspace/WorkspaceSearchBar';
import { WorkspaceEmptyState, EmptyStatePresets } from '../../workspace/WorkspaceEmptyState';
import { BudgetMetrics } from './BudgetMetrics';
import { BudgetCategoryCard, BudgetCategory } from './BudgetCategoryCard';
import { CreateBudgetModal } from './CreateBudgetModal';
import { EditBudgetModal, Budget } from './EditBudgetModal';
import { BudgetHistoryModal } from './BudgetHistoryModal';
import { CloneBudgetModal } from './CloneBudgetModal';
import { BulkEditBudgetsModal } from './BulkEditBudgetsModal';
import { formatPKR } from '../../../lib/currency';
import { getExpenses } from '../../../lib/data';
import { toast } from 'sonner';
import { Plus, Download, TrendingUp } from 'lucide-react';

interface BudgetingWorkspaceProps {
  user: User;
  onBack: () => void;
}

const BUDGETS_KEY = 'budget_categories';

/**
 * BudgetingWorkspace Component
 * 
 * Complete budgeting and forecasting workspace with:
 * - Budget category creation
 * - Budget vs Actual tracking
 * - Variance analysis
 * - Utilization monitoring
 * - Period-based budgeting
 * - Real-time expense integration
 * 
 * Design System V4.1 Compliant:
 * - Uses WorkspaceHeader with stats
 * - Uses WorkspaceSearchBar with filters
 * - Uses BudgetCategoryCard components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Miller's Law: 6 stats, 7 filters (within 7±2)
 * - Fitts's Law: Large action buttons
 * - Hick's Law: Progressive disclosure (filters)
 * - Jakob's Law: Standard budgeting interface
 * - Aesthetic-Usability: Consistent design
 * 
 * Features:
 * - Create budget categories
 * - Track budget vs actual spend
 * - Variance analysis (amount & percentage)
 * - Visual progress indicators
 * - Status alerts (on-track/warning/over-budget)
 * - Real-time expense integration
 * - Export to CSV
 * - Persistent storage in localStorage
 * 
 * @example
 * <BudgetingWorkspace
 *   user={user}
 *   onBack={() => navigate('financials')}
 * />
 */
export const BudgetingWorkspace: React.FC<BudgetingWorkspaceProps> = ({
  user,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Budget editing modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [selectedBudgetIds, setSelectedBudgetIds] = useState<string[]>([]);

  // Load budgets from localStorage
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(BUDGETS_KEY);
    if (stored) {
      try {
        const loadedBudgets = JSON.parse(stored);
        // Recalculate actual spend from expenses
        const expenses = getExpenses(user.id, user.role);
        const updatedBudgets = loadedBudgets.map((budget: BudgetCategory) => {
          // Match expenses to budget category by name
          const categoryExpenses = expenses.filter(e => 
            e.category.toLowerCase().includes(budget.name.toLowerCase()) ||
            budget.name.toLowerCase().includes(e.category.toLowerCase())
          );
          
          const actualSpend = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const variance = budget.budgetAmount - actualSpend;
          const variancePercentage = budget.budgetAmount > 0 
            ? (variance / budget.budgetAmount) * 100 
            : 0;
          
          // Determine status
          let status: 'on-track' | 'warning' | 'over-budget' = 'on-track';
          if (actualSpend > budget.budgetAmount) {
            status = 'over-budget';
          } else if (actualSpend > budget.budgetAmount * 0.9) {
            status = 'warning';
          }

          return {
            ...budget,
            actualSpend,
            variance,
            variancePercentage,
            status,
          };
        });
        setBudgets(updatedBudgets);
      } catch (error) {
        console.error('Failed to load budgets:', error);
        setBudgets([]);
      }
    }
  }, [refreshKey, user.id, user.role]);

  // Save budgets to localStorage
  const saveBudgets = (newBudgets: BudgetCategory[]) => {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(newBudgets));
    setBudgets(newBudgets);
  };

  // Calculate overall metrics
  const metrics = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const actualSpend = budgets.reduce((sum, b) => sum + b.actualSpend, 0);
    const variance = totalBudget - actualSpend;
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
    const remainingBudget = variance;
    
    // Get unique periods
    const periods = [...new Set(budgets.map(b => b.period))];
    const budgetPeriod = periods.length === 1 ? periods[0] : `${periods.length} periods`;

    return {
      totalBudget,
      actualSpend,
      variance,
      variancePercentage,
      remainingBudget,
      budgetPeriod,
    };
  }, [budgets]);

  // Stats for WorkspaceHeader
  const stats = useMemo(() => {
    const onTrackCount = budgets.filter(b => b.status === 'on-track').length;
    const warningCount = budgets.filter(b => b.status === 'warning').length;
    const overBudgetCount = budgets.filter(b => b.status === 'over-budget').length;
    const utilizationRate = metrics.totalBudget > 0 
      ? ((metrics.actualSpend / metrics.totalBudget) * 100).toFixed(1)
      : '0.0';

    return [
      { label: 'Total Budget', value: formatPKR(metrics.totalBudget), variant: 'default' as const },
      { label: 'Actual Spend', value: formatPKR(metrics.actualSpend), variant: 'info' as const },
      { label: 'Remaining', value: formatPKR(metrics.remainingBudget), variant: metrics.remainingBudget >= 0 ? 'success' as const : 'danger' as const },
      { label: 'Utilization', value: `${utilizationRate}%`, variant: parseFloat(utilizationRate) > 90 ? 'warning' as const : 'default' as const },
      { label: 'Categories', value: `${budgets.length}`, variant: 'default' as const },
    ];
  }, [budgets, metrics]);

  // Filter budgets
  const filteredBudgets = useMemo(() => {
    return budgets.filter(budget => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = budget.name.toLowerCase().includes(query);
        const matchesPeriod = budget.period.toLowerCase().includes(query);

        if (!matchesName && !matchesPeriod) {
          return false;
        }
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(budget.status)) {
        return false;
      }

      // Period filter
      if (periodFilter.length > 0 && !periodFilter.includes(budget.period)) {
        return false;
      }

      return true;
    });
  }, [budgets, searchQuery, statusFilter, periodFilter]);

  // Handle save new budget
  const handleSaveBudget = async (budgetData: Omit<BudgetCategory, 'id' | 'actualSpend' | 'variance' | 'variancePercentage' | 'status'>) => {
    try {
      const newBudget: BudgetCategory = {
        ...budgetData,
        id: Date.now().toString(),
        actualSpend: 0,
        variance: budgetData.budgetAmount,
        variancePercentage: 100,
        status: 'on-track',
      };

      saveBudgets([...budgets, newBudget]);
      toast.success('Budget created successfully');
      setShowCreateModal(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Save budget failed:', error);
      throw error;
    }
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Category', 'Period', 'Budget', 'Actual', 'Variance', 'Variance %', 'Status'];
    const rows = filteredBudgets.map(b => [
      b.name,
      b.period,
      b.budgetAmount.toString(),
      b.actualSpend.toString(),
      b.variance.toString(),
      b.variancePercentage.toFixed(2),
      b.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Budgets exported to CSV');
  };

  // Get unique periods for filter
  const uniquePeriods = useMemo(() => {
    return [...new Set(budgets.map(b => b.period))];
  }, [budgets]);

  // Helper to get selected budget
  const selectedBudget = useMemo(() => {
    if (!selectedBudgetId) return null;
    const budget = budgets.find(b => b.id === selectedBudgetId);
    if (!budget) return null;
    
    // Convert BudgetCategory to Budget type for modals
    return {
      id: budget.id,
      category: budget.name,
      amount: budget.budgetAmount,
      period: budget.period,
      notes: '', // BudgetCategory doesn't have notes
      isActive: budget.status !== 'over-budget', // Approximate
    } as Budget;
  }, [selectedBudgetId, budgets]);

  // Handler functions for budget actions
  const handleEditBudget = (budgetId: string) => {
    setSelectedBudgetId(budgetId);
    setShowEditModal(true);
  };

  const handleViewHistory = (budgetId: string) => {
    setSelectedBudgetId(budgetId);
    setShowHistoryModal(true);
  };

  const handleCloneBudget = (budgetId: string) => {
    setSelectedBudgetId(budgetId);
    setShowCloneModal(true);
  };

  const handleArchiveBudget = (budgetId: string) => {
    if (!confirm('Archive this budget? It will be permanently deleted.')) {
      return;
    }

    const updatedBudgets = budgets.filter(b => b.id !== budgetId);
    saveBudgets(updatedBudgets);
    toast.success('Budget archived successfully');
    setRefreshKey(prev => prev + 1);
  };

  // Handle edit budget save
  const handleEditBudgetSave = (budgetId: string, updates: Partial<Budget>) => {
    const updatedBudgets = budgets.map(b => {
      if (b.id === budgetId) {
        return {
          ...b,
          name: updates.category || b.name,
          budgetAmount: updates.amount || b.budgetAmount,
          period: updates.period || b.period,
          // Recalculate variance
          variance: (updates.amount || b.budgetAmount) - b.actualSpend,
          variancePercentage: (updates.amount || b.budgetAmount) > 0
            ? (((updates.amount || b.budgetAmount) - b.actualSpend) / (updates.amount || b.budgetAmount)) * 100
            : 0,
        };
      }
      return b;
    });

    saveBudgets(updatedBudgets);
    setRefreshKey(prev => prev + 1);
  };

  // Handle clone budget save
  const handleCloneBudgetSave = (clonedBudget: Omit<Budget, 'id'>) => {
    const newBudget: BudgetCategory = {
      id: Date.now().toString(),
      name: clonedBudget.category,
      budgetAmount: clonedBudget.amount,
      period: clonedBudget.period,
      actualSpend: 0,
      variance: clonedBudget.amount,
      variancePercentage: 100,
      status: 'on-track',
    };

    saveBudgets([...budgets, newBudget]);
    toast.success('Budget cloned successfully');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WorkspaceHeader */}
      <WorkspaceHeader
        title="Budgeting & Forecasting"
        description="Plan budgets, track variance, and monitor financial performance"
        stats={stats}
        onBack={onBack}
        primaryAction={{
          label: 'Create Budget',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setShowCreateModal(true),
        }}
        secondaryActions={[
          {
            label: 'Export CSV',
            icon: <Download className="h-4 w-4" />,
            onClick: handleExportCSV,
          },
        ]}
      />

      {/* WorkspaceSearchBar */}
      <WorkspaceSearchBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by category or period..."
        quickFilters={[
          {
            id: 'status',
            label: 'Status',
            type: 'multi-select',
            options: [
              { value: 'on-track', label: 'On Track', count: budgets.filter(b => b.status === 'on-track').length },
              { value: 'warning', label: 'Warning', count: budgets.filter(b => b.status === 'warning').length },
              { value: 'over-budget', label: 'Over Budget', count: budgets.filter(b => b.status === 'over-budget').length },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          ...(uniquePeriods.length > 1 ? [{
            id: 'period',
            label: 'Period',
            type: 'multi-select' as const,
            options: uniquePeriods.map(period => ({
              value: period,
              label: period,
              count: budgets.filter(b => b.period === period).length,
            })),
            value: periodFilter,
            onChange: setPeriodFilter,
          }] : []),
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setStatusFilter([]);
          setPeriodFilter([]);
        }}
      />

      <div className="p-6 space-y-6">
        {/* Metrics */}
        <BudgetMetrics {...metrics} />

        {/* Budget Grid */}
        {filteredBudgets.length === 0 ? (
          <WorkspaceEmptyState
            {...(searchQuery || statusFilter.length > 0 || periodFilter.length > 0
              ? EmptyStatePresets.noResults()
              : {
                  variant: 'empty' as const,
                  title: 'No Budgets Yet',
                  description: 'Start planning your finances by creating your first budget category. Track spending against targets and monitor variance in real-time.',
                  primaryAction: {
                    label: 'Create Budget',
                    onClick: () => setShowCreateModal(true),
                  },
                  guideItems: [
                    'Set budget amounts for each category',
                    'Track actual spending automatically from expenses',
                    'Monitor variance and utilization rates',
                    'Get alerts when approaching budget limits',
                    'Export reports for financial analysis',
                  ],
                }
            )}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBudgets.map((budget) => (
              <BudgetCategoryCard
                key={budget.id}
                category={budget}
                onClick={(id) => toast.info('Budget detail view coming soon')}
                onEdit={handleEditBudget}
                onViewHistory={handleViewHistory}
                onClone={handleCloneBudget}
                onArchive={handleArchiveBudget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Budget Modal */}
      <CreateBudgetModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="add"
        onSave={handleSaveBudget}
      />

      {/* Edit Budget Modal */}
      <EditBudgetModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        budget={selectedBudget}
        user={user}
        onSave={handleEditBudgetSave}
      />

      {/* Budget History Modal */}
      <BudgetHistoryModal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        budget={selectedBudget}
        user={user}
        onRestore={handleEditBudgetSave}
      />

      {/* Clone Budget Modal */}
      <CloneBudgetModal
        open={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        sourceBudget={selectedBudget}
        user={user}
        onCreate={handleCloneBudgetSave}
      />
    </div>
  );
};