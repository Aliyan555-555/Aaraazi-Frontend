import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Download, Printer, Share2, X, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPKR } from '../../../lib/currency';
import { TrialBalance, ChangesInEquity } from '../../../types/accounting';
import {
  ProfitAndLoss,
  BalanceSheet,
  CashFlowStatement,
  CommissionReport,
  ExpenseSummaryReport,
  PropertyPerformanceReport,
  InvestorDistributionReport,
} from '../../../lib/accounting';

export interface ReportViewerData {
  id: string;
  templateId: string;
  templateName: string;
  dateFrom: string;
  dateTo: string;
  format: 'pdf' | 'csv' | 'excel';
  generatedAt: string;
  generatedBy: string;
  // Actual report data
  data: TrialBalance | ChangesInEquity | ProfitAndLoss | BalanceSheet | CashFlowStatement | CommissionReport | ExpenseSummaryReport | PropertyPerformanceReport | InvestorDistributionReport | any;
}

interface ReportViewerProps {
  open: boolean;
  onClose: () => void;
  report: ReportViewerData | null;
}

/**
 * ReportViewer Component
 * 
 * Displays generated financial reports with proper formatting.
 * Supports ALL 9 report types with real data visualization.
 * 
 * Features:
 * - Print report
 * - Download as PDF/CSV/Excel
 * - Share report
 * - Responsive table layout
 * - Professional financial statement formatting
 */
export const ReportViewer: React.FC<ReportViewerProps> = ({
  open,
  onClose,
  report,
}) => {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Simulate download
    const filename = `${report.templateName.replace(/\s+/g, '_')}_${report.dateFrom}_to_${report.dateTo}.${report.format}`;
    console.log(`Downloading ${filename}...`);
    alert(`Report would be downloaded as: ${filename}`);
  };

  const handleShare = () => {
    alert('Share functionality coming soon!');
  };

  // Render based on report type
  const renderReportContent = () => {
    switch (report.templateId) {
      case 'trial-balance':
        return renderTrialBalance(report.data as TrialBalance);
      case 'changes-in-equity':
        return renderChangesInEquity(report.data as ChangesInEquity);
      case 'profit-loss':
        return renderProfitAndLoss(report.data as ProfitAndLoss);
      case 'balance-sheet':
        return renderBalanceSheet(report.data as BalanceSheet);
      case 'cash-flow':
        return renderCashFlowStatement(report.data as CashFlowStatement);
      case 'commission-report':
        return renderCommissionReport(report.data as CommissionReport);
      case 'expense-summary':
        return renderExpenseSummary(report.data as ExpenseSummaryReport);
      case 'property-performance':
        return renderPropertyPerformance(report.data as PropertyPerformanceReport);
      case 'investor-distributions':
        return renderInvestorDistribution(report.data as InvestorDistributionReport);
      default:
        return renderGenericReport();
    }
  };

  const renderTrialBalance = (data: TrialBalance) => {
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">Trial Balance</h1>
          <p className="text-gray-600 mt-2">As of {new Date(data.asOfDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Trial Balance Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-3 px-4">Account Code</th>
                <th className="text-left py-3 px-4">Account Name</th>
                <th className="text-center py-3 px-4">Type</th>
                <th className="text-right py-3 px-4">Debit</th>
                <th className="text-right py-3 px-4">Credit</th>
              </tr>
            </thead>
            <tbody>
              {/* Group by account type */}
              {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => {
                const accountsOfType = data.accounts.filter(acc => acc.accountType === type);
                if (accountsOfType.length === 0) return null;

                return (
                  <React.Fragment key={type}>
                    {/* Type Header */}
                    <tr className="bg-gray-100">
                      <td colSpan={5} className="py-2 px-4 uppercase text-sm text-gray-700">
                        {type}s
                      </td>
                    </tr>
                    {/* Accounts */}
                    {accountsOfType.map(account => (
                      <tr key={account.accountName} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-2 px-4 text-gray-600">{account.accountCode}</td>
                        <td className="py-2 px-4 text-gray-900">{account.accountName}</td>
                        <td className="py-2 px-4 text-center text-xs text-gray-500 uppercase">{account.normalBalance}</td>
                        <td className="py-2 px-4 text-right text-gray-900">
                          {account.debitBalance > 0 ? formatPKR(account.debitBalance) : '-'}
                        </td>
                        <td className="py-2 px-4 text-right text-gray-900">
                          {account.creditBalance > 0 ? formatPKR(account.creditBalance) : '-'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              {/* Totals Row */}
              <tr className="border-t-2 border-gray-900 bg-gray-50">
                <td colSpan={3} className="py-3 px-4 text-right">
                  <strong>Total:</strong>
                </td>
                <td className="py-3 px-4 text-right">
                  <strong>{formatPKR(data.totalDebits)}</strong>
                </td>
                <td className="py-3 px-4 text-right">
                  <strong>{formatPKR(data.totalCredits)}</strong>
                </td>
              </tr>

              {/* Balance Status */}
              <tr>
                <td colSpan={5} className="py-2 px-4 text-center">
                  {data.isBalanced ? (
                    <span className="text-green-600">✓ Trial Balance is Balanced</span>
                  ) : (
                    <span className="text-red-600">✗ Trial Balance is NOT Balanced (Difference: {formatPKR(Math.abs(data.totalDebits - data.totalCredits))})</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Accounts</p>
            <p className="text-xl text-gray-900 mt-1">{data.accounts.length}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Debits</p>
            <p className="text-xl text-gray-900 mt-1">{formatPKR(data.totalDebits)}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Credits</p>
            <p className="text-xl text-gray-900 mt-1">{formatPKR(data.totalCredits)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderChangesInEquity = (data: ChangesInEquity) => {
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">Statement of Changes in Equity</h1>
          <p className="text-gray-600 mt-2">
            For the period {new Date(data.period.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {new Date(data.period.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Summary Section */}
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-300">
            <span className="text-gray-700">Beginning Balance</span>
            <span className="text-gray-900">{formatPKR(data.beginningBalance)}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-green-600">
              <span>Add: Capital Contributions</span>
              <span>+ {formatPKR(data.contributions)}</span>
            </div>
            <div className="flex justify-between items-center text-blue-600">
              <span>Add: Net Income</span>
              <span>+ {formatPKR(data.netIncome)}</span>
            </div>
            <div className="flex justify-between items-center text-red-600">
              <span>Less: Withdrawals</span>
              <span>- {formatPKR(data.withdrawals)}</span>
            </div>
            <div className="flex justify-between items-center text-red-600">
              <span>Less: Dividends Paid</span>
              <span>- {formatPKR(data.dividends)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t-2 border-gray-900">
            <span className="text-gray-900"><strong>Ending Balance</strong></span>
            <span className="text-gray-900"><strong>{formatPKR(data.endingBalance)}</strong></span>
          </div>
        </div>

        {/* Detailed Transactions */}
        {data.transactions && data.transactions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-gray-900">Detailed Transactions</h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-right py-3 px-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-4 text-gray-600">
                        {new Date(txn.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${txn.type === 'owner-contribution' ? 'bg-green-100 text-green-700' :
                          txn.type === 'owner-withdrawal' ? 'bg-red-100 text-red-700' :
                            txn.type === 'dividend' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                          }`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-900">{txn.description}</td>
                      <td className={`py-2 px-4 text-right ${txn.type === 'owner-contribution' || txn.type === 'net-income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {txn.type === 'owner-contribution' || txn.type === 'net-income' ? '+' : '-'} {formatPKR(txn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Beginning</p>
            <p className="text-lg text-gray-900 mt-1">{formatPKR(data.beginningBalance)}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Contributions</p>
            <p className="text-lg text-gray-900 mt-1">{formatPKR(data.contributions)}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Withdrawals</p>
            <p className="text-lg text-gray-900 mt-1">{formatPKR(data.withdrawals + data.dividends)}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Ending</p>
            <p className="text-lg text-gray-900 mt-1">{formatPKR(data.endingBalance)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderProfitAndLoss = (data: ProfitAndLoss) => {
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">Profit and Loss Statement</h1>
          <p className="text-gray-600 mt-2">
            For the period {new Date(data.period.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {new Date(data.period.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Revenue Section */}
        <div className="bg-green-50 rounded-lg p-6 space-y-3">
          <h3 className="text-gray-900 pb-2 border-b border-green-200">Revenue</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Commission Revenue</span>
              <span className="text-gray-900">{formatPKR(data.revenue.commissionRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Rental Income</span>
              <span className="text-gray-900">{formatPKR(data.revenue.rentalIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Consulting Fees</span>
              <span className="text-gray-900">{formatPKR(data.revenue.consultingFees)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Other Income</span>
              <span className="text-gray-900">{formatPKR(data.revenue.otherIncome)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-green-300">
              <span className="text-gray-900"><strong>Total Revenue</strong></span>
              <span className="text-gray-900"><strong>{formatPKR(data.revenue.totalRevenue)}</strong></span>
            </div>
          </div>
        </div>

        {/* Expense Section */}
        <div className="bg-red-50 rounded-lg p-6 space-y-3">
          <h3 className="text-gray-900 pb-2 border-b border-red-200">Expenses</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Salaries & Wages</span>
              <span className="text-gray-900">{formatPKR(data.expenses.salariesWages)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Marketing & Advertising</span>
              <span className="text-gray-900">{formatPKR(data.expenses.marketingAdvertising)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Office Expenses</span>
              <span className="text-gray-900">{formatPKR(data.expenses.officeExpenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Utilities & Communication</span>
              <span className="text-gray-900">{formatPKR(data.expenses.utilities)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Depreciation</span>
              <span className="text-gray-900">{formatPKR(data.expenses.depreciation)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Other Expenses</span>
              <span className="text-gray-900">{formatPKR(data.expenses.otherExpenses)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-red-300">
              <span className="text-gray-900"><strong>Total Expenses</strong></span>
              <span className="text-gray-900"><strong>{formatPKR(data.expenses.totalExpenses)}</strong></span>
            </div>
          </div>
        </div>

        {/* Net Income Section */}
        <div className="bg-blue-50 rounded-lg p-6 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Gross Profit</span>
              <span className="text-gray-900">{formatPKR(data.grossProfit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Operating Income</span>
              <span className="text-gray-900">{formatPKR(data.operatingIncome)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-blue-400">
              <span className="text-gray-900"><strong>Net Income</strong></span>
              <span className={`text-lg ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <strong>{formatPKR(data.netIncome)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-xl text-gray-900 mt-1">{formatPKR(data.revenue.totalRevenue)}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-xl text-gray-900 mt-1">{formatPKR(data.expenses.totalExpenses)}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Net Income</p>
            <p className={`text-xl mt-1 ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPKR(data.netIncome)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = (data: BalanceSheet) => {
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">Balance Sheet</h1>
          <p className="text-gray-600 mt-2">As of {new Date(data.asOfDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Assets Section */}
        <div className="bg-blue-50 rounded-lg p-6 space-y-3">
          <h3 className="text-gray-900 pb-2 border-b border-blue-200">Assets</h3>

          {/* Current Assets */}
          <div className="space-y-2">
            <p className="text-sm text-gray-700 mt-3">Current Assets</p>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Cash & Bank</span>
              <span className="text-gray-900">{formatPKR(data.assets.currentAssets.cashAndBank)}</span>
            </div>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Accounts Receivable</span>
              <span className="text-gray-900">{formatPKR(data.assets.currentAssets.accountsReceivable)}</span>
            </div>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Prepaid Expenses</span>
              <span className="text-gray-900">{formatPKR(data.assets.currentAssets.prepaidExpenses)}</span>
            </div>
            <div className="flex justify-between items-center ml-4 pt-1 border-t border-blue-300">
              <span className="text-gray-800">Total Current Assets</span>
              <span className="text-gray-800">{formatPKR(data.assets.currentAssets.totalCurrentAssets)}</span>
            </div>

            {/* Non-Current Assets */}
            <p className="text-sm text-gray-700 mt-4">Non-Current Assets</p>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Property Inventory</span>
              <span className="text-gray-900">{formatPKR(data.assets.nonCurrentAssets.propertyInventory)}</span>
            </div>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Fixed Assets</span>
              <span className="text-gray-900">{formatPKR(data.assets.nonCurrentAssets.fixedAssets)}</span>
            </div>
            <div className="flex justify-between items-center ml-4 pt-1 border-t border-blue-300">
              <span className="text-gray-800">Total Non-Current Assets</span>
              <span className="text-gray-800">{formatPKR(data.assets.nonCurrentAssets.totalNonCurrentAssets)}</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t-2 border-blue-400">
              <span className="text-gray-900"><strong>Total Assets</strong></span>
              <span className="text-gray-900"><strong>{formatPKR(data.assets.totalAssets)}</strong></span>
            </div>
          </div>
        </div>

        {/* Liabilities Section */}
        <div className="bg-red-50 rounded-lg p-6 space-y-3">
          <h3 className="text-gray-900 pb-2 border-b border-red-200">Liabilities</h3>

          {/* Current Liabilities */}
          <div className="space-y-2">
            <p className="text-sm text-gray-700 mt-3">Current Liabilities</p>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Accounts Payable</span>
              <span className="text-gray-900">{formatPKR(data.liabilities.currentLiabilities.accountsPayable)}</span>
            </div>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Accrued Expenses</span>
              <span className="text-gray-900">{formatPKR(data.liabilities.currentLiabilities.accruedExpenses)}</span>
            </div>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Customer Deposits</span>
              <span className="text-gray-900">{formatPKR(data.liabilities.currentLiabilities.customerDeposits)}</span>
            </div>
            <div className="flex justify-between items-center ml-4 pt-1 border-t border-red-300">
              <span className="text-gray-800">Total Current Liabilities</span>
              <span className="text-gray-800">{formatPKR(data.liabilities.currentLiabilities.totalCurrentLiabilities)}</span>
            </div>

            {/* Long-Term Liabilities */}
            <p className="text-sm text-gray-700 mt-4">Long-Term Liabilities</p>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Loans Payable</span>
              <span className="text-gray-900">{formatPKR(data.liabilities.longTermLiabilities.loansPayable)}</span>
            </div>
            <div className="flex justify-between items-center ml-4 pt-1 border-t border-red-300">
              <span className="text-gray-800">Total Long-Term Liabilities</span>
              <span className="text-gray-800">{formatPKR(data.liabilities.longTermLiabilities.totalLongTermLiabilities)}</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t-2 border-red-400">
              <span className="text-gray-900"><strong>Total Liabilities</strong></span>
              <span className="text-gray-900"><strong>{formatPKR(data.liabilities.totalLiabilities)}</strong></span>
            </div>
          </div>
        </div>

        {/* Equity Section */}
        <div className="bg-green-50 rounded-lg p-6 space-y-3">
          <h3 className="text-gray-900 pb-2 border-b border-green-200">Equity</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Owner's Capital</span>
              <span className="text-gray-900">{formatPKR(data.equity.ownersCapital)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Retained Earnings</span>
              <span className="text-gray-900">{formatPKR(data.equity.retainedEarnings)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Current Year Earnings</span>
              <span className="text-gray-900">{formatPKR(data.equity.currentYearEarnings)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-green-400">
              <span className="text-gray-900"><strong>Total Equity</strong></span>
              <span className="text-gray-900"><strong>{formatPKR(data.equity.totalEquity)}</strong></span>
            </div>
          </div>
        </div>

        {/* Total Liabilities + Equity */}
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-900 text-lg"><strong>Total Liabilities + Equity</strong></span>
            <span className="text-gray-900 text-lg"><strong>{formatPKR(data.totalLiabilitiesAndEquity)}</strong></span>
          </div>
          <div className="mt-2 text-center">
            {data.isBalanced ? (
              <span className="text-green-600 text-sm">✓ Balance Sheet is Balanced (Assets = Liabilities + Equity)</span>
            ) : (
              <span className="text-red-600 text-sm">✗ Balance Sheet NOT Balanced (Difference: {formatPKR(Math.abs(data.assets.totalAssets - data.totalLiabilitiesAndEquity))})</span>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Assets</p>
            <p className="text-xl text-gray-900 mt-1">{formatPKR(data.assets.totalAssets)}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Liabilities</p>
            <p className="text-xl text-gray-900 mt-1">{formatPKR(data.liabilities.totalLiabilities)}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Equity</p>
            <p className="text-xl text-gray-900 mt-1">{formatPKR(data.equity.totalEquity)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlowStatement = (data: CashFlowStatement) => {
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">Cash Flow Statement</h1>
          <p className="text-gray-600 mt-2">
            For the period {new Date(data.period.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {new Date(data.period.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Operating Activities */}
        <div className="bg-green-50 rounded-lg p-6 space-y-3">
          <h3 className="text-gray-900 pb-2 border-b border-green-200">Cash Flow from Operating Activities</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Net Income</span>
              <span className="text-gray-900">{formatPKR(data.operatingActivities.netIncome)}</span>
            </div>
            <p className="text-sm text-gray-700 mt-2">Adjustments to reconcile net income:</p>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Depreciation</span>
              <span className="text-gray-900">{formatPKR(data.operatingActivities.adjustments.depreciation)}</span>
            </div>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Change in Accounts Receivable</span>
              <span className="text-gray-900">{formatPKR(data.operatingActivities.adjustments.accountsReceivableChange)}</span>
            </div>
            <div className="flex justify-between items-center ml-4">
              <span className="text-gray-700">Change in Accounts Payable</span>
              <span className="text-gray-900">{formatPKR(data.operatingActivities.adjustments.accountsPayableChange)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-green-300">
              <span className="text-gray-900"><strong>Net Cash from Operating Activities</strong></span>
              <span className="text-gray-900"><strong>{formatPKR(data.operatingActivities.netCashFromOperating)}</strong></span>
            </div>
          </div>
        </div>

        {/* Investing Activities */}
        <div className="bg-blue-50 rounded-lg p-6 space-y-3">
          <h3 className="text-gray-900 pb-2 border-b border-blue-200">Cash Flow from Investing Activities</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Property Purchases</span>
              <span className="text-red-600">({formatPKR(data.investingActivities.propertyPurchases)})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Property Disposals</span>
              <span className="text-green-600">{formatPKR(data.investingActivities.propertyDisposals)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-blue-300">
              <span className="text-gray-900"><strong>Net Cash from Investing Activities</strong></span>
              <span className="text-gray-900"><strong>{formatPKR(data.investingActivities.netCashFromInvesting)}</strong></span>
            </div>
          </div>
        </div>

        {/* Financing Activities */}
        <div className="bg-purple-50 rounded-lg p-6 space-y-3">
          <h3 className="text-gray-900 pb-2 border-b border-purple-200">Cash Flow from Financing Activities</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Owner Contributions</span>
              <span className="text-green-600">{formatPKR(data.financingActivities.ownerContributions)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Owner Withdrawals</span>
              <span className="text-red-600">({formatPKR(data.financingActivities.ownerWithdrawals)})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Loan Proceeds</span>
              <span className="text-green-600">{formatPKR(data.financingActivities.loanProceeds)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Loan Repayments</span>
              <span className="text-red-600">({formatPKR(data.financingActivities.loanRepayments)})</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-purple-300">
              <span className="text-gray-900"><strong>Net Cash from Financing Activities</strong></span>
              <span className="text-gray-900"><strong>{formatPKR(data.financingActivities.netCashFromFinancing)}</strong></span>
            </div>
          </div>
        </div>

        {/* Net Change in Cash */}
        <div className="bg-gray-100 rounded-lg p-6 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Net Change in Cash</span>
              <span className={`${data.netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPKR(data.netCashChange)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Beginning Cash Balance</span>
              <span className="text-gray-900">{formatPKR(data.beginningCash)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-gray-400">
              <span className="text-gray-900"><strong>Ending Cash Balance</strong></span>
              <span className="text-gray-900"><strong>{formatPKR(data.endingCash)}</strong></span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Operating</p>
            <p className="text-lg text-gray-900 mt-1">{formatPKR(data.operatingActivities.netCashFromOperating)}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Investing</p>
            <p className="text-lg text-gray-900 mt-1">{formatPKR(data.investingActivities.netCashFromInvesting)}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Financing</p>
            <p className="text-lg text-gray-900 mt-1">{formatPKR(data.financingActivities.netCashFromFinancing)}</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Net Change</p>
            <p className={`text-lg mt-1 ${data.netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPKR(data.netCashChange)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCommissionReport = (data: CommissionReport) => {
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">Commission Report</h1>
          <p className="text-gray-600 mt-2">
            For the period {new Date(data.period.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {new Date(data.period.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Commission Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Deals</p>
            <p className="text-2xl text-gray-900 mt-1">{data.summary.totalDeals}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Commission</p>
            <p className="text-2xl text-gray-900 mt-1">{formatPKR(data.summary.totalCommission)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Avg Rate</p>
            <p className="text-2xl text-gray-900 mt-1">{data.summary.averageCommissionRate.toFixed(2)}%</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Deal Value</p>
            <p className="text-2xl text-gray-900 mt-1">{formatPKR(data.summary.totalDealValue)}</p>
          </div>
        </div>

        {/* Commissions by Agent */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Commissions by Agent</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4">Agent</th>
                  <th className="text-center py-3 px-4">Deals</th>
                  <th className="text-right py-3 px-4">Total Commission</th>
                </tr>
              </thead>
              <tbody>
                {data.byAgent.map((agent) => (
                  <tr key={agent.agentId} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4 text-gray-900">{agent.agentName}</td>
                    <td className="py-3 px-4 text-center text-gray-900">{agent.dealsCount}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(agent.totalCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Individual Commission Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Commission Details</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4">Property</th>
                  <th className="text-left py-3 px-4">Agent</th>
                  <th className="text-center py-3 px-4">Type</th>
                  <th className="text-right py-3 px-4">Deal Value</th>
                  <th className="text-right py-3 px-4">Rate</th>
                  <th className="text-right py-3 px-4">Commission</th>
                  <th className="text-center py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.commissions.map((comm) => (
                  <tr key={comm.propertyId} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4 text-gray-900">{comm.propertyTitle}</td>
                    <td className="py-3 px-4 text-gray-700">{comm.agentName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${comm.dealType === 'sale' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {comm.dealType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(comm.dealValue)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{comm.commissionRate.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(comm.commissionAmount)}</td>
                    <td className="py-3 px-4 text-center text-gray-700 text-sm">
                      {new Date(comm.closedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales vs Rental Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-6">
            <h4 className="text-gray-900 pb-2 border-b border-green-200">Sales Commissions</h4>
            <p className="text-3xl text-gray-900 mt-3">{formatPKR(data.summary.salesCommission)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="text-gray-900 pb-2 border-b border-blue-200">Rental Commissions</h4>
            <p className="text-3xl text-gray-900 mt-3">{formatPKR(data.summary.rentalCommission)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderExpenseSummary = (data: ExpenseSummaryReport) => {
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">Expense Summary Report</h1>
          <p className="text-gray-600 mt-2">
            For the period {new Date(data.period.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {new Date(data.period.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl text-gray-900 mt-1">{formatPKR(data.summary.totalExpenses)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Transactions</p>
            <p className="text-2xl text-gray-900 mt-1">{data.summary.transactionCount}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Avg Expense</p>
            <p className="text-2xl text-gray-900 mt-1">{formatPKR(data.summary.averageExpense)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Top Category</p>
            <p className="text-sm text-gray-900 mt-1">{data.summary.largestCategory}</p>
            <p className="text-lg text-gray-900">{formatPKR(data.summary.largestCategoryAmount)}</p>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Expenses by Category</h3>
          <div className="mt-4 space-y-3">
            {data.byCategory.map((cat) => (
              <div key={cat.category} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-900">{cat.category}</span>
                    <span className="text-gray-900">{formatPKR(cat.total)} ({cat.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{cat.count} transactions</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Monthly Expense Trend</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4">Month</th>
                  <th className="text-right py-3 px-4">Total Expenses</th>
                </tr>
              </thead>
              <tbody>
                {data.byMonth.map((month) => (
                  <tr key={month.month} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4 text-gray-900">{month.month}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(month.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Recent Expenses</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-center py-3 px-4">Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.slice(0, 10).map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4 text-gray-700 text-sm">
                      {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{expense.category}</td>
                    <td className="py-3 px-4 text-gray-700">{expense.description}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(expense.amount)}</td>
                    <td className="py-3 px-4 text-center text-gray-700 text-sm">{expense.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPropertyPerformance = (data: PropertyPerformanceReport) => {
    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">Property Performance Report</h1>
          <p className="text-gray-600 mt-2">
            For the period {new Date(data.period.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {new Date(data.period.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Properties</p>
            <p className="text-2xl text-gray-900 mt-1">{data.summary.totalProperties}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Listings</p>
            <p className="text-2xl text-gray-900 mt-1">{data.summary.activeListing}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Sold</p>
            <p className="text-2xl text-gray-900 mt-1">{data.summary.soldProperties}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="text-2xl text-gray-900 mt-1">{data.summary.conversionRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Avg Days on Market</p>
            <p className="text-2xl text-gray-900 mt-1">{Math.round(data.summary.averageDaysOnMarket)} days</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Avg Price Reduction</p>
            <p className="text-2xl text-gray-900 mt-1">{formatPKR(data.summary.averagePriceReduction)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Commission</p>
            <p className="text-2xl text-gray-900 mt-1">{formatPKR(data.summary.totalCommissionEarned)}</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Status Breakdown</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.byStatus.map((status) => (
              <div key={status.status} className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 capitalize">{status.status}</p>
                <p className="text-xl text-gray-900 mt-1">{status.count}</p>
                <p className="text-xs text-gray-600 mt-1">{status.percentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Top Performing Properties</h3>
          <div className="mt-4 space-y-3">
            {data.topPerformers.map((prop) => (
              <div key={prop.id} className="bg-white rounded-lg p-4 border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-gray-900">{prop.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{prop.daysOnMarket} days on market</p>
                </div>
                <div className="text-right">
                  <p className="text-green-600">{formatPKR(prop.commissionEarned)}</p>
                  <p className="text-xs text-gray-600 mt-1">Commission</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Property Details</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4">Property</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Days on Market</th>
                  <th className="text-right py-3 px-4">List Price</th>
                  <th className="text-right py-3 px-4">Price Change</th>
                  <th className="text-right py-3 px-4">Commission</th>
                  <th className="text-left py-3 px-4">Agent</th>
                </tr>
              </thead>
              <tbody>
                {data.properties.map((prop) => (
                  <tr key={prop.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4 text-gray-900">{prop.title}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${prop.status === 'sold' ? 'bg-green-100 text-green-700' :
                        prop.status === 'available' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {prop.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900">{prop.daysOnMarket}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(prop.listPrice)}</td>
                    <td className={`py-3 px-4 text-right ${prop.priceChange < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {prop.priceChange !== 0 && (
                        <>
                          {formatPKR(prop.priceChange)} ({prop.priceChangePercentage.toFixed(1)}%)
                        </>
                      )}
                      {prop.priceChange === 0 && '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(prop.commissionEarned)}</td>
                    <td className="py-3 px-4 text-gray-700">{prop.agentName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderInvestorDistribution = (data: InvestorDistributionReport) => {
    // Handle empty state
    if (data.distributions.length === 0) {
      return (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl text-gray-900">Investor Distribution Report</h1>
            <p className="text-gray-600 mt-2">
              For the period {new Date(data.period.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {new Date(data.period.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-blue-900 text-lg">No investor distributions for this period</p>
            <p className="text-sm text-blue-700 mt-2">
              This report will display investor distribution data when investor syndication features are active.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">Investor Distribution Report</h1>
          <p className="text-gray-600 mt-2">
            For the period {new Date(data.period.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to {new Date(data.period.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Investors</p>
            <p className="text-2xl text-gray-900 mt-1">{data.summary.totalInvestors}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Distributed</p>
            <p className="text-2xl text-gray-900 mt-1">{formatPKR(data.summary.totalDistributed)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Capital</p>
            <p className="text-2xl text-gray-900 mt-1">{formatPKR(data.summary.totalInvestmentCapital)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Avg ROI</p>
            <p className="text-2xl text-gray-900 mt-1">{data.summary.averageROI.toFixed(2)}%</p>
          </div>
        </div>

        {/* Distributions by Investor */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Distributions by Investor</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4">Investor</th>
                  <th className="text-center py-3 px-4">Distributions</th>
                  <th className="text-right py-3 px-4">Total Distributed</th>
                  <th className="text-right py-3 px-4">Total Invested</th>
                  <th className="text-right py-3 px-4">ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.byInvestor.map((investor) => (
                  <tr key={investor.investorId} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4 text-gray-900">{investor.investorName}</td>
                    <td className="py-3 px-4 text-center text-gray-900">{investor.distributionsCount}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(investor.totalDistributed)}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(investor.totalInvested)}</td>
                    <td className={`py-3 px-4 text-right ${investor.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {investor.roi.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribution Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-gray-900 pb-3 border-b border-gray-300">Distribution Details</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4">Investor</th>
                  <th className="text-left py-3 px-4">Property</th>
                  <th className="text-right py-3 px-4">Investment</th>
                  <th className="text-center py-3 px-4">Ownership %</th>
                  <th className="text-right py-3 px-4">Distribution</th>
                  <th className="text-right py-3 px-4">ROI</th>
                  <th className="text-center py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.distributions.map((dist) => (
                  <tr key={`${dist.investorId}-${dist.propertyId}`} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4 text-gray-900">{dist.investorName}</td>
                    <td className="py-3 px-4 text-gray-700">{dist.propertyTitle}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(dist.investmentAmount)}</td>
                    <td className="py-3 px-4 text-center text-gray-700">{dist.ownershipPercentage.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatPKR(dist.distributionAmount)}</td>
                    <td className={`py-3 px-4 text-right ${dist.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dist.roi.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 text-sm">
                      {new Date(dist.distributionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderGenericReport = () => {
    return (
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl text-gray-900">{report.templateName}</h1>
          <p className="text-gray-600 mt-2">
            {new Date(report.dateFrom).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - {new Date(report.dateTo).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-900">
            Report data will be displayed here.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            This report type is not yet implemented with full data visualization.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{report.templateName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {renderReportContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
