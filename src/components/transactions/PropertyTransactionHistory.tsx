/**
 * Property Transaction History
 * Displays all income and expense transactions for investor-owned property
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Property, User, InvestorTransaction, InvestorTransactionType } from '../../types';
// [STUBBED] import { 
// [STUBBED]   getPropertyInvestorTransactions, 
// [STUBBED]   getPropertyTransactionSummary,
// [STUBBED]   deleteInvestorTransaction
// [STUBBED] } from '../../lib/investorTransactions';
import { formatPKR } from '../../lib/currency';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  FileText,
  CreditCard,
  Receipt,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const getPropertyInvestorTransactions = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getPropertyTransactionSummary = (..._args: any[]): any => { /* stub - prototype function removed */ };
const deleteInvestorTransaction = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface PropertyTransactionHistoryProps {
  property: Property;
  user: User;
  onTransactionDeleted?: () => void;
}

export function PropertyTransactionHistory({
  property,
  user,
  onTransactionDeleted,
}: PropertyTransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  // Load transactions
  const transactions = useMemo(() => {
    return getPropertyInvestorTransactions(property.id);
  }, [property.id]);

  // Get summary
  const summary = useMemo(() => {
    return getPropertyTransactionSummary(property.id);
  }, [property.id]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Type filter
    if (typeFilter === 'income') {
      filtered = filtered.filter(t => t.transactionType === 'rental-income');
    } else if (typeFilter === 'expense') {
      filtered = filtered.filter(t => t.transactionType.startsWith('expense-'));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query) ||
        t.reference?.toLowerCase().includes(query) ||
        t.notes?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });

    return filtered;
  }, [transactions, typeFilter, searchQuery, sortBy, sortOrder]);

  const handleDeleteTransaction = (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction? This will reverse its impact on all investor investments.')) {
      return;
    }

    try {
      const success = deleteInvestorTransaction(transactionId);
      if (success) {
        toast.success('Transaction deleted successfully');
        onTransactionDeleted?.();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const getTransactionTypeDisplay = (type: InvestorTransactionType) => {
    const types: Record<InvestorTransactionType, { label: string; color: string }> = {
      'rental-income': { label: 'Rental Income', color: 'bg-green-100 text-green-800 border-green-200' },
      'expense-maintenance': { label: 'Maintenance', color: 'bg-red-100 text-red-800 border-red-200' },
      'expense-tax': { label: 'Tax', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'expense-insurance': { label: 'Insurance', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'expense-utility': { label: 'Utility', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      'expense-renovation': { label: 'Renovation', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      'expense-legal': { label: 'Legal', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'expense-other': { label: 'Other', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!property.investorShares || property.investorShares.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            This property is not investor-owned. Transaction tracking is only available for investor-owned properties.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              All income and expense transactions for this property
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-green-700">{formatPKR(summary.totalIncome)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.incomeCount} transaction{summary.incomeCount !== 1 ? 's' : ''}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-700">{formatPKR(summary.totalExpenses)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.expenseCount} transaction{summary.expenseCount !== 1 ? 's' : ''}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={summary.netCashFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {formatPKR(summary.netCashFlow)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Income - Expenses</p>
                </div>
                <DollarSign className={`w-8 h-8 ${summary.netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income Only</SelectItem>
              <SelectItem value="expense">Expenses Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="amount">Sort by Amount</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              {transactions.length === 0 
                ? 'No transactions recorded yet'
                : 'No transactions match your filters'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const typeDisplay = getTransactionTypeDisplay(transaction.transactionType);
              const isExpanded = expandedTransactionId === transaction.id;
              const isIncome = transaction.transactionType === 'rental-income';

              return (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Main Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isIncome ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <Badge variant="outline" className={typeDisplay.color}>
                              {typeDisplay.label}
                            </Badge>
                            {transaction.category && (
                              <Badge variant="secondary" className="text-xs">
                                {transaction.category}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(transaction.date)}
                            </span>
                            {transaction.paymentMethod && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {transaction.paymentMethod}
                              </span>
                            )}
                            {transaction.reference && (
                              <span className="flex items-center gap-1">
                                <Receipt className="w-3 h-3" />
                                {transaction.reference}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                              {isIncome ? '+' : '-'}{formatPKR(transaction.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedTransactionId(isExpanded ? null : transaction.id)}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <>
                          <Separator />
                          <div className="space-y-3 pt-2">
                            {/* Investor Attribution */}
                            <div>
                              <p className="text-sm font-medium mb-2">Investor Attribution</p>
                              <div className="space-y-2">
                                {transaction.investorAttributions.map(attr => (
                                  <div key={attr.investorId} className="flex items-center justify-between bg-muted rounded p-2">
                                    <span className="text-sm">{attr.investorName}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary">{attr.percentage.toFixed(2)}%</Badge>
                                      <span className="text-sm font-medium">{formatPKR(attr.amount)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Notes */}
                            {transaction.notes && (
                              <div>
                                <p className="text-sm font-medium mb-1">Notes</p>
                                <p className="text-sm text-muted-foreground bg-muted rounded p-2">
                                  {transaction.notes}
                                </p>
                              </div>
                            )}

                            {/* Recorded By */}
                            <div className="text-xs text-muted-foreground">
                              Recorded by {transaction.recordedByName} on {formatDate(transaction.createdAt)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
