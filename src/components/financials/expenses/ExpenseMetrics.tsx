import React from 'react';
import { MetricCard } from '../../layout/MetricCard';
import { Receipt, Clock, CheckCircle, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { formatPKR } from '../../../lib/currency';

interface ExpenseMetricsProps {
  totalExpenses: number;
  thisMonthExpenses: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  categoryCount: number;
  recurringCount: number;
}

/**
 * ExpenseMetrics Component
 * 
 * Displays key expense metrics in a grid of MetricCard components.
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
 * <ExpenseMetrics
 *   totalExpenses={2500000}
 *   thisMonthExpenses={450000}
 *   pendingCount={8}
 *   pendingAmount={180000}
 *   approvedCount={12}
 *   approvedAmount={270000}
 *   categoryCount={8}
 *   recurringCount={5}
 * />
 */
export const ExpenseMetrics: React.FC<ExpenseMetricsProps> = ({
  totalExpenses,
  thisMonthExpenses,
  pendingCount,
  pendingAmount,
  approvedCount,
  approvedAmount,
  categoryCount,
  recurringCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Total Expenses (All Time) */}
      <MetricCard
        label="Total Expenses"
        value={formatPKR(totalExpenses)}
        icon={<Receipt className="h-5 w-5" />}
        variant="default"
      />

      {/* This Month */}
      <MetricCard
        label="This Month"
        value={formatPKR(thisMonthExpenses)}
        icon={<Calendar className="h-5 w-5" />}
        variant="default"
      />

      {/* Pending Approval */}
      <MetricCard
        label="Pending Approval"
        value={`${pendingCount} (${formatPKR(pendingAmount)})`}
        icon={<Clock className="h-5 w-5" />}
        variant={pendingCount > 0 ? "warning" : "default"}
      />

      {/* Approved (This Month) */}
      <MetricCard
        label="Approved (This Month)"
        value={`${approvedCount} (${formatPKR(approvedAmount)})`}
        icon={<CheckCircle className="h-5 w-5" />}
        variant="success"
      />

      {/* Active Categories */}
      <MetricCard
        label="Active Categories"
        value={categoryCount}
        icon={<TrendingUp className="h-5 w-5" />}
        variant="default"
      />

      {/* Recurring Expenses */}
      <MetricCard
        label="Recurring Expenses"
        value={recurringCount}
        icon={<AlertCircle className="h-5 w-5" />}
        variant={recurringCount > 0 ? "info" : "default"}
      />
    </div>
  );
};
