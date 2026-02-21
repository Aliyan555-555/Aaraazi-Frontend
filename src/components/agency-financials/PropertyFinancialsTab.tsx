/**
 * Property Financials Tab
 * Complete financial view for agency-owned properties
 * Shows acquisition costs, operations, and profitability
 * Design System Compliant
 */

import { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
  PlusCircle,
  FileText,
  Calculator,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { formatPKR } from '../../lib/currency';
import { calculatePropertyFinancials } from '../../lib/agencyFinancials';
import {
  getTransactionsByProperty,
  getTransactionTypeLabel,
  getCategoryLabel,
} from '../../lib/agencyTransactions';
import { AgencyTransaction } from '../../types';

interface PropertyFinancialsTabProps {
  propertyId: string;
  propertyAddress: string;
  acquisitionDate: string;
  currentValue?: number;
  status: 'active' | 'sold';
  saleDate?: string;
  onRecordIncome: () => void;
  onRecordExpense: () => void;
  onRecordSale?: () => void;
}

export function PropertyFinancialsTab({
  propertyId,
  propertyAddress,
  acquisitionDate,
  currentValue,
  status,
  saleDate,
  onRecordIncome,
  onRecordExpense,
  onRecordSale,
}: PropertyFinancialsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'acquisition' | 'income' | 'expense' | 'sale'>('all');

  // Calculate financials
  const financials = useMemo(() => {
    return calculatePropertyFinancials(
      propertyId,
      propertyAddress,
      acquisitionDate,
      currentValue,
      saleDate
    );
  }, [propertyId, propertyAddress, acquisitionDate, currentValue, saleDate]);

  // Get all transactions
  const allTransactions = useMemo(() => {
    return getTransactionsByProperty(propertyId);
  }, [propertyId]);

  // Filter transactions by category
  const filteredTransactions = useMemo(() => {
    if (selectedCategory === 'all') return allTransactions;
    return allTransactions.filter(t => t.category === selectedCategory);
  }, [allTransactions, selectedCategory]);

  // Group transactions by month
  const transactionsByMonth = useMemo(() => {
    const grouped = new Map<string, AgencyTransaction[]>();
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(transaction);
    });

    // Sort by month descending
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, transactions]) => ({
        month,
        transactions: transactions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }));
  }, [filteredTransactions]);

  const hasTransactions = allTransactions.length > 0;
  const hasSale = status === 'sold' && saleDate;

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Acquisition */}
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Investment</p>
              <p className="text-2xl font-semibold">{formatPKR(financials.totalAcquisitionCost)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="size-5 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Price:</span>
              <span>{formatPKR(financials.purchasePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expenses:</span>
              <span>{formatPKR(financials.acquisitionExpenses)}</span>
            </div>
          </div>
        </Card>

        {/* Operations */}
        <Card className={`p-6 border-l-4 ${
          financials.netCashFlow >= 0 ? 'border-l-green-500' : 'border-l-red-500'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Cash Flow</p>
              <p className={`text-2xl font-semibold ${
                financials.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPKR(financials.netCashFlow)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              financials.netCashFlow >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {financials.netCashFlow >= 0 ? (
                <TrendingUp className="size-5 text-green-600" />
              ) : (
                <TrendingDown className="size-5 text-red-600" />
              )}
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Income:</span>
              <span className="text-green-600">{formatPKR(financials.totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expenses:</span>
              <span className="text-red-600">{formatPKR(financials.totalExpenses)}</span>
            </div>
          </div>
        </Card>

        {/* Profit/ROI or Current Status */}
        {hasSale ? (
          <Card className={`p-6 border-l-4 ${
            (financials.totalProfit || 0) >= 0 ? 'border-l-green-500' : 'border-l-red-500'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Profit</p>
                <p className={`text-2xl font-semibold ${
                  (financials.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPKR(Math.abs(financials.totalProfit || 0))}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                (financials.totalProfit || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <Calculator className="size-5 text-green-600" />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ROI:</span>
                <span className={
                  (financials.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }>
                  {(financials.roi || 0).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Holding:</span>
                <span>{financials.holdingPeriod} days</span>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Operating Profit</p>
                <p className={`text-2xl font-semibold ${
                  financials.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPKR(financials.operatingProfit)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="size-5 text-purple-600" />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Holding:</span>
                <span>
                  {Math.floor(
                    (new Date().getTime() - new Date(acquisitionDate).getTime()) / (1000 * 60 * 60 * 24)
                  )} days
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <PlusCircle className="size-5 text-primary" />
            Record Transactions
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={onRecordIncome}
            variant="outline"
            className="justify-start gap-2 h-auto py-4"
          >
            <ArrowUpCircle className="size-5 text-green-600" />
            <div className="text-left">
              <div className="font-medium">Record Income</div>
              <div className="text-xs text-muted-foreground">Rental, fees, etc.</div>
            </div>
          </Button>
          <Button
            onClick={onRecordExpense}
            variant="outline"
            className="justify-start gap-2 h-auto py-4"
          >
            <ArrowDownCircle className="size-5 text-red-600" />
            <div className="text-left">
              <div className="font-medium">Record Expense</div>
              <div className="text-xs text-muted-foreground">Tax, maintenance, etc.</div>
            </div>
          </Button>
          {!hasSale && onRecordSale && (
            <Button
              onClick={onRecordSale}
              variant="outline"
              className="justify-start gap-2 h-auto py-4"
            >
              <Calculator className="size-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Record Sale</div>
                <div className="text-xs text-muted-foreground">Calculate P&L</div>
              </div>
            </Button>
          )}
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-medium flex items-center gap-2">
            <Receipt className="size-5 text-primary" />
            Transaction History
          </h3>
          <div className="text-sm text-muted-foreground">
            {allTransactions.length} transaction{allTransactions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: 'all', label: 'All', count: allTransactions.length },
            { 
              value: 'acquisition', 
              label: 'Acquisition', 
              count: allTransactions.filter(t => t.category === 'acquisition').length 
            },
            { 
              value: 'income', 
              label: 'Income', 
              count: allTransactions.filter(t => t.category === 'income').length 
            },
            { 
              value: 'expense', 
              label: 'Expense', 
              count: allTransactions.filter(t => t.category === 'expense').length 
            },
            { 
              value: 'sale', 
              label: 'Sale', 
              count: allTransactions.filter(t => t.category === 'sale').length 
            },
          ].map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value as any)}
            >
              {category.label}
              {category.count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 px-1.5 py-0 text-xs"
                >
                  {category.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Transactions List */}
        {!hasTransactions ? (
          <div className="text-center py-12">
            <FileText className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-medium mb-2">No Transactions Yet</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Start recording transactions to track your property's financial performance
            </p>
            <Button onClick={onRecordIncome} variant="outline">
              <PlusCircle className="size-4 mr-2" />
              Record First Transaction
            </Button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="size-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No {selectedCategory} transactions found
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {transactionsByMonth.map(({ month, transactions }) => (
              <div key={month}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="size-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">
                    {new Date(month + '-01').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </h4>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${
                          transaction.category === 'acquisition' ? 'bg-blue-100' :
                          transaction.category === 'income' ? 'bg-green-100' :
                          transaction.category === 'expense' ? 'bg-red-100' :
                          'bg-purple-100'
                        }`}>
                          {transaction.category === 'acquisition' && (
                            <DollarSign className="size-4 text-blue-600" />
                          )}
                          {transaction.category === 'income' && (
                            <ArrowUpCircle className="size-4 text-green-600" />
                          )}
                          {transaction.category === 'expense' && (
                            <ArrowDownCircle className="size-4 text-red-600" />
                          )}
                          {transaction.category === 'sale' && (
                            <Calculator className="size-4 text-purple-600" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">
                              {getTransactionTypeLabel(transaction.type)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(transaction.category)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            {transaction.description && (
                              <span className="truncate">{transaction.description}</span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.category === 'income' || transaction.category === 'sale'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {transaction.category === 'expense' && '-'}
                            {formatPKR(transaction.amount)}
                          </p>
                          {transaction.receiptNumber && (
                            <p className="text-xs text-muted-foreground">
                              #{transaction.receiptNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detailed Breakdown */}
      {hasTransactions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Acquisition Breakdown */}
          {financials.acquisitionBreakdown && (
            <Card className="p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <FileText className="size-5 text-blue-600" />
                Acquisition Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Purchase Price:</span>
                  <span className="font-medium">{formatPKR(financials.acquisitionBreakdown.purchasePrice || financials.purchasePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Registration Fee:</span>
                  <span className="font-medium">{formatPKR(financials.acquisitionBreakdown.registrationFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stamp Duty:</span>
                  <span className="font-medium">{formatPKR(financials.acquisitionBreakdown.stampDuty)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Legal Fees:</span>
                  <span className="font-medium">{formatPKR(financials.acquisitionBreakdown.legalFees)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Broker Commission:</span>
                  <span className="font-medium">{formatPKR(financials.acquisitionBreakdown.brokerCommission)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Renovation:</span>
                  <span className="font-medium">{formatPKR(financials.acquisitionBreakdown.renovation)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Other:</span>
                  <span className="font-medium">{formatPKR(financials.acquisitionBreakdown.other)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t font-semibold">
                  <span>Total Investment:</span>
                  <span className="text-blue-600">{formatPKR(financials.totalAcquisitionCost)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Operations Breakdown */}
          {(financials.totalIncome > 0 || financials.totalExpenses > 0) && (
            <Card className="p-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="size-5 text-green-600" />
                Operations Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Income:</span>
                  <span className="font-medium text-green-600">{formatPKR(financials.totalIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Expenses:</span>
                  <span className="font-medium text-red-600">{formatPKR(financials.totalExpenses)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t font-semibold">
                  <span>Net Cash Flow:</span>
                  <span className={financials.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPKR(financials.netCashFlow)}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
