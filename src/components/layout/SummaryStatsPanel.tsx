/**
 * SummaryStatsPanel - Display simple stats in a compact panel
 * 
 * Features:
 * - Icon + label + value pattern
 * - Compact spacing
 * - Consistent styling
 * - Max 7 items (Miller's Law)
 * 
 * Usage:
 * <SummaryStatsPanel
 *   title="Cycle Breakdown"
 *   stats={[
 *     { icon: <TrendingUp />, label: 'Sell Cycles', value: 5, color: 'green' },
 *     { icon: <ShoppingCart />, label: 'Purchase Cycles', value: 3, color: 'blue' }
 *   ]}
 * />
 */

import React from 'react';

export interface SummaryStat {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  color?: 'green' | 'blue' | 'purple' | 'red' | 'yellow' | 'gray';
  onClick?: () => void;
}

export interface SummaryStatsPanelProps {
  title?: string;
  stats: SummaryStat[];
  className?: string;
}

export function SummaryStatsPanel({
  title,
  stats,
  className = '',
}: SummaryStatsPanelProps) {
  // Limit to 7 stats (Miller's Law)
  const displayStats = stats.slice(0, 7);

  const iconColorClass = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600',
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-5 ${className}`}>
      {title && <h3 className="text-sm mb-4">{title}</h3>}
      <div className="space-y-3">
        {displayStats.map((stat, index) => (
          <div
            key={index}
            className={`flex items-center justify-between text-sm ${
              stat.onClick ? 'cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded' : ''
            }`}
            onClick={stat.onClick}
          >
            <span className="flex items-center gap-2 text-gray-600">
              {stat.icon && (
                <span className={stat.color ? iconColorClass[stat.color] : 'text-gray-400'}>
                  {stat.icon}
                </span>
              )}
              <span>{stat.label}</span>
            </span>
            <span className="font-medium">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
