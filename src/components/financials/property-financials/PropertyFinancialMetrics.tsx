import React from 'react';
import { MetricCard } from '../../layout/MetricCard';
import { Building2, TrendingUp, DollarSign, Percent, ArrowUpRight, Calendar } from 'lucide-react';
import { formatPKR } from '../../../lib/currency';

interface PropertyFinancialMetricsProps {
  totalProperties: number;
  totalInvestment: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  averageROI: number;
  propertiesWithProfit: number;
  averageHoldingPeriod: number; // in days
}

/**
 * PropertyFinancialMetrics Component
 * 
 * Displays key property financial metrics in a grid of MetricCard components.
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
 * <PropertyFinancialMetrics
 *   totalProperties={15}
 *   totalInvestment={45000000}
 *   totalRevenue={52000000}
 *   totalExpenses={3500000}
 *   netProfit={3500000}
 *   averageROI={18.5}
 *   propertiesWithProfit={12}
 *   averageHoldingPeriod={180}
 * />
 */
export const PropertyFinancialMetrics: React.FC<PropertyFinancialMetricsProps> = ({
  totalProperties,
  totalInvestment,
  totalRevenue,
  totalExpenses,
  netProfit,
  averageROI,
  propertiesWithProfit,
  averageHoldingPeriod,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Total Properties */}
      <MetricCard
        label="Properties Tracked"
        value={totalProperties}
        icon={<Building2 className="h-5 w-5" />}
        variant="default"
      />

      {/* Total Investment */}
      <MetricCard
        label="Total Investment"
        value={formatPKR(totalInvestment)}
        icon={<DollarSign className="h-5 w-5" />}
        variant="default"
      />

      {/* Net Profit/Loss */}
      <MetricCard
        label="Net Profit/Loss"
        value={formatPKR(netProfit)}
        icon={<ArrowUpRight className="h-5 w-5" />}
        variant={netProfit >= 0 ? "success" : "danger"}
      />

      {/* Average ROI */}
      <MetricCard
        label="Average ROI"
        value={`${averageROI.toFixed(2)}%`}
        icon={<Percent className="h-5 w-5" />}
        variant={averageROI >= 10 ? "success" : averageROI >= 5 ? "info" : "default"}
      />

      {/* Total Revenue */}
      <MetricCard
        label="Total Revenue"
        value={formatPKR(totalRevenue)}
        icon={<TrendingUp className="h-5 w-5" />}
        variant="success"
      />

      {/* Profitable Properties */}
      <MetricCard
        label="Profitable Properties"
        value={`${propertiesWithProfit}/${totalProperties}`}
        icon={<TrendingUp className="h-5 w-5" />}
        variant={propertiesWithProfit > totalProperties / 2 ? "success" : "warning"}
      />
    </div>
  );
};
