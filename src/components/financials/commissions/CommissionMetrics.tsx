import React from 'react';
import { MetricCard } from '../../layout/MetricCard';
import { DollarSign, Clock, CheckCircle, Wallet, TrendingUp, Users } from 'lucide-react';
import { formatPKR } from '../../../lib/currency';

interface CommissionMetricsProps {
  totalCommissions: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  paidCount: number;
  paidAmount: number;
  agentCount: number;
  avgCommissionRate: number;
}

/**
 * CommissionMetrics Component
 * 
 * Displays key commission metrics in a grid of MetricCard components.
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
 * <CommissionMetrics
 *   totalCommissions={1500000}
 *   pendingCount={5}
 *   pendingAmount={250000}
 *   approvedCount={3}
 *   approvedAmount={150000}
 *   paidCount={12}
 *   paidAmount={1100000}
 *   agentCount={8}
 *   avgCommissionRate={2.5}
 * />
 */
export const CommissionMetrics: React.FC<CommissionMetricsProps> = ({
  totalCommissions,
  pendingCount,
  pendingAmount,
  approvedCount,
  approvedAmount,
  paidCount,
  paidAmount,
  agentCount,
  avgCommissionRate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Total Commissions */}
      <MetricCard
        label="Total Commissions"
        value={formatPKR(totalCommissions)}
        icon={<DollarSign className="h-5 w-5" />}
        variant="default"
      />

      {/* Pending Approval */}
      <MetricCard
        label="Pending Approval"
        value={`${pendingCount} (${formatPKR(pendingAmount)})`}
        icon={<Clock className="h-5 w-5" />}
        variant={pendingCount > 0 ? "warning" : "default"}
      />

      {/* Approved (Not Paid) */}
      <MetricCard
        label="Approved (Not Paid)"
        value={`${approvedCount} (${formatPKR(approvedAmount)})`}
        icon={<CheckCircle className="h-5 w-5" />}
        variant={approvedCount > 0 ? "info" : "default"}
      />

      {/* Paid This Period */}
      <MetricCard
        label="Paid Commissions"
        value={`${paidCount} (${formatPKR(paidAmount)})`}
        icon={<Wallet className="h-5 w-5" />}
        variant="success"
      />

      {/* Average Commission Rate */}
      <MetricCard
        label="Avg Commission Rate"
        value={`${avgCommissionRate.toFixed(2)}%`}
        icon={<TrendingUp className="h-5 w-5" />}
        variant="default"
      />

      {/* Active Agents */}
      <MetricCard
        label="Active Agents"
        value={agentCount}
        icon={<Users className="h-5 w-5" />}
        variant="default"
      />
    </div>
  );
};
