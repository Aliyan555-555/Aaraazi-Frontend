import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { LucideIcon } from 'lucide-react';

interface FinancialModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stats?: {
    label: string;
    value: string | number;
    variant?: 'default' | 'success' | 'warning' | 'danger';
  }[];
  onClick: () => void;
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
  };
}

/**
 * FinancialModuleCard Component
 * 
 * Reusable card component for financial modules on the FinancialsHub dashboard.
 * Displays module icon, title, description, optional badge, and up to 4 stats.
 * 
 * Design System Compliant:
 * - No Tailwind typography classes (text-*, font-*)
 * - Uses 8px spacing grid
 * - Consistent border-radius (rounded-lg)
 * - Proper hover states
 * 
 * UX Laws Applied:
 * - Fitts's Law: Large clickable area
 * - Aesthetic-Usability: Consistent spacing and design
 * 
 * @example
 * <FinancialModuleCard
 *   title="Sales & Commissions"
 *   description="Track commissions and sales revenue"
 *   icon={DollarSign}
 *   stats={[
 *     { label: 'Pending', value: 5, variant: 'warning' },
 *     { label: 'Total', value: formatPKR(450000), variant: 'success' }
 *   ]}
 *   onClick={() => handleNavigate('commissions')}
 *   badge={{ text: 'Updated', variant: 'success' }}
 * />
 */
export const FinancialModuleCard: React.FC<FinancialModuleCardProps> = ({
  title,
  description,
  icon: Icon,
  stats,
  onClick,
  badge
}) => {
  return (
    <Card 
      className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info-bg">
            <Icon className="h-6 w-6 text-info-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-1">{title}</h3>
            {badge && (
              <Badge variant={badge.variant || 'default'} className="mt-1">
                {badge.text}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4">{description}</p>

      {/* Stats - Max 4 stats per card (Miller's Law: 7±2) */}
      {stats && stats.length > 0 && (
        <div className={`grid ${stats.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 pt-4 border-t border-gray-100`}>
          {stats.slice(0, 4).map((stat, index) => (
            <div key={index}>
              <p className="text-gray-500 mb-1">{stat.label}</p>
              <p className={
                stat.variant === 'success' ? 'text-success' :
                stat.variant === 'warning' ? 'text-warning-foreground' :
                stat.variant === 'danger' ? 'text-destructive-foreground' :
                'text-gray-900'
              }>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
