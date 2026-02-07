import React from 'react';
import { MetricCard } from '../../layout/MetricCard';
import { Building2, CheckCircle, AlertCircle, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { formatPKR } from '../../../lib/currency';

interface BankReconciliationMetricsProps {
  totalTransactions: number;
  reconciledCount: number;
  unreconciledCount: number;
  bookBalance: number;
  bankBalance: number;
  variance: number;
}

/**
 * BankReconciliationMetrics Component
 * 
 * Displays key bank reconciliation metrics in a grid of MetricCard components.
 * Shows max 6 metrics (Miller's Law: 7±2).
 * 
 * Design System V4.1 Compliant:
 * - Uses MetricCard from /components/layout/
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Miller's Law: Max 6 metrics (within 7±2)
 * - Aesthetic-Usability: Consistent card design
 * 
 * @example
 * <BankReconciliationMetrics
 *   totalTransactions={150}
 *   reconciledCount={140}
 *   unreconciledCount={10}
 *   bookBalance={5000000}
 *   bankBalance={4950000}
 *   variance={50000}
 * />
 */
export const BankReconciliationMetrics: React.FC<BankReconciliationMetricsProps> = ({
  totalTransactions,
  reconciledCount,
  unreconciledCount,
  bookBalance,
  bankBalance,
  variance,
}) => {
  const reconciliationRate = totalTransactions > 0 ? (reconciledCount / totalTransactions) * 100 : 0;
  const isBalanced = Math.abs(variance) < 1; // Within 1 PKR tolerance
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Total Transactions */}
      <MetricCard
        label="Total Transactions"
        value={totalTransactions}
        icon={<Building2 className="h-5 w-5" />}
        variant="default"
      />

      {/* Reconciled */}
      <MetricCard
        label="Reconciled"
        value={`${reconciledCount} (${reconciliationRate.toFixed(1)}%)`}
        icon={<CheckCircle className="h-5 w-5" />}
        variant="success"
      />

      {/* Unreconciled */}
      <MetricCard
        label="Unreconciled"
        value={unreconciledCount}
        icon={<AlertCircle className="h-5 w-5" />}
        variant={unreconciledCount > 0 ? "warning" : "default"}
      />

      {/* Book Balance */}
      <MetricCard
        label="Book Balance"
        value={formatPKR(bookBalance)}
        icon={<DollarSign className="h-5 w-5" />}
        variant="info"
      />

      {/* Bank Balance */}
      <MetricCard
        label="Bank Balance"
        value={formatPKR(bankBalance)}
        icon={<Building2 className="h-5 w-5" />}
        variant="success"
      />

      {/* Variance */}
      <MetricCard
        label="Variance"
        value={formatPKR(Math.abs(variance))}
        icon={<TrendingUp className="h-5 w-5" />}
        variant={isBalanced ? "success" : "danger"}
      />
    </div>
  );
};
