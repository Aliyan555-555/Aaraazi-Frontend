import React from 'react';
import { MetricCard } from '../../layout/MetricCard';
import { Users, DollarSign, Clock, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { formatPKR } from '../../../lib/currency';

interface InvestorDistributionMetricsProps {
  totalInvestors: number;
  totalDistributed: number;
  pendingDistributions: number;
  pendingAmount: number;
  thisMonthDistributions: number;
  thisMonthAmount: number;
  averageROI: number;
}

/**
 * InvestorDistributionMetrics Component
 * 
 * Displays key investor distribution metrics in a grid of MetricCard components.
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
 * <InvestorDistributionMetrics
 *   totalInvestors={25}
 *   totalDistributed={15000000}
 *   pendingDistributions={8}
 *   pendingAmount={450000}
 *   thisMonthDistributions={5}
 *   thisMonthAmount={1200000}
 *   averageROI={18.5}
 * />
 */
export const InvestorDistributionMetrics: React.FC<InvestorDistributionMetricsProps> = ({
  totalInvestors,
  totalDistributed,
  pendingDistributions,
  pendingAmount,
  thisMonthDistributions,
  thisMonthAmount,
  averageROI,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Total Investors */}
      <MetricCard
        label="Total Investors"
        value={totalInvestors}
        icon={<Users className="h-5 w-5" />}
        variant="default"
      />

      {/* Total Distributed */}
      <MetricCard
        label="Total Distributed"
        value={formatPKR(totalDistributed)}
        icon={<DollarSign className="h-5 w-5" />}
        variant="success"
      />

      {/* Pending Distributions */}
      <MetricCard
        label="Pending Distributions"
        value={`${pendingDistributions} (${formatPKR(pendingAmount)})`}
        icon={<Clock className="h-5 w-5" />}
        variant={pendingDistributions > 0 ? "warning" : "default"}
      />

      {/* This Month Distributed */}
      <MetricCard
        label="This Month"
        value={`${thisMonthDistributions} (${formatPKR(thisMonthAmount)})`}
        icon={<Calendar className="h-5 w-5" />}
        variant="default"
      />

      {/* Average ROI */}
      <MetricCard
        label="Average Investor ROI"
        value={`${averageROI.toFixed(2)}%`}
        icon={<TrendingUp className="h-5 w-5" />}
        variant={averageROI >= 15 ? "success" : averageROI >= 10 ? "info" : "default"}
      />

      {/* Completed This Month */}
      <MetricCard
        label="Completed (This Month)"
        value={thisMonthDistributions}
        icon={<CheckCircle className="h-5 w-5" />}
        variant="success"
      />
    </div>
  );
};
