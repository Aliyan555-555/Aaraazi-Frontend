/**
 * MetricCardsGroup - Grid of metric cards with consistent spacing
 * 
 * Features:
 * - Responsive grid layout
 * - Max 5 cards per row (Miller's Law)
 * - Consistent spacing (8px grid)
 * - Auto-adjusting columns
 * 
 * Usage:
 * <MetricCardsGroup
 *   metrics={[
 *     { label: 'Total', value: 150, icon: <Home />, variant: 'info' },
 *     { label: 'Active', value: 45, icon: <Check />, variant: 'success' }
 *   ]}
 *   columns={3}
 * />
 */

import React from 'react';
import { MetricCard, MetricCardProps } from '../ui/metric-card';

export interface MetricCardsGroupProps {
  metrics: MetricCardProps[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function MetricCardsGroup({
  metrics,
  columns = 3,
  className = '',
}: MetricCardsGroupProps) {
  // Limit to 5 metrics (Miller's Law)
  const displayMetrics = metrics.slice(0, 5);

  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  }[columns];

  return (
    <div className={`grid ${gridColsClass} gap-4 ${className}`}>
      {displayMetrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
