import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface CashFlowProps {
  currentPeriodData: any;
  comparisonData: any;
  filters: any;
  calculateVariance: (current: number, comparison: number) => { amount: number; percentage: number };
}

export const CashFlowEnhanced: React.FC<CashFlowProps> = ({
  currentPeriodData,
  comparisonData,
  filters,
  calculateVariance
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-2xl">Statement of Cash Flows - Real Estate Development</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-800">
            {format(filters.dateRange.from, 'MMM dd')} - {format(filters.dateRange.to, 'MMM dd, yyyy')}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground">
        Analysis of cash receipts and payments from operating, investing, and financing activities
      </p>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-lg">Cash Flow Activities</TableHead>
            <TableHead className="text-right font-bold">Current Period</TableHead>
            {filters.comparisonPeriod && (
              <>
                <TableHead className="text-right font-bold">Previous Period</TableHead>
                <TableHead className="text-right font-bold">Variance</TableHead>
                <TableHead className="text-right font-bold">% Change</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* OPERATING ACTIVITIES */}
          <TableRow className="bg-green-50">
            <TableCell className="font-bold text-lg text-green-800">CASH FLOW FROM OPERATING ACTIVITIES</TableCell>
            <TableCell></TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-8">Net Income</TableCell>
            <TableCell className="text-right">${currentPeriodData.cashFlow.operating.netIncome.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right">${comparisonData.cashFlow.operating.netIncome.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.operating.netIncome, comparisonData.cashFlow.operating.netIncome).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.operating.netIncome, comparisonData.cashFlow.operating.netIncome).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.operating.netIncome, comparisonData.cashFlow.operating.netIncome).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>

          <TableRow className="bg-gray-50">
            <TableCell className="pl-6 font-medium">Adjustments to reconcile net income:</TableCell>
            <TableCell></TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-12">Depreciation & Amortization</TableCell>
            <TableCell className="text-right">${currentPeriodData.cashFlow.operating.depreciation.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right">${comparisonData.cashFlow.operating.depreciation.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.operating.depreciation, comparisonData.cashFlow.operating.depreciation).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.operating.depreciation, comparisonData.cashFlow.operating.depreciation).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.operating.depreciation, comparisonData.cashFlow.operating.depreciation).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>

          <TableRow className="bg-gray-50">
            <TableCell className="pl-6 font-medium">Changes in working capital:</TableCell>
            <TableCell></TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-12">(Increase) / Decrease in Accounts Receivable</TableCell>
            <TableCell className={`text-right ${currentPeriodData.cashFlow.operating.accountsReceivableChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${currentPeriodData.cashFlow.operating.accountsReceivableChange.toLocaleString()}
            </TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className={`text-right ${comparisonData.cashFlow.operating.accountsReceivableChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${comparisonData.cashFlow.operating.accountsReceivableChange.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.operating.accountsReceivableChange, comparisonData.cashFlow.operating.accountsReceivableChange).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.operating.accountsReceivableChange, comparisonData.cashFlow.operating.accountsReceivableChange).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.operating.accountsReceivableChange, comparisonData.cashFlow.operating.accountsReceivableChange).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-12">(Increase) / Decrease in Inventory & WIP</TableCell>
            <TableCell className={`text-right ${currentPeriodData.cashFlow.operating.inventoryChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${currentPeriodData.cashFlow.operating.inventoryChange.toLocaleString()}
            </TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className={`text-right ${comparisonData.cashFlow.operating.inventoryChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${comparisonData.cashFlow.operating.inventoryChange.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.operating.inventoryChange, comparisonData.cashFlow.operating.inventoryChange).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.operating.inventoryChange, comparisonData.cashFlow.operating.inventoryChange).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.operating.inventoryChange, comparisonData.cashFlow.operating.inventoryChange).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-12">Increase / (Decrease) in Accounts Payable</TableCell>
            <TableCell className={`text-right ${currentPeriodData.cashFlow.operating.accountsPayableChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${currentPeriodData.cashFlow.operating.accountsPayableChange.toLocaleString()}
            </TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className={`text-right ${comparisonData.cashFlow.operating.accountsPayableChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${comparisonData.cashFlow.operating.accountsPayableChange.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.operating.accountsPayableChange, comparisonData.cashFlow.operating.accountsPayableChange).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.operating.accountsPayableChange, comparisonData.cashFlow.operating.accountsPayableChange).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.operating.accountsPayableChange, comparisonData.cashFlow.operating.accountsPayableChange).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow className="border-t-2 font-bold bg-green-100">
            <TableCell>Net Cash from Operating Activities</TableCell>
            <TableCell className={`text-right ${currentPeriodData.cashFlow.operating.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${currentPeriodData.cashFlow.operating.total.toLocaleString()}
            </TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className={`text-right ${comparisonData.cashFlow.operating.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${comparisonData.cashFlow.operating.total.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.operating.total, comparisonData.cashFlow.operating.total).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.operating.total, comparisonData.cashFlow.operating.total).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.operating.total, comparisonData.cashFlow.operating.total).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>

          {/* INVESTING ACTIVITIES */}
          <TableRow className="bg-blue-50">
            <TableCell className="font-bold text-lg text-blue-800">CASH FLOW FROM INVESTING ACTIVITIES</TableCell>
            <TableCell></TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-8">Property Acquisitions & Land Purchases</TableCell>
            <TableCell className="text-right text-red-600">${currentPeriodData.cashFlow.investing.propertyAcquisitions.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right text-red-600">${comparisonData.cashFlow.investing.propertyAcquisitions.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.investing.propertyAcquisitions, comparisonData.cashFlow.investing.propertyAcquisitions).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.investing.propertyAcquisitions, comparisonData.cashFlow.investing.propertyAcquisitions).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.investing.propertyAcquisitions, comparisonData.cashFlow.investing.propertyAcquisitions).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-8">Construction & Development Capital Expenditures</TableCell>
            <TableCell className="text-right text-red-600">${currentPeriodData.cashFlow.investing.constructionCapex.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right text-red-600">${comparisonData.cashFlow.investing.constructionCapex.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.investing.constructionCapex, comparisonData.cashFlow.investing.constructionCapex).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.investing.constructionCapex, comparisonData.cashFlow.investing.constructionCapex).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.investing.constructionCapex, comparisonData.cashFlow.investing.constructionCapex).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-8">Equipment & Machinery Purchases</TableCell>
            <TableCell className="text-right text-red-600">${currentPeriodData.cashFlow.investing.equipmentPurchases.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right text-red-600">${comparisonData.cashFlow.investing.equipmentPurchases.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.investing.equipmentPurchases, comparisonData.cashFlow.investing.equipmentPurchases).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.investing.equipmentPurchases, comparisonData.cashFlow.investing.equipmentPurchases).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.investing.equipmentPurchases, comparisonData.cashFlow.investing.equipmentPurchases).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow className="border-t-2 font-bold bg-blue-100">
            <TableCell>Net Cash from Investing Activities</TableCell>
            <TableCell className={`text-right ${currentPeriodData.cashFlow.investing.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${currentPeriodData.cashFlow.investing.total.toLocaleString()}
            </TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className={`text-right ${comparisonData.cashFlow.investing.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${comparisonData.cashFlow.investing.total.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.investing.total, comparisonData.cashFlow.investing.total).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.investing.total, comparisonData.cashFlow.investing.total).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.investing.total, comparisonData.cashFlow.investing.total).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>

          {/* FINANCING ACTIVITIES */}
          <TableRow className="bg-purple-50">
            <TableCell className="font-bold text-lg text-purple-800">CASH FLOW FROM FINANCING ACTIVITIES</TableCell>
            <TableCell></TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-8">Proceeds from Construction Loans & Financing</TableCell>
            <TableCell className="text-right text-green-600">${currentPeriodData.cashFlow.financing.loanProceeds.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right text-green-600">${comparisonData.cashFlow.financing.loanProceeds.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.financing.loanProceeds, comparisonData.cashFlow.financing.loanProceeds).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.financing.loanProceeds, comparisonData.cashFlow.financing.loanProceeds).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.financing.loanProceeds, comparisonData.cashFlow.financing.loanProceeds).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-8">Loan Repayments & Interest Payments</TableCell>
            <TableCell className="text-right text-red-600">${currentPeriodData.cashFlow.financing.loanRepayments.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right text-red-600">${comparisonData.cashFlow.financing.loanRepayments.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.financing.loanRepayments, comparisonData.cashFlow.financing.loanRepayments).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.financing.loanRepayments, comparisonData.cashFlow.financing.loanRepayments).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.financing.loanRepayments, comparisonData.cashFlow.financing.loanRepayments).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-8">Owner Contributions & Capital Injections</TableCell>
            <TableCell className="text-right text-green-600">${currentPeriodData.cashFlow.financing.ownerContributions.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right text-green-600">${comparisonData.cashFlow.financing.ownerContributions.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.financing.ownerContributions, comparisonData.cashFlow.financing.ownerContributions).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.financing.ownerContributions, comparisonData.cashFlow.financing.ownerContributions).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.financing.ownerContributions, comparisonData.cashFlow.financing.ownerContributions).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow>
            <TableCell className="pl-8">Dividends & Distributions Paid</TableCell>
            <TableCell className="text-right text-red-600">${currentPeriodData.cashFlow.financing.dividendsPaid.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right text-red-600">${comparisonData.cashFlow.financing.dividendsPaid.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.financing.dividendsPaid, comparisonData.cashFlow.financing.dividendsPaid).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.financing.dividendsPaid, comparisonData.cashFlow.financing.dividendsPaid).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.financing.dividendsPaid, comparisonData.cashFlow.financing.dividendsPaid).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow className="border-t-2 font-bold bg-purple-100">
            <TableCell>Net Cash from Financing Activities</TableCell>
            <TableCell className={`text-right ${currentPeriodData.cashFlow.financing.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${currentPeriodData.cashFlow.financing.total.toLocaleString()}
            </TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className={`text-right ${comparisonData.cashFlow.financing.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${comparisonData.cashFlow.financing.total.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.financing.total, comparisonData.cashFlow.financing.total).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.financing.total, comparisonData.cashFlow.financing.total).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.financing.total, comparisonData.cashFlow.financing.total).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>

          {/* NET CHANGE IN CASH */}
          <TableRow className="bg-gray-100 border-t-4 border-t-gray-600 font-bold text-lg">
            <TableCell>NET CHANGE IN CASH & CASH EQUIVALENTS</TableCell>
            <TableCell className={`text-right ${currentPeriodData.cashFlow.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currentPeriodData.cashFlow.netChange >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
              ${currentPeriodData.cashFlow.netChange.toLocaleString()}
            </TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className={`text-right ${comparisonData.cashFlow.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comparisonData.cashFlow.netChange >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                  ${comparisonData.cashFlow.netChange.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-bold">
                  ${calculateVariance(currentPeriodData.cashFlow.netChange, comparisonData.cashFlow.netChange).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.netChange, comparisonData.cashFlow.netChange).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.netChange, comparisonData.cashFlow.netChange).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>

          {/* CASH RECONCILIATION */}
          <TableRow className="bg-gray-50">
            <TableCell className="font-medium">Cash & Cash Equivalents at Beginning of Period</TableCell>
            <TableCell className="text-right">${currentPeriodData.cashFlow.cashBeginning.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right">${comparisonData.cashFlow.cashBeginning.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  ${calculateVariance(currentPeriodData.cashFlow.cashBeginning, comparisonData.cashFlow.cashBeginning).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.cashBeginning, comparisonData.cashFlow.cashBeginning).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.cashBeginning, comparisonData.cashFlow.cashBeginning).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
          
          <TableRow className="bg-blue-100 border-t-2 border-t-blue-600 font-bold text-lg">
            <TableCell className="text-blue-800">CASH & CASH EQUIVALENTS AT END OF PERIOD</TableCell>
            <TableCell className="text-right text-blue-800">${currentPeriodData.cashFlow.cashEnding.toLocaleString()}</TableCell>
            {filters.comparisonPeriod && (
              <>
                <TableCell className="text-right text-blue-800">${comparisonData.cashFlow.cashEnding.toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold">
                  ${calculateVariance(currentPeriodData.cashFlow.cashEnding, comparisonData.cashFlow.cashEnding).amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span className={calculateVariance(currentPeriodData.cashFlow.cashEnding, comparisonData.cashFlow.cashEnding).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {calculateVariance(currentPeriodData.cashFlow.cashEnding, comparisonData.cashFlow.cashEnding).percentage.toFixed(1)}%
                  </span>
                </TableCell>
              </>
            )}
          </TableRow>
        </TableBody>
      </Table>

      {/* Cash Flow Analysis */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operating Cash Flow Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operating Cash Flow Margin</span>
                <span className="font-medium">
                  {((currentPeriodData.cashFlow.operating.total / currentPeriodData.revenue.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Conversion Efficiency</span>
                <span className="font-medium">
                  {((currentPeriodData.cashFlow.operating.total / currentPeriodData.cashFlow.operating.netIncome) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment Activity Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capital Expenditure Intensity</span>
                <span className="font-medium">
                  {((Math.abs(currentPeriodData.cashFlow.investing.total) / currentPeriodData.revenue.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Development vs Acquisition</span>
                <span className="font-medium">
                  {(Math.abs(currentPeriodData.cashFlow.investing.constructionCapex) / Math.abs(currentPeriodData.cashFlow.investing.propertyAcquisitions)).toFixed(2)}x
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financing Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">External Financing Ratio</span>
                <span className="font-medium">
                  {((currentPeriodData.cashFlow.financing.loanProceeds / (currentPeriodData.cashFlow.financing.loanProceeds + currentPeriodData.cashFlow.financing.ownerContributions)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Financing Cash Flow</span>
                <span className={`font-medium ${currentPeriodData.cashFlow.financing.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${currentPeriodData.cashFlow.financing.total.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
);