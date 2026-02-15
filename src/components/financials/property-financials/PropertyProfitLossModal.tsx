import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { formatPKR } from '../../../lib/currency';
import { PropertyFinancialSummary } from './PropertyFinancialList';
import { Download, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';

import { logger } from "../../../lib/logger";
interface PropertyProfitLossModalProps {
  open: boolean;
  onClose: () => void;
  property: PropertyFinancialSummary | null;
  transactions?: any[]; // AgencyTransaction[] from types
}

/**
 * PropertyProfitLossModal Component
 * 
 * Detailed Profit & Loss statement for a single property.
 * Shows acquisition costs, operating income/expenses, and sale details.
 * 
 * Design System V4.1 Compliant:
 * - Uses Shadcn Dialog and Tabs components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Jakob's Law: Standard P&L report layout
 * - Hick's Law: Tabbed interface for sections
 * - Aesthetic-Usability: Professional financial report appearance
 * 
 * Features:
 * - Acquisition cost breakdown
 * - Operating income and expenses
 * - Sale details (if sold)
 * - ROI calculation
 * - Transaction history
 * - Export to PDF (placeholder)
 * 
 * @example
 * <PropertyProfitLossModal
 *   open={showPLModal}
 *   onClose={() => setShowPLModal(false)}
 *   property={selectedProperty}
 *   transactions={propertyTransactions}
 * />
 */
export const PropertyProfitLossModal: React.FC<PropertyProfitLossModalProps> = ({
  open,
  onClose,
  property,
  transactions = [],
}) => {
  if (!property) return null;

  // Group transactions by category
  const acquisitionTransactions = transactions.filter(t => t.category === 'acquisition');
  const incomeTransactions = transactions.filter(t => t.category === 'income');
  const expenseTransactions = transactions.filter(t => t.category === 'expense');
  const saleTransactions = transactions.filter(t => t.category === 'sale');

  const acquisitionTotal = acquisitionTransactions.reduce((sum, t) => sum + t.amount, 0);
  const incomeTotal = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const saleTotal = saleTransactions.reduce((sum, t) => sum + t.amount, 0);

  const operatingProfit = incomeTotal - expenseTotal;
  const netProfit = saleTotal > 0 
    ? (saleTotal - acquisitionTotal + operatingProfit)
    : operatingProfit;

  const handleExport = () => {
    // Placeholder for PDF export
    logger.log('Export P&L Report to PDF');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profit & Loss Report</DialogTitle>
          <DialogDescription>
            {property.propertyTitle} • {property.propertyAddress}
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <p className="text-blue-700">Total Investment</p>
            </div>
            <p className="text-blue-900">{formatPKR(property.totalInvestment)}</p>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-green-700">Total Revenue</p>
            </div>
            <p className="text-green-900">{formatPKR(property.totalRevenue)}</p>
          </div>

          <div className={`p-4 rounded-lg border ${
            property.netProfit >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {property.netProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <p className={property.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}>
                Net Profit
              </p>
            </div>
            <p className={property.netProfit >= 0 ? 'text-green-900' : 'text-red-900'}>
              {formatPKR(property.netProfit)}
            </p>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="sale">Sale</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-900 mb-4">Financial Summary</h3>
              
              <div className="space-y-3">
                {/* Acquisition */}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <p className="text-gray-700">Total Acquisition Cost</p>
                  <p className="text-gray-900">{formatPKR(acquisitionTotal)}</p>
                </div>

                {/* Operating Income */}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <p className="text-gray-700">Operating Income</p>
                  <p className="text-green-600">{formatPKR(incomeTotal)}</p>
                </div>

                {/* Operating Expenses */}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <p className="text-gray-700">Operating Expenses</p>
                  <p className="text-red-600">({formatPKR(expenseTotal)})</p>
                </div>

                {/* Operating Profit */}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <p className="text-gray-700">Operating Profit</p>
                  <p className={operatingProfit >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatPKR(operatingProfit)}
                  </p>
                </div>

                {/* Sale Proceeds */}
                {saleTotal > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <p className="text-gray-700">Sale Proceeds</p>
                    <p className="text-green-600">{formatPKR(saleTotal)}</p>
                  </div>
                )}

                {/* Net Profit */}
                <div className="flex justify-between py-3 border-t-2 border-gray-300">
                  <p className="text-gray-900">Net Profit/Loss</p>
                  <p className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatPKR(netProfit)}
                  </p>
                </div>

                {/* ROI */}
                <div className="flex justify-between py-2 bg-blue-50 rounded px-3">
                  <p className="text-blue-900">Return on Investment (ROI)</p>
                  <p className="text-blue-900">{property.roi.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Acquisition Tab */}
          <TabsContent value="acquisition" className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-900 mb-4">Acquisition Costs</h3>
              
              {acquisitionTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No acquisition transactions recorded</p>
              ) : (
                <div className="space-y-2">
                  {acquisitionTransactions.map((transaction, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                      <div>
                        <p className="text-gray-900">{transaction.description}</p>
                        <p className="text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <p className="text-gray-900">{formatPKR(transaction.amount)}</p>
                    </div>
                  ))}
                  
                  <div className="flex justify-between py-3 border-t-2 border-gray-300">
                    <p className="text-gray-900">Total Acquisition Cost</p>
                    <p className="text-gray-900">{formatPKR(acquisitionTotal)}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-900 mb-4">Operating Income & Expenses</h3>
              
              {/* Income Section */}
              <div className="mb-6">
                <h4 className="text-green-700 mb-3">Income</h4>
                {incomeTransactions.length === 0 ? (
                  <p className="text-gray-500 py-2">No income transactions</p>
                ) : (
                  <div className="space-y-2">
                    {incomeTransactions.map((transaction, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                        <div>
                          <p className="text-gray-900">{transaction.description}</p>
                          <p className="text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                        <p className="text-green-600">{formatPKR(transaction.amount)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between py-2">
                      <p className="text-gray-700">Total Income</p>
                      <p className="text-green-600">{formatPKR(incomeTotal)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Expenses Section */}
              <div>
                <h4 className="text-red-700 mb-3">Expenses</h4>
                {expenseTransactions.length === 0 ? (
                  <p className="text-gray-500 py-2">No expense transactions</p>
                ) : (
                  <div className="space-y-2">
                    {expenseTransactions.map((transaction, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                        <div>
                          <p className="text-gray-900">{transaction.description}</p>
                          <p className="text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                        <p className="text-red-600">{formatPKR(transaction.amount)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between py-2">
                      <p className="text-gray-700">Total Expenses</p>
                      <p className="text-red-600">{formatPKR(expenseTotal)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Operating Profit */}
              <div className="flex justify-between py-3 mt-4 border-t-2 border-gray-300">
                <p className="text-gray-900">Operating Profit</p>
                <p className={operatingProfit >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatPKR(operatingProfit)}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Sale Tab */}
          <TabsContent value="sale" className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-gray-900 mb-4">Sale Details</h3>
              
              {saleTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">Property has not been sold yet</p>
                  <p className="text-gray-400">Sale details will appear here once the property is sold</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {saleTransactions.map((transaction, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                      <div>
                        <p className="text-gray-900">{transaction.description}</p>
                        <p className="text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <p className="text-gray-900">{formatPKR(transaction.amount)}</p>
                    </div>
                  ))}
                  
                  <div className="flex justify-between py-3 border-t-2 border-gray-300">
                    <p className="text-gray-900">Net Sale Proceeds</p>
                    <p className="text-green-600">{formatPKR(saleTotal)}</p>
                  </div>

                  {property.saleDate && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 rounded">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <p className="text-gray-700">
                        Sold on {new Date(property.saleDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
