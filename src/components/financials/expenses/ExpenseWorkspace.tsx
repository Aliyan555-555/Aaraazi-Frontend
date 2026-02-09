import React, { useState, useMemo } from 'react';
import { User } from '../../../types';
import { Expense } from '../../../types/financials';
import { WorkspaceHeader } from '../../workspace/WorkspaceHeader';
import { WorkspaceSearchBar } from '../../workspace/WorkspaceSearchBar';
import { WorkspaceEmptyState, EmptyStatePresets } from '../../workspace/WorkspaceEmptyState';
import { ExpenseMetrics } from './ExpenseMetrics';
import { ExpenseList, ExpenseItem } from './ExpenseList';
import { ExpenseFormModal } from './ExpenseFormModal';
import { BulkExpenseActions } from './BulkExpenseActions';
import { Button } from '../../ui/button';
import { getExpenses, addExpense, updateExpense, deleteExpense, getProperties } from '../../../lib/data';
import { formatPKR } from '../../../lib/currency';
import { formatPropertyAddress } from '../../../lib/utils';
import { toast } from 'sonner';
import { Plus, Download, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface ExpenseWorkspaceProps {
  user: User;
  onBack: () => void;
  onViewProperty?: (propertyId: string) => void;
}

/**
 * ExpenseWorkspace Component
 * 
 * Complete expense management workspace with:
 * - Real-time metrics from expense data
 * - Searchable and filterable expense list
 * - Add/Edit expense forms
 * - Bulk actions (approve, reject, delete)
 * - Export to CSV/JSON
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
 * - Jakob's Law: Follows Commission workspace pattern
 * - Aesthetic-Usability: Consistent design
 * 
 * Features:
 * - View all expenses
 * - Add new expense
 * - Edit existing expense
 * - Multi-select with bulk actions
 * - Status filtering (pending, approved, paid)
 * - Category filtering
 * - Property filtering
 * - Search by description, vendor
 * - Export to CSV and JSON
 * - Admin-only approval workflow
 * 
 * @example
 * <ExpenseWorkspace
 *   user={user}
 *   onBack={() => navigate('financials')}
 *   onViewProperty={(propertyId) => navigate('property-details', { propertyId })}
 * />
 */
export const ExpenseWorkspace: React.FC<ExpenseWorkspaceProps> = ({
  user,
  onBack,
  onViewProperty,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [propertyFilter, setPropertyFilter] = useState<string[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get all expenses (cast from base Expense type to ExpenseItem)
  const allExpenses = useMemo(() => {
    const expenses = getExpenses(user.id, user.role);
    return expenses.map(e => ({
      ...e,
      status: (e as any).status || 'pending',
      propertyTitle: (e as any).propertyTitle,
      vendor: (e as any).vendor,
      receiptNumber: (e as any).receiptNumber,
      notes: (e as any).notes,
      createdAt: (e as any).createdAt,
      updatedAt: (e as any).updatedAt,
    })) as ExpenseItem[];
  }, [user.id, user.role, refreshKey]);

  // Get properties for form
  const properties = useMemo(() => {
    return getProperties(user.id, user.role).map(p => ({
      id: p.id,
      title: p.title || formatPropertyAddress(p.address) || 'Untitled Property'
    }));
  }, [user.id, user.role]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    const thisMonthExpenses = allExpenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const pending = allExpenses.filter(e => e.status === 'pending');
    const pendingCount = pending.length;
    const pendingAmount = pending.reduce((sum, e) => sum + e.amount, 0);

    const approved = allExpenses.filter(e => {
      const expenseDate = new Date(e.date);
      return (
        e.status === 'paid' &&
        expenseDate.getMonth() === thisMonth &&
        expenseDate.getFullYear() === thisYear
      );
    });
    const approvedCount = approved.length;
    const approvedAmount = approved.reduce((sum, e) => sum + e.amount, 0);

    const categories = new Set(allExpenses.map(e => e.category));
    const categoryCount = categories.size;

    // Placeholder for recurring expenses
    const recurringCount = 0;

    return {
      totalExpenses,
      thisMonthExpenses,
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      categoryCount,
      recurringCount,
    };
  }, [allExpenses]);

  // Stats for WorkspaceHeader
  const stats = useMemo(() => [
    { label: 'Total Expenses', value: formatPKR(metrics.totalExpenses), variant: 'default' as const },
    { label: 'This Month', value: formatPKR(metrics.thisMonthExpenses), variant: 'default' as const },
    { label: 'Pending', value: `${metrics.pendingCount}`, variant: metrics.pendingCount > 0 ? 'warning' as const : 'default' as const },
    { label: 'Approved (This Month)', value: `${metrics.approvedCount}`, variant: 'success' as const },
    { label: 'Categories', value: `${metrics.categoryCount}`, variant: 'default' as const },
  ], [metrics]);

  // Get unique categories and properties for filters
  const uniqueCategories = useMemo(() => {
    const categories = new Map<string, number>();
    allExpenses.forEach(e => {
      categories.set(e.category, (categories.get(e.category) || 0) + 1);
    });
    return Array.from(categories.entries()).map(([category, count]) => ({ category, count }));
  }, [allExpenses]);

  const uniqueProperties = useMemo(() => {
    const props = new Map<string, { title: string; count: number }>();
    allExpenses.forEach(e => {
      if (e.propertyId && e.propertyTitle) {
        const existing = props.get(e.propertyId);
        props.set(e.propertyId, {
          title: e.propertyTitle,
          count: (existing?.count || 0) + 1,
        });
      }
    });
    return Array.from(props.entries()).map(([id, data]) => ({ id, ...data }));
  }, [allExpenses]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(expense => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDescription = expense.description.toLowerCase().includes(query);
        const matchesVendor = expense.vendor?.toLowerCase().includes(query);
        const matchesCategory = expense.category.toLowerCase().includes(query);

        if (!matchesDescription && !matchesVendor && !matchesCategory) {
          return false;
        }
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(expense.status)) {
        return false;
      }

      // Category filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(expense.category)) {
        return false;
      }

      // Property filter
      if (propertyFilter.length > 0 && expense.propertyId && !propertyFilter.includes(expense.propertyId)) {
        return false;
      }

      return true;
    });
  }, [allExpenses, searchQuery, statusFilter, categoryFilter, propertyFilter]);

  // Get selected expense objects
  const selectedExpenseObjects = useMemo(() => {
    return filteredExpenses.filter(e => selectedExpenses.includes(e.id));
  }, [filteredExpenses, selectedExpenses]);

  // Handle bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete', reason?: string) => {
    console.log('🔧 Bulk action:', action, 'Count:', selectedExpenseObjects.length);

    try {
      let successCount = 0;

      for (const expense of selectedExpenseObjects) {
        switch (action) {
          case 'approve':
            updateExpense(expense.id, { status: 'paid' });
            successCount++;
            break;
          case 'reject':
            updateExpense(expense.id, { status: 'pending', notes: reason });
            successCount++;
            break;
          case 'delete':
            deleteExpense(expense.id);
            successCount++;
            break;
        }
      }

      const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'deleted';
      toast.success(`Successfully ${actionText} ${successCount} expense${successCount > 1 ? 's' : ''}`);

      setSelectedExpenses([]);
      setBulkAction(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Failed to perform bulk action. Please try again.');
    }
  };

  // Handle individual actions
  const handleApprove = async (expenseId: string) => {
    try {
      updateExpense(expenseId, { status: 'paid' });
      toast.success('Expense approved');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Approve failed:', error);
      toast.error('Failed to approve expense');
    }
  };

  const handleReject = async (expenseId: string) => {
    try {
      updateExpense(expenseId, { status: 'pending' });
      toast.success('Expense rejected');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Reject failed:', error);
      toast.error('Failed to reject expense');
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      deleteExpense(expenseId);
      toast.success('Expense deleted');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete expense');
    }
  };

  // Handle add/edit expense
  const handleSaveExpense = async (expenseData: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingExpense) {
        updateExpense(editingExpense.id, expenseData);
        toast.success('Expense updated successfully');
        setEditingExpense(null);
      } else {
        const newExpense: Expense = {
          ...expenseData,
          id: `exp_${Date.now()}`,
          agentId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addExpense(newExpense);
        toast.success('Expense added successfully');
        setShowAddModal(false);
      }
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Save expense failed:', error);
      throw error;
    }
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Property', 'Vendor', 'Amount', 'Status'];
    const rows = filteredExpenses.map(e => [
      e.date,
      e.category,
      e.description,
      e.propertyTitle || '',
      e.vendor || '',
      e.amount.toString(),
      e.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Expenses exported to CSV');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(filteredExpenses, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Expenses exported to JSON');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setCategoryFilter([]);
    setPropertyFilter([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WorkspaceHeader */}
      <WorkspaceHeader
        title="Expenses & Payables"
        description="Track and manage all business expenses and vendor payments"
        stats={stats}
        onBack={onBack}
        primaryAction={{
          label: 'Add Expense',
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
        placeholder="Search by description, vendor, or category..."
        quickFilters={[
          {
            id: 'status',
            label: 'Status',
            type: 'multi-select',
            options: [
              { value: 'pending', label: 'Pending', count: allExpenses.filter(e => e.status === 'pending').length },
              { value: 'paid', label: 'Paid', count: allExpenses.filter(e => e.status === 'paid').length },
              { value: 'cancelled', label: 'Cancelled', count: allExpenses.filter(e => e.status === 'cancelled').length },
            ],
            value: statusFilter,
            onChange: (val) => setStatusFilter(val as string[]),
          },
          {
            id: 'category',
            label: 'Category',
            type: 'multi-select',
            options: uniqueCategories.map(cat => ({
              value: cat.category,
              label: cat.category,
              count: cat.count,
            })),
            value: categoryFilter,
            onChange: (val) => setCategoryFilter(val as string[]),
          },
          {
            id: 'property',
            label: 'Property',
            type: 'multi-select',
            options: uniqueProperties.map(prop => ({
              value: prop.id,
              label: prop.title,
              count: prop.count,
            })),
            value: propertyFilter,
            onChange: (val) => setPropertyFilter(val as string[]),
          },
        ]}
        onClearAll={handleClearFilters}
      />

      <div className="p-6 space-y-6">
        {/* Metrics */}
        <ExpenseMetrics {...metrics} />

        {/* Bulk Actions Bar */}
        {selectedExpenses.length > 0 && user.role === 'admin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-blue-900">
                {selectedExpenses.length} expense{selectedExpenses.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('approve')}
                  disabled={!selectedExpenseObjects.some(e => e.status === 'pending')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('reject')}
                  disabled={!selectedExpenseObjects.some(e => e.status === 'pending')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Expense List */}
        {filteredExpenses.length === 0 ? (
          <WorkspaceEmptyState
            {...(searchQuery || statusFilter.length > 0 || categoryFilter.length > 0 || propertyFilter.length > 0
              ? EmptyStatePresets.noResults(handleClearFilters)
              : {
                variant: 'empty' as const,
                title: 'No Expenses Yet',
                description: 'Start tracking expenses by adding your first expense record.',
                primaryAction: {
                  label: 'Add Expense',
                  onClick: () => setShowAddModal(true),
                },
              }
            )}
          />
        ) : (
          <ExpenseList
            expenses={filteredExpenses}
            selectedExpenses={selectedExpenses}
            onSelectionChange={setSelectedExpenses}
            onViewProperty={onViewProperty}
            onEdit={setEditingExpense}
            onDelete={handleDelete}
            onApprove={handleApprove}
            onReject={handleReject}
            userRole={user.role}
          />
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      <ExpenseFormModal
        open={showAddModal || editingExpense !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingExpense(null);
        }}
        mode={editingExpense ? 'edit' : 'add'}
        expense={editingExpense}
        onSave={handleSaveExpense}
        properties={properties}
      />

      {/* Bulk Actions Modal */}
      <BulkExpenseActions
        open={bulkAction !== null}
        onClose={() => setBulkAction(null)}
        action={bulkAction}
        selectedExpenses={selectedExpenseObjects}
        onConfirm={handleBulkAction}
      />
    </div>
  );
};
