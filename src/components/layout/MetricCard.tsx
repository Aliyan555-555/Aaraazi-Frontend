import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period?: string;
  };
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

/**
 * MetricCard - Display single metric with optional trend indicator
 * 
 * Usage:
 * <MetricCard label="Total Properties" value={245} icon={<Building2 />} />
 * <MetricCard 
 *   label="Revenue" 
 *   value="PKR 5.2M" 
 *   trend={{ value: 12, direction: 'up', period: 'this month' }}
 * />
 */
export function MetricCard({ 
  label, 
  value, 
  icon, 
  trend, 
  onClick,
  variant = 'default',
  className = ''
}: MetricCardProps) {
  const isClickable = !!onClick;

  // Variant styles
  const variantStyles = {
    default: 'p-4',
    compact: 'p-3',
    inline: 'p-2'
  };

  const baseClasses = `
    bg-white border border-gray-200 rounded-lg 
    ${variantStyles[variant]}
    ${isClickable ? 'cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all' : ''}
    ${className}
  `;

  return (
    <div 
      className={baseClasses}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {/* Header: Label + Icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">{label}</span>
        {icon && (
          <div className="text-gray-400">
            {React.cloneElement(icon as React.ReactElement, { 
              className: 'w-4 h-4',
              'aria-hidden': 'true'
            })}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl text-[#030213]">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        
        {/* Trend Indicator */}
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" aria-label="Trending up" />
            ) : (
              <TrendingDown className="w-3 h-3" aria-label="Trending down" />
            )}
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>

      {/* Trend Period */}
      {trend?.period && (
        <div className="text-xs text-gray-500 mt-1">
          {trend.period}
        </div>
      )}
    </div>
  );
}
