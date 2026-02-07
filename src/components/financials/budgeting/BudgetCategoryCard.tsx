import React from 'react';
import { formatPKR } from '../../../lib/currency';
import { TrendingUp, TrendingDown, AlertCircle, MoreVertical, Edit2, History, Copy, Archive } from 'lucide-react';
import { Progress } from '../../ui/progress';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

export interface BudgetCategory {
  id: string;
  name: string;
  budgetAmount: number;
  actualSpend: number;
  variance: number;
  variancePercentage: number;
  period: string;
  status: 'on-track' | 'warning' | 'over-budget';
}

interface BudgetCategoryCardProps {
  category: BudgetCategory;
  onClick?: (categoryId: string) => void;
  onEdit?: (categoryId: string) => void;
  onViewHistory?: (categoryId: string) => void;
  onClone?: (categoryId: string) => void;
  onArchive?: (categoryId: string) => void;
}

/**
 * BudgetCategoryCard Component
 * 
 * Card displaying a budget category with budget vs actual comparison.
 * 
 * Design System V4.1 Compliant:
 * - Uses Shadcn Progress component
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * - Uses rounded-lg for corners
 * 
 * UX Laws Applied:
 * - Fitts's Law: Large clickable card
 * - Aesthetic-Usability: Visual budget progress bar
 * - Jakob's Law: Familiar budget card pattern
 * 
 * Features:
 * - Budget vs Actual comparison
 * - Visual progress bar
 * - Variance percentage
 * - Status indicator (on-track/warning/over-budget)
 * - Color-coded by status
 * 
 * @example
 * <BudgetCategoryCard
 *   category={marketingBudget}
 *   onClick={(id) => viewCategory(id)}
 * />
 */
export const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({
  category,
  onClick,
  onEdit,
  onViewHistory,
  onClone,
  onArchive,
}) => {
  const utilizationPercentage = category.budgetAmount > 0
    ? (category.actualSpend / category.budgetAmount) * 100
    : 0;

  const isOverBudget = category.actualSpend > category.budgetAmount;
  const remaining = category.budgetAmount - category.actualSpend;

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'on-track': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      'warning': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      'over-budget': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    return colors[status] || colors['on-track'];
  };

  const statusColors = getStatusColor(category.status);

  return (
    <div
      className={`border ${statusColors.border} ${statusColors.bg} rounded-lg p-6 hover:shadow-lg transition-shadow group relative`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => onClick?.(category.id)}
        >
          <h3 className="text-gray-900 mb-1">{category.name}</h3>
          <p className="text-gray-600 text-sm">{category.period}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Icon */}
          <div className={`p-2 rounded-lg ${statusColors.bg}`}>
            {category.status === 'on-track' && <TrendingUp className={`h-5 w-5 ${statusColors.text}`} />}
            {category.status === 'warning' && <AlertCircle className={`h-5 w-5 ${statusColors.text}`} />}
            {category.status === 'over-budget' && <TrendingDown className={`h-5 w-5 ${statusColors.text}`} />}
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category.id);
                }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Budget
                </DropdownMenuItem>
              )}
              {onViewHistory && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory(category.id);
                }}>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </DropdownMenuItem>
              )}
              {onClone && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onClone(category.id);
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Clone Budget
                </DropdownMenuItem>
              )}
              {onArchive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(category.id);
                    }}
                    className="text-red-600"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Budget vs Actual */}
      <div 
        className="space-y-3 mb-4 cursor-pointer"
        onClick={() => onClick?.(category.id)}
      >
        <div className="flex justify-between items-baseline">
          <p className="text-gray-600 text-sm">Budget</p>
          <p className="text-gray-900">{formatPKR(category.budgetAmount)}</p>
        </div>
        <div className="flex justify-between items-baseline">
          <p className="text-gray-600 text-sm">Actual Spend</p>
          <p className={isOverBudget ? 'text-red-600' : 'text-gray-900'}>
            {formatPKR(category.actualSpend)}
          </p>
        </div>
        <div className="flex justify-between items-baseline">
          <p className="text-gray-600 text-sm">Remaining</p>
          <p className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatPKR(Math.abs(remaining))} {remaining < 0 && '(over)'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <Progress 
          value={Math.min(utilizationPercentage, 100)} 
          className={`h-2 ${
            utilizationPercentage > 100 ? 'bg-red-200' : 
            utilizationPercentage > 90 ? 'bg-yellow-200' : 
            'bg-green-200'
          }`}
        />
      </div>

      {/* Variance */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 text-sm">Variance</p>
        <div className="flex items-center gap-2">
          <p className={`${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
            {isOverBudget ? '-' : '+'}{formatPKR(Math.abs(category.variance))}
          </p>
          <span className={`px-2 py-1 rounded text-sm ${
            isOverBudget ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {Math.abs(category.variancePercentage).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Utilization Percentage */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-gray-600 text-sm text-center">
          Utilization: <span className={`${statusColors.text}`}>{utilizationPercentage.toFixed(1)}%</span>
        </p>
      </div>
    </div>
  );
};