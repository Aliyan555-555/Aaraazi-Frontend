/**
 * Purchase Cycle Financial Summary
 * Displays acquisition costs and financial tracking for agency purchase cycles
 * PHASE 4: Integration component
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PurchaseCycle, Property } from '../../types';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  Calendar,
  Plus,
} from 'lucide-react';
import { formatPKR } from '../../lib/currency';
import { formatPropertyAddress } from '../../lib/utils';
// [STUBBED] import { getTransactionsByProperty } from '../../lib/agencyTransactions';
// [STUBBED] import { calculatePropertyFinancials } from '../../lib/agencyFinancials';

// ===== STUBS for removed prototype functions =====
const getTransactionsByProperty = (..._args: any[]): any => { /* stub - prototype function removed */ };
const calculatePropertyFinancials = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface PurchaseCycleFinancialSummaryProps {
  cycle: PurchaseCycle;
  property: Property;
  onAddAcquisitionCost?: () => void;
}

export function PurchaseCycleFinancialSummary({
  cycle,
  property,
  onAddAcquisitionCost,
}: PurchaseCycleFinancialSummaryProps) {
  // Get all transactions for this property
  const transactions = useMemo(() => {
    return getTransactionsByProperty(property.id);
  }, [property.id]);

  // Get transactions specifically for this purchase cycle
  const cycleTransactions = useMemo(() => {
    return transactions.filter(t => t.purchaseCycleId === cycle.id);
  }, [transactions, cycle.id]);

  // Calculate financial summary
  const financials = useMemo(() => {
    return calculatePropertyFinancials(
      property.id,
      formatPropertyAddress(property.address),
      cycle.offerDate || cycle.createdAt,
      cycle.offerAmount || 0
    );
  }, [property.id, property.address, cycle.offerDate, cycle.createdAt, cycle.offerAmount]);

  const hasRecordedCosts = cycleTransactions.length > 0;

  // Calculate expected ROI
  const calculatedROI = useMemo(() => {
    const investment = (cycle.offerAmount || 0) + (cycle.renovationBudget || 0);
    const expectedReturn = cycle.expectedResaleValue || 0;
    if (investment > 0 && expectedReturn > 0) {
      return ((expectedReturn - investment) / investment) * 100;
    }
    return null;
  }, [cycle.offerAmount, cycle.renovationBudget, cycle.expectedResaleValue]);

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`rounded-lg border p-4 ${hasRecordedCosts
        ? 'bg-green-50 border-green-200'
        : 'bg-amber-50 border-amber-200'
        }`}>
        <div className="flex items-start gap-3">
          <Receipt className={`h-5 w-5 mt-0.5 ${hasRecordedCosts ? 'text-green-600' : 'text-amber-600'
            }`} />
          <div className="flex-1">
            {hasRecordedCosts ? (
              <>
                <p className="font-medium text-green-900">
                  Acquisition Costs Recorded
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {cycleTransactions.length} transaction{cycleTransactions.length > 1 ? 's' : ''} recorded for this purchase. Financial tracking is active.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-amber-900">
                  Acquisition Costs Not Recorded
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Record acquisition costs to enable financial tracking and P&L calculations.
                </p>
              </>
            )}
          </div>
          {!hasRecordedCosts && onAddAcquisitionCost && (
            <Button size="sm" onClick={onAddAcquisitionCost}>
              <Plus className="h-4 w-4 mr-2" />
              Record Costs
            </Button>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Purchase Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Offered Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(cycle.offerAmount || 0)}</p>
            {cycle.renovationBudget && cycle.renovationBudget > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                + Renovation: {formatPKR(cycle.renovationBudget)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recorded Investment */}
        {hasRecordedCosts && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-600" />
                Total Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-blue-600">
                {formatPKR(financials.totalAcquisitionCost)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Based on {cycleTransactions.length} transaction{cycleTransactions.length > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Expected ROI */}
        {calculatedROI !== null && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Expected ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-green-600">
                {calculatedROI.toFixed(2)}%
              </p>
              {cycle.expectedResaleValue && (
                <p className="text-sm text-muted-foreground mt-2">
                  Target: {formatPKR(cycle.expectedResaleValue)}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction List */}
      {hasRecordedCosts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recorded Acquisition Costs
            </CardTitle>
            <CardDescription>
              Detailed breakdown of all acquisition-related expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cycleTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Receipt className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      {formatPKR(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border-2 border-primary/20 mt-4">
                <span className="font-semibold">Total Acquisition Cost</span>
                <span className="text-xl font-semibold text-primary">
                  {formatPKR(financials.totalAcquisitionCost)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment Summary */}
      {hasRecordedCosts && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Investment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Price</p>
                <p className="font-semibold mt-1">{formatPKR(financials.purchasePrice)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acquisition Expenses</p>
                <p className="font-semibold mt-1">{formatPKR(financials.acquisitionExpenses)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Investment</p>
                <p className="font-semibold mt-1 text-blue-600">
                  {formatPKR(financials.totalAcquisitionCost)}
                </p>
              </div>
              {cycle.targetROI && (
                <div>
                  <p className="text-sm text-muted-foreground">Target ROI</p>
                  <p className="font-semibold mt-1 text-green-600">{cycle.targetROI}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}