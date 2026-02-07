import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

interface BalanceSheetProps {
  currentPeriodData: any;
  comparisonData: any;
  filters: any;
  calculateVariance: (current: number, comparison: number) => { amount: number; percentage: number };
}

export const BalanceSheetEnhanced: React.FC<BalanceSheetProps> = ({
  currentPeriodData,
  comparisonData,
  filters,
  calculateVariance
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-2xl">Balance Sheet - Real Estate Development</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            As of {format(filters.dateRange.to, 'MMM dd, yyyy')}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground">
        Financial position showing assets, liabilities, and equity for real estate development operations
      </p>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ASSETS SECTION */}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-lg text-blue-800">ASSETS</TableHead>
                <TableHead className="text-right font-bold">Current Period</TableHead>
                {filters.comparisonPeriod && (
                  <>
                    <TableHead className="text-right font-bold">Previous Period</TableHead>
                    <TableHead className="text-right font-bold">% Change</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Current Assets */}
              <TableRow className="bg-blue-50">
                <TableCell className="font-bold">Current Assets</TableCell>
                <TableCell></TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Cash & Bank</TableCell>
                <TableCell className="text-right">${currentPeriodData.assets.current.cashBank.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.assets.current.cashBank.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.current.cashBank, comparisonData.assets.current.cashBank).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.current.cashBank, comparisonData.assets.current.cashBank).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Accounts Receivable</TableCell>
                <TableCell className="text-right">${currentPeriodData.assets.current.accountsReceivable.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.assets.current.accountsReceivable.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.current.accountsReceivable, comparisonData.assets.current.accountsReceivable).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.current.accountsReceivable, comparisonData.assets.current.accountsReceivable).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Work-in-Progress (WIP)</TableCell>
                <TableCell className="text-right">${currentPeriodData.assets.current.workInProgress.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.assets.current.workInProgress.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.current.workInProgress, comparisonData.assets.current.workInProgress).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.current.workInProgress, comparisonData.assets.current.workInProgress).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Unsold Inventory</TableCell>
                <TableCell className="text-right">${currentPeriodData.assets.current.unsoldInventory.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.assets.current.unsoldInventory.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.current.unsoldInventory, comparisonData.assets.current.unsoldInventory).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.current.unsoldInventory, comparisonData.assets.current.unsoldInventory).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow className="border-t-2 font-bold bg-blue-100">
                <TableCell>Total Current Assets</TableCell>
                <TableCell className="text-right">${currentPeriodData.assets.current.total.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.assets.current.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.current.total, comparisonData.assets.current.total).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.current.total, comparisonData.assets.current.total).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>

              {/* Fixed Assets */}
              <TableRow className="bg-green-50">
                <TableCell className="font-bold">Non-Current Assets</TableCell>
                <TableCell></TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Land & Development Rights</TableCell>
                <TableCell className="text-right">${currentPeriodData.assets.fixed.land.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.assets.fixed.land.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.fixed.land, comparisonData.assets.fixed.land).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.fixed.land, comparisonData.assets.fixed.land).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Buildings & Improvements</TableCell>
                <TableCell className="text-right">${currentPeriodData.assets.fixed.buildings.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.assets.fixed.buildings.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.fixed.buildings, comparisonData.assets.fixed.buildings).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.fixed.buildings, comparisonData.assets.fixed.buildings).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Equipment & Machinery</TableCell>
                <TableCell className="text-right">${currentPeriodData.assets.fixed.equipment.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.assets.fixed.equipment.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.fixed.equipment, comparisonData.assets.fixed.equipment).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.fixed.equipment, comparisonData.assets.fixed.equipment).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow className="border-t-2 font-bold bg-green-100">
                <TableCell>Total Non-Current Assets</TableCell>
                <TableCell className="text-right">${currentPeriodData.assets.fixed.total.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.assets.fixed.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.fixed.total, comparisonData.assets.fixed.total).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.fixed.total, comparisonData.assets.fixed.total).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>

              {/* Total Assets */}
              <TableRow className="bg-blue-100 border-t-4 border-t-blue-600 font-bold text-lg">
                <TableCell className="text-blue-800">TOTAL ASSETS</TableCell>
                <TableCell className="text-right text-blue-800">${currentPeriodData.assets.total.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right text-blue-800">${comparisonData.assets.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.assets.total, comparisonData.assets.total).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.assets.total, comparisonData.assets.total).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* LIABILITIES & EQUITY SECTION */}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-lg text-red-800">LIABILITIES & EQUITY</TableHead>
                <TableHead className="text-right font-bold">Current Period</TableHead>
                {filters.comparisonPeriod && (
                  <>
                    <TableHead className="text-right font-bold">Previous Period</TableHead>
                    <TableHead className="text-right font-bold">% Change</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Current Liabilities */}
              <TableRow className="bg-red-50">
                <TableCell className="font-bold">Current Liabilities</TableCell>
                <TableCell></TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Accounts Payable</TableCell>
                <TableCell className="text-right">${currentPeriodData.liabilities.current.accountsPayable.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.liabilities.current.accountsPayable.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.liabilities.current.accountsPayable, comparisonData.liabilities.current.accountsPayable).percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {calculateVariance(currentPeriodData.liabilities.current.accountsPayable, comparisonData.liabilities.current.accountsPayable).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Short-term Debt</TableCell>
                <TableCell className="text-right">${currentPeriodData.liabilities.current.shortTermDebt.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.liabilities.current.shortTermDebt.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.liabilities.current.shortTermDebt, comparisonData.liabilities.current.shortTermDebt).percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {calculateVariance(currentPeriodData.liabilities.current.shortTermDebt, comparisonData.liabilities.current.shortTermDebt).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Accrued Expenses</TableCell>
                <TableCell className="text-right">${currentPeriodData.liabilities.current.accruedExpenses.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.liabilities.current.accruedExpenses.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.liabilities.current.accruedExpenses, comparisonData.liabilities.current.accruedExpenses).percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {calculateVariance(currentPeriodData.liabilities.current.accruedExpenses, comparisonData.liabilities.current.accruedExpenses).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Customer Deposits</TableCell>
                <TableCell className="text-right">${currentPeriodData.liabilities.current.customerDeposits.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.liabilities.current.customerDeposits.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.liabilities.current.customerDeposits, comparisonData.liabilities.current.customerDeposits).percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {calculateVariance(currentPeriodData.liabilities.current.customerDeposits, comparisonData.liabilities.current.customerDeposits).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow className="border-t-2 font-bold bg-red-100">
                <TableCell>Total Current Liabilities</TableCell>
                <TableCell className="text-right">${currentPeriodData.liabilities.current.total.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.liabilities.current.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.liabilities.current.total, comparisonData.liabilities.current.total).percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {calculateVariance(currentPeriodData.liabilities.current.total, comparisonData.liabilities.current.total).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>

              {/* Long-term Liabilities */}
              <TableRow className="bg-orange-50">
                <TableCell className="font-bold">Long-term Liabilities</TableCell>
                <TableCell></TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Construction Loans</TableCell>
                <TableCell className="text-right">${currentPeriodData.liabilities.longTerm.constructionLoans.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.liabilities.longTerm.constructionLoans.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.liabilities.longTerm.constructionLoans, comparisonData.liabilities.longTerm.constructionLoans).percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {calculateVariance(currentPeriodData.liabilities.longTerm.constructionLoans, comparisonData.liabilities.longTerm.constructionLoans).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Mortgage Payable</TableCell>
                <TableCell className="text-right">${currentPeriodData.liabilities.longTerm.mortgagePayable.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.liabilities.longTerm.mortgagePayable.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.liabilities.longTerm.mortgagePayable, comparisonData.liabilities.longTerm.mortgagePayable).percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {calculateVariance(currentPeriodData.liabilities.longTerm.mortgagePayable, comparisonData.liabilities.longTerm.mortgagePayable).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow className="border-t-2 font-bold bg-orange-100">
                <TableCell>Total Long-term Liabilities</TableCell>
                <TableCell className="text-right">${currentPeriodData.liabilities.longTerm.total.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.liabilities.longTerm.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.liabilities.longTerm.total, comparisonData.liabilities.longTerm.total).percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {calculateVariance(currentPeriodData.liabilities.longTerm.total, comparisonData.liabilities.longTerm.total).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>

              {/* Total Liabilities */}
              <TableRow className="border-t-2 font-bold bg-red-200">
                <TableCell>TOTAL LIABILITIES</TableCell>
                <TableCell className="text-right">${currentPeriodData.liabilities.total.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.liabilities.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.liabilities.total, comparisonData.liabilities.total).percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {calculateVariance(currentPeriodData.liabilities.total, comparisonData.liabilities.total).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>

              {/* Equity */}
              <TableRow className="bg-green-50">
                <TableCell className="font-bold">Equity</TableCell>
                <TableCell></TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Paid-in Capital</TableCell>
                <TableCell className="text-right">${currentPeriodData.equity.paidInCapital.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.equity.paidInCapital.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.equity.paidInCapital, comparisonData.equity.paidInCapital).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.equity.paidInCapital, comparisonData.equity.paidInCapital).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow>
                <TableCell className="pl-8">Retained Earnings</TableCell>
                <TableCell className="text-right">${currentPeriodData.equity.retainedEarnings.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.equity.retainedEarnings.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.equity.retainedEarnings, comparisonData.equity.retainedEarnings).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.equity.retainedEarnings, comparisonData.equity.retainedEarnings).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
              
              <TableRow className="border-t-2 font-bold bg-green-100">
                <TableCell>TOTAL EQUITY</TableCell>
                <TableCell className="text-right">${currentPeriodData.equity.total.toLocaleString()}</TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right">${comparisonData.equity.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(currentPeriodData.equity.total, comparisonData.equity.total).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(currentPeriodData.equity.total, comparisonData.equity.total).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>

              {/* Total Liabilities & Equity */}
              <TableRow className="bg-purple-100 border-t-4 border-t-purple-600 font-bold text-lg">
                <TableCell className="text-purple-800">TOTAL LIABILITIES & EQUITY</TableCell>
                <TableCell className="text-right text-purple-800">
                  ${(currentPeriodData.liabilities.total + currentPeriodData.equity.total).toLocaleString()}
                </TableCell>
                {filters.comparisonPeriod && (
                  <>
                    <TableCell className="text-right text-purple-800">
                      ${(comparisonData.liabilities.total + comparisonData.equity.total).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={calculateVariance(
                        currentPeriodData.liabilities.total + currentPeriodData.equity.total,
                        comparisonData.liabilities.total + comparisonData.equity.total
                      ).percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {calculateVariance(
                          currentPeriodData.liabilities.total + currentPeriodData.equity.total,
                          comparisonData.liabilities.total + comparisonData.equity.total
                        ).percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Balance Sheet Analysis */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liquidity Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Ratio</span>
                <span className="font-medium">
                  {(currentPeriodData.assets.current.total / currentPeriodData.liabilities.current.total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash to Current Liabilities</span>
                <span className="font-medium">
                  {(currentPeriodData.assets.current.cashBank / currentPeriodData.liabilities.current.total * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leverage Ratios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debt-to-Equity</span>
                <span className="font-medium">
                  {(currentPeriodData.liabilities.total / currentPeriodData.equity.total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debt-to-Assets</span>
                <span className="font-medium">
                  {(currentPeriodData.liabilities.total / currentPeriodData.assets.total * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asset Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Assets %</span>
                <span className="font-medium">
                  {(currentPeriodData.assets.current.total / currentPeriodData.assets.total * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inventory/WIP %</span>
                <span className="font-medium">
                  {((currentPeriodData.assets.current.workInProgress + currentPeriodData.assets.current.unsoldInventory) / currentPeriodData.assets.total * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
);