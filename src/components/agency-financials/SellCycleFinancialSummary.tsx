/**
 * Sell Cycle Financial Summary Component
 * Displays financial tracking for sell cycles including sale transactions and profitability
 * Design System V4.1 Compliant
 */

import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  BarChart3,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { SellCycle, Property } from '../../types';
import { formatPKR } from '../../lib/currency';
// [STUBBED] import { 
// [STUBBED]   getTransactionsByProperty, 
// [STUBBED]   getTransactionsByCategory,
// [STUBBED] } from '../../lib/agencyTransactions';
// [STUBBED] import { calculatePropertyFinancials } from '../../lib/agencyFinancials';

// ===== STUBS for removed prototype functions =====
const getTransactionsByProperty = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getTransactionsByCategory = (..._args: any[]): any => { /* stub - prototype function removed */ };
const calculatePropertyFinancials = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface SellCycleFinancialSummaryProps {
  cycle: SellCycle;
  property: Property;
  onRecordSale: () => void;
}

export function SellCycleFinancialSummary({ 
  cycle, 
  property,
  onRecordSale,
}: SellCycleFinancialSummaryProps) {
  
  // Get all sale transactions for this cycle
  const saleTransactions = useMemo(() => {
    const allTransactions = getTransactionsByProperty(property.id);
    return allTransactions.filter(t => 
      t.sellCycleId === cycle.id && 
      t.category === 'sale'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [property.id, cycle.id]);

  const hasSaleRecorded = saleTransactions.length > 0;

  // Calculate sale metrics
  const saleMetrics = useMemo(() => {
    if (!hasSaleRecorded) {
      return {
        salePrice: 0,
        saleExpenses: 0,
        netProceeds: 0,
        saleCommission: 0,
        closingCosts: 0,
      };
    }

    const salePrice = saleTransactions
      .filter(t => t.type === 'sale_price')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const saleCommission = saleTransactions
      .filter(t => t.type === 'sale_commission')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const closingCosts = saleTransactions
      .filter(t => t.type === 'closing_costs')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const saleExpenses = saleCommission + closingCosts;
    const netProceeds = salePrice - saleExpenses;

    return {
      salePrice,
      saleExpenses,
      netProceeds,
      saleCommission,
      closingCosts,
    };
  }, [saleTransactions, hasSaleRecorded]);

  // Calculate complete profitability (if sale is recorded)
  const profitability = useMemo(() => {
    if (!hasSaleRecorded) return null;

    // Get property financials up to sale date
    const saleDate = saleTransactions.find(t => t.type === 'sale_price')?.date || new Date().toISOString().split('T')[0];
    const financials = calculatePropertyFinancials(
      property.id,
      property.title,
      property.createdAt
    );

    const capitalGain = saleMetrics.netProceeds - financials.totalAcquisitionCost;
    const totalProfit = capitalGain + financials.operatingProfit;
    
    // Calculate ROI
    const roi = financials.totalAcquisitionCost > 0 
      ? (totalProfit / financials.totalAcquisitionCost) * 100 
      : 0;

    // Calculate holding period
    const acquireDate = new Date(property.createdAt);
    const sellDate = new Date(saleDate);
    const holdingDays = Math.floor((sellDate.getTime() - acquireDate.getTime()) / (1000 * 60 * 60 * 24));
    const holdingYears = holdingDays / 365;
    const annualizedROI = holdingYears > 0 ? roi / holdingYears : roi;

    return {
      acquisitionCost: financials.totalAcquisitionCost,
      operatingProfit: financials.operatingProfit,
      totalIncome: financials.totalIncome,
      totalExpenses: financials.totalExpenses,
      capitalGain,
      totalProfit,
      roi,
      annualizedROI,
      holdingDays,
      holdingYears,
    };
  }, [hasSaleRecorded, saleTransactions, property, saleMetrics]);

  // Get transaction type label
  const getTransactionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      sale_price: 'Sale Price',
      sale_commission: 'Sale Commission',
      closing_costs: 'Closing Costs',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`rounded-lg border p-4 ${
        hasSaleRecorded 
          ? 'bg-green-50 border-green-200' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {hasSaleRecorded ? (
              <CheckCircle className="size-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="size-5 text-amber-600 mt-0.5" />
            )}
            <div>
              <h3 className={`font-medium ${
                hasSaleRecorded ? 'text-green-900' : 'text-amber-900'
              }`}>
                {hasSaleRecorded 
                  ? 'Sale Completed & Recorded' 
                  : 'Sale Not Recorded Yet'
                }
              </h3>
              <p className={`text-sm mt-1 ${
                hasSaleRecorded ? 'text-green-700' : 'text-amber-700'
              }`}>
                {hasSaleRecorded 
                  ? `${saleTransactions.length} transaction${saleTransactions.length !== 1 ? 's' : ''} recorded on ${new Date(saleTransactions[0]?.date).toLocaleDateString()}`
                  : 'Record the final sale price and associated costs to calculate profitability'
                }
              </p>
            </div>
          </div>
          {!hasSaleRecorded && (
            <Button 
              onClick={onRecordSale}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              <Plus className="size-4 mr-2" />
              Record Sale
            </Button>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Asking Price */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="size-4" />
              Asking Price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(cycle.askingPrice)}</p>
            {cycle.listedDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Listed {new Date(cycle.listedDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actual Sale Price */}
        {hasSaleRecorded && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-green-700">
                <TrendingUp className="size-4" />
                Actual Sale Price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-green-900">
                {formatPKR(saleMetrics.salePrice)}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Net: {formatPKR(saleMetrics.netProceeds)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Profitability */}
        {profitability && (
          <Card className={`border-l-4 ${
            profitability.totalProfit >= 0 
              ? 'border-l-green-500 bg-green-50/50' 
              : 'border-l-red-500 bg-red-50/50'
          }`}>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="size-4" />
                Total {profitability.totalProfit >= 0 ? 'Profit' : 'Loss'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-semibold ${
                profitability.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPKR(Math.abs(profitability.totalProfit))}
              </p>
              <p className={`text-xs mt-1 ${
                profitability.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                ROI: {profitability.roi.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sale Transaction Details */}
      {hasSaleRecorded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Sale Transaction Details
            </CardTitle>
            <CardDescription>
              Recorded sale transactions for this sell cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transaction List */}
            <div className="space-y-2">
              {saleTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${
                      transaction.type === 'sale_price'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}>
                      {transaction.type === 'sale_price' ? (
                        <DollarSign className="size-4 text-green-600" />
                      ) : (
                        <TrendingDown className="size-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {getTransactionTypeLabel(transaction.type)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="size-3" />
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'sale_price'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'sale_price' ? '+' : '-'}
                      {formatPKR(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Total Summary */}
              <div className="flex items-center justify-between p-3 rounded-lg border-2 border-primary bg-muted/50 font-semibold">
                <span>Net Sale Proceeds</span>
                <span className="text-green-600 text-lg">
                  {formatPKR(saleMetrics.netProceeds)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profitability Breakdown */}
      {profitability && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Complete Profitability Analysis
            </CardTitle>
            <CardDescription>
              Full profit/loss breakdown from acquisition to sale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Acquisition */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Acquisition</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Acquisition Cost</span>
                <span className="font-semibold">{formatPKR(profitability.acquisitionCost)}</span>
              </div>
            </div>

            {/* Operations */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Operations (During Ownership)</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Income:</span>
                  <span className="text-green-600">{formatPKR(profitability.totalIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Expenses:</span>
                  <span className="text-red-600">-{formatPKR(profitability.totalExpenses)}</span>
                </div>
                <div className="flex justify-between font-medium pt-1 border-t">
                  <span>Net Operations:</span>
                  <span className={profitability.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPKR(profitability.operatingProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sale */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Sale Transaction</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sale Price:</span>
                  <span className="text-green-600">{formatPKR(saleMetrics.salePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sale Expenses:</span>
                  <span className="text-red-600">-{formatPKR(saleMetrics.saleExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Less: Acquisition Cost:</span>
                  <span className="text-red-600">-{formatPKR(profitability.acquisitionCost)}</span>
                </div>
                <div className="flex justify-between font-medium pt-1 border-t">
                  <span>Capital Gain:</span>
                  <span className={profitability.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPKR(profitability.capitalGain)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Profit/Loss */}
            <div className={`rounded-lg border-2 p-4 ${
              profitability.totalProfit >= 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {profitability.totalProfit >= 0 ? (
                    <TrendingUp className="size-5 text-green-600" />
                  ) : (
                    <TrendingDown className="size-5 text-red-600" />
                  )}
                  <span className="font-semibold">
                    TOTAL {profitability.totalProfit >= 0 ? 'PROFIT' : 'LOSS'}
                  </span>
                </div>
                <span className={`text-xl font-bold ${
                  profitability.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPKR(Math.abs(profitability.totalProfit))}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-current/20">
                <div>
                  <p className="text-xs text-muted-foreground">ROI</p>
                  <p className={`font-semibold ${
                    profitability.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {profitability.roi.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Annualized ROI</p>
                  <p className={`font-semibold ${
                    profitability.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {profitability.annualizedROI.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Holding Period</p>
                  <p className="font-semibold">
                    {profitability.holdingDays} days
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({(profitability.holdingDays / 30).toFixed(1)} months)
                  </p>
                </div>
              </div>
            </div>

            {/* Profit Sources */}
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Profit Sources</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">From Capital Gain:</span>
                  <span className={`font-medium ${
                    profitability.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPKR(profitability.capitalGain)} 
                    ({((profitability.capitalGain / (Math.abs(profitability.totalProfit) || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">From Operations:</span>
                  <span className={`font-medium ${
                    profitability.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPKR(profitability.operatingProfit)} 
                    ({((profitability.operatingProfit / (Math.abs(profitability.totalProfit) || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      {!hasSaleRecorded && cycle.status === 'sold' && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 mb-1">
                  Action Required: Record Sale Details
                </p>
                <p className="text-sm text-amber-700 mb-3">
                  This sell cycle is marked as sold, but the sale transactions haven't been recorded yet. 
                  Record the sale price and associated costs to generate complete profitability analysis.
                </p>
                <Button 
                  onClick={onRecordSale}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="size-4 mr-2" />
                  Record Sale Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}