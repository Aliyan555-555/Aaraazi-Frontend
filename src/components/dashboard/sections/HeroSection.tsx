/**
 * HeroSection Component
 * 
 * Displays 3-4 key business health metrics at a glance.
 * Adapts based on user context (will be implemented in Phase 7).
 * 
 * FEATURES:
 * - Smart metric selection (context-aware)
 * - Trend indicators
 * - Clickable for details
 * - Loading states
 * - Real data from localStorage (Phase 2)
 * 
 * DESIGN:
 * - Brand colors (Forest Green, Terracotta, Slate)
 * - NO Tailwind typography classes
 * - Responsive grid (1 col mobile, 2 col tablet, 4 col desktop)
 * 
 * UX LAWS:
 * - Miller's Law: 3-4 metrics (within 7±2)
 * - Fitts's Law: Large cards, easy to click
 * 
 * Phase 1: Static metrics for layout testing
 * Phase 2: Real data from localStorage ✅
 * Phase 7: Context-aware metric selection
 */

import React from 'react';
import { User } from '../../../types';
import { DashboardMetricCard } from '../components/DashboardMetricCard';
import { useDashboardData } from '../hooks/useDashboardData';
import {
  TrendingUp,
  DollarSign,
  Building2,
  BarChart3,
} from 'lucide-react';

interface HeroSectionProps {
  user: User;
  onNavigate: (page: string, data?: any) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ user, onNavigate }) => {
  // Load real data from localStorage
  const { metrics, loading } = useDashboardData(user);

  // Define metrics with real data
  const metricCards = [
    {
      id: 'active-pipeline',
      label: 'Active Pipeline',
      value: metrics.activePipeline.value,
      icon: <TrendingUp className="h-6 w-6" />,
      trend: metrics.activePipeline.trend.value !== '0' ? {
        direction: metrics.activePipeline.trend.direction,
        value: metrics.activePipeline.trend.value,
      } : undefined,
      comparison: `${metrics.activePipeline.count} deals`,
      color: 'forestGreen' as const,
      onClick: () => onNavigate('sell-cycles'),
      loading,
    },
    {
      id: 'monthly-revenue',
      label: 'This Month Revenue',
      value: metrics.monthlyRevenue.value,
      icon: <DollarSign className="h-6 w-6" />,
      trend: metrics.monthlyRevenue.trend.value !== '0' ? {
        direction: metrics.monthlyRevenue.trend.direction,
        value: metrics.monthlyRevenue.trend.value,
      } : undefined,
      comparison: 'vs last month',
      color: 'terracotta' as const,
      onClick: () => onNavigate('sell-cycles'),
      loading,
    },
    {
      id: 'available-inventory',
      label: 'Available Inventory',
      value: metrics.availableInventory.value,
      icon: <Building2 className="h-6 w-6" />,
      trend: undefined,
      comparison: 'properties ready',
      color: 'slate' as const,
      onClick: () => onNavigate('properties'),
      loading,
    },
    {
      id: 'conversion-rate',
      label: 'Conversion Rate',
      value: metrics.conversionRate.value,
      icon: <BarChart3 className="h-6 w-6" />,
      trend: metrics.conversionRate.trend.value !== '0' ? {
        direction: metrics.conversionRate.trend.direction,
        value: metrics.conversionRate.trend.value,
      } : undefined,
      comparison: 'leads → contacts',
      color: 'forestGreen' as const,
      onClick: () => onNavigate('leads'),
      loading,
    },
  ];

  return (
    <section aria-labelledby="hero-section-title">
      <h2 id="hero-section-title" className="sr-only">Business Health Metrics</h2>
      
      {/* Responsive Grid: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <DashboardMetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
            comparison={metric.comparison}
            color={metric.color}
            onClick={metric.onClick}
            loading={metric.loading}
          />
        ))}
      </div>
    </section>
  );
};