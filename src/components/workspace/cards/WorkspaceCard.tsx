/**
 * WorkspaceCard Component
 * PHASE 5.3: Data Display Components ✅
 * 
 * PURPOSE:
 * Reusable card component for grid view. Provides consistent card structure
 * with image, title, metadata, status, and actions.
 * 
 * FEATURES:
 * - Image support with fallback
 * - Title and subtitle
 * - Metadata badges/chips
 * - Status badge
 * - Quick actions (hover)
 * - Skeleton loading state
 * - Click handler
 * - Selection support
 * 
 * UX LAWS:
 * - Fitts's Law: Large clickable area (entire card)
 * - Miller's Law: Max 5 metadata items
 * - Aesthetic-Usability: Beautiful hover states, smooth transitions
 */

import React from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

export interface WorkspaceCardProps {
  /** Card title (required) */
  title: string;
  /** Card subtitle */
  subtitle?: string;
  /** Image URL */
  image?: string;
  /** Fallback when no image */
  imageFallback?: React.ReactNode;
  /** Status badge */
  status?: {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  };
  /** Metadata items (max 5 - Miller's Law) */
  metadata?: Array<{
    label: string;
    value: string | React.ReactNode;
    icon?: React.ReactNode;
  }>;
  /** Tags/badges */
  tags?: Array<{
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  }>;
  /** Quick actions (shown on hover) */
  actions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
  }>;
  /** Footer content */
  footer?: React.ReactNode;
  /** Click handler for entire card */
  onClick?: () => void;
  /** Selected state */
  isSelected?: boolean;
  /** Disabled state */
  isDisabled?: boolean;
  /** Compact mode (less padding) */
  compact?: boolean;
  /** Show selection checkbox */
  showSelection?: boolean;
  /** Selection handler */
  onSelect?: (selected: boolean) => void;
  /** Custom className */
  className?: string;
}

/**
 * WorkspaceCard - Base card component for grid view
 */
export const WorkspaceCard = React.memo<WorkspaceCardProps>(({
  title,
  subtitle,
  image,
  imageFallback,
  status,
  metadata = [],
  tags = [],
  actions = [],
  footer,
  onClick,
  isSelected = false,
  isDisabled = false,
  compact = false,
  showSelection = false,
  onSelect,
  className,
}) => {
  // Limit metadata to 5 items (Miller's Law)
  const visibleMetadata = metadata.slice(0, 5);
  // Show up to 5 tags for features (reasonable limit to avoid clutter)
  const visibleTags = tags.slice(0, 5);

  return (
    <div
      className={cn(
        'relative group bg-white border border-gray-200 rounded-lg overflow-visible transition-all duration-200',
        'hover:shadow-lg hover:border-gray-300',
        onClick && !isDisabled && 'cursor-pointer',
        isSelected && 'ring-2 ring-blue-500 border-blue-500',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={!isDisabled ? onClick : undefined}
    >
      {/* Selection Checkbox (top-left, shown on hover or when selected) */}
      {showSelection && onSelect && (
        <div
          className={cn(
            'absolute top-3 left-3 z-10 transition-opacity',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-5 w-5 rounded border-gray-300 text-info-foreground focus:ring-info focus:ring-offset-0 cursor-pointer shadow-sm"
            aria-label="Select card"
          />
        </div>
      )}

      {/* Status Badge (top-right) */}
      {status && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant={status.variant || 'default'}>
            {status.label}
          </Badge>
        </div>
      )}

      {/* Image */}
      {(image || imageFallback) && (
        <>
          <div className="relative w-full h-48 bg-gray-100 overflow-hidden rounded-t-lg">
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                {imageFallback}
              </div>
            )}
          </div>
          {/* Feature Tags - Positioned directly under image */}
      
        </>
      )}

      {/* Content */}
      <div className={cn(compact ? 'p-4' : 'p-6')}>
        {/* Title and Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-gray-600 truncate mt-1" style={{ fontSize: 'var(--text-sm)' }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Quick Actions (shown on hover) */}
          {actions.length > 0 && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  // Show menu or trigger first action
                  actions[0]?.onClick(e);
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Tags - Only show if no image (fallback for cards without images) */}
        { (
          <div className="flex flex-wrap gap-2 mb-3">
            {visibleTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200/50"
                style={{ fontSize: 'var(--text-xs)' }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        {visibleMetadata.length > 0 && (
          <div className="space-y-2">
            {visibleMetadata.map((item, index) => (
              <div key={index} className="flex items-center justify-between" style={{ fontSize: 'var(--text-sm)' }}>
                <span className="text-gray-600 flex items-center gap-1">
                  {item.icon && <span className="text-gray-400">{item.icon}</span>}
                  {item.label}
                </span>
                <span className="font-medium text-gray-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});

WorkspaceCard.displayName = 'WorkspaceCard';

// ==================== LOADING SKELETON ====================

export interface WorkspaceCardSkeletonProps {
  /** Show image skeleton */
  showImage?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * WorkspaceCardSkeleton - Loading state for WorkspaceCard
 */
export const WorkspaceCardSkeleton: React.FC<WorkspaceCardSkeletonProps> = ({
  showImage = true,
  compact = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Image Skeleton */}
      {showImage && (
        <div className="w-full h-48 bg-gray-200 animate-pulse" />
      )}

      {/* Content Skeleton */}
      <div className={cn(compact ? 'p-4' : 'p-6', 'space-y-3')}>
        {/* Title */}
        <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
        
        {/* Subtitle */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        
        {/* Metadata */}
        <div className="space-y-2 pt-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
        </div>
      </div>
    </div>
  );
};

// ==================== EMPTY CARD ====================

export interface WorkspaceCardEmptyProps {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title */
  title: string;
  /** Description */
  description?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom className */
  className?: string;
}

/**
 * WorkspaceCardEmpty - Empty state card
 */
export const WorkspaceCardEmpty: React.FC<WorkspaceCardEmptyProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white border-2 border-dashed border-gray-300 rounded-lg p-8',
        'flex flex-col items-center justify-center text-center',
        'min-h-[300px]',
        className
      )}
    >
      {icon && (
        <div className="text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-sm" style={{ fontSize: 'var(--text-sm)' }}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
