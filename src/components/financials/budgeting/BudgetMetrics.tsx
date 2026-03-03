import React from 'react';
import { MetricCard } from '../../layout/MetricCard';
import { Target, TrendingUp, TrendingDown, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { formatPKR } from '../../../lib/currency';

interface BudgetMetricsProps {
  totalBudget: number;
  actualSpend: number;
  variance: number;
  variancePercentage: number;
  remainingBudget: number;
  budgetPeriod: string;
}

/**
 * BudgetMetrics Component
 * 
 * Displays key budgeting and forecasting metrics in a grid of MetricCard components.
 * Shows max 6 metrics (Miller's Law: 7±2).
 * 
 * Design System Compliant:
 * - Uses MetricCard from /components/layout/
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Miller's Law: Max 6 metrics (within 7±2)
 * - Aesthetic-Usability: Consistent card design
 * 
 * @example
 * <BudgetMetrics
 *   totalBudget={5000000}
 *   actualSpend={4750000}
 *   variance={250000}
 *   variancePercentage={5}
 *   remainingBudget={250000}
 *   budgetPeriod="2024"
 * />
 */
export const BudgetMetrics: React.FC<BudgetMetricsProps> = ({
  totalBudget,
  actualSpend,
  variance,
  variancePercentage,
  remainingBudget,
  budgetPeriod,
}) => {
  const isOverBudget = variance < 0;
  const utilizationRate = totalBudget > 0 ? (actualSpend / totalBudget) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Total Budget */}
      <MetricCard
        label="Total Budget"
        value={formatPKR(totalBudget)}
        icon={<Target className="h-5 w-5" />}
        variant="default"
      />

      {/* Actual Spend */}
      <MetricCard
        label="Actual Spend"
        value={formatPKR(actualSpend)}
        icon={<DollarSign className="h-5 w-5" />}
        variant="info"
      />

      {/* Variance */}
      <MetricCard
        label="Variance"
        value={`${formatPKR(Math.abs(variance))} (${Math.abs(variancePercentage).toFixed(1)}%)`}
        icon={isOverBudget ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
        variant={isOverBudget ? "danger" : "success"}
      />

      {/* Remaining Budget */}
      <MetricCard
        label="Remaining Budget"
        value={formatPKR(remainingBudget)}
        icon={<AlertCircle className="h-5 w-5" />}
        variant={remainingBudget > 0 ? "success" : "danger"}
      />

      {/* Utilization Rate */}
      <MetricCard
        label="Utilization Rate"
        value={`${utilizationRate.toFixed(1)}%`}
        icon={<TrendingUp className="h-5 w-5" />}
        variant={utilizationRate > 90 ? "warning" : utilizationRate > 100 ? "danger" : "default"}
      />

      {/* Budget Period */}
      <MetricCard
        label="Budget Period"
        value={budgetPeriod}
        icon={<Calendar className="h-5 w-5" />}
        variant="default"
      />
    </div>
  );
};
