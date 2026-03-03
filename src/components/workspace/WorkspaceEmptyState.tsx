/**
 * WorkspaceEmptyState Component
 * 
 * Consistent empty state display for workspace pages
 * Provides guidance and actions when lists are empty
 * 
 * FEATURES:
 * - Icon display (customizable)
 * - Title and description
 * - Primary action button
 * - Secondary actions
 * - Contextual guidance
 * - Different states (empty, no results, error)
 * 
 * UX LAWS:
 * - Fitts's Law: Large action button, easy to click
 * - Miller's Law: Limited actions (1-2 max)
 * - Hick's Law: Clear single action path
 * - Jakob's Law: Familiar empty state pattern
 * - Aesthetic-Usability: Friendly, helpful appearance
 * 
 * @example
 * // Empty state - no data yet
 * <WorkspaceEmptyState
 *   icon={<Home />}
 *   title="No properties yet"
 *   description="Start building your portfolio by adding your first property"
 *   primaryAction={{
 *     label: 'Add Property',
 *     icon: <Plus />,
 *     onClick: handleAddProperty
 *   }}
 *   secondaryAction={{
 *     label: 'Import Properties',
 *     onClick: handleImport
 *   }}
 * />
 * 
 * // No search results
 * <WorkspaceEmptyState
 *   variant="no-results"
 *   icon={<SearchX />}
 *   title="No results found"
 *   description="Try adjusting your search or filters"
 *   primaryAction={{
 *     label: 'Clear Filters',
 *     onClick: handleClearFilters
 *   }}
 * />
 */

import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { AlertCircle, SearchX, FolderOpen } from 'lucide-react';

// Types
interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface GuideItem {
  title: string;
  description: string;
}

export interface WorkspaceEmptyStateProps {
  // Variant
  variant?: 'empty' | 'no-results' | 'error';

  // Content
  icon?: React.ReactNode;
  title: string;
  description: string;

  // Actions (Hick's Law: max 2)
  primaryAction?: Action;
  secondaryAction?: Action;

  // Contextual guidance (Miller's Law: max 5)
  guideItems?: GuideItem[];

  // Styling
  className?: string;
}

export const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({
  variant = 'empty',
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  guideItems,
  className = '',
}) => {
  // Default icons based on variant
  const getDefaultIcon = () => {
    if (icon) return icon;

    const iconClass = "w-16 h-16 text-gray-400";

    switch (variant) {
      case 'no-results':
        return <SearchX className={iconClass} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      case 'empty':
      default:
        return <FolderOpen className={iconClass} />;
    }
  };

  // Get variant styling
  const getVariantClass = () => {
    switch (variant) {
      case 'no-results':
        return 'bg-blue-50';
      case 'error':
        return 'bg-red-50';
      case 'empty':
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[400px] p-8 ${className}`}>
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getVariantClass()} mb-6`}>
          {getDefaultIcon()}
        </div>

        {/* Title */}
        <h3 className="text-xl mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          {description}
        </p>

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {primaryAction && (
              <Button
                variant={primaryAction.variant || 'default'}
                size="default"
                onClick={primaryAction.onClick}
                className="gap-2"
              >
                {primaryAction.icon}
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || 'outline'}
                size="default"
                onClick={secondaryAction.onClick}
                className="gap-2"
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}

        {/* Contextual Guidance */}
        {guideItems && guideItems.length > 0 && (
          <Card className="p-6 text-left">
            <h4 className="text-sm font-medium mb-4">Getting Started</h4>
            <div className="space-y-3">
              {guideItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// Export the type of a single preset
export interface EmptyStatePreset {
  variant?: 'empty' | 'no-results' | 'error';
  title: string;
  description: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  guideItems?: GuideItem[];
}

// Display name for debugging
WorkspaceEmptyState.displayName = 'WorkspaceEmptyState';

/**
 * Preset empty states for common scenarios
 */
export const EmptyStatePresets = {
  // Properties workspace
  properties: (onAdd: () => void, onImport?: () => void) => ({
    title: 'No properties yet',
    description: 'Start building your portfolio by adding your first property',
    primaryAction: {
      label: 'Add Property',
      onClick: onAdd,
    },
    secondaryAction: onImport ? {
      label: 'Import Properties',
      onClick: onImport,
    } : undefined,
    guideItems: [
      {
        title: 'Add property details',
        description: 'Enter address, type, area, and pricing information'
      },
      {
        title: 'Assign an agent',
        description: 'Choose an agent to manage the property'
      },
      {
        title: 'Start a cycle',
        description: 'Create a sell, purchase, or rent cycle to track activity'
      }
    ]
  }),

  // Sell cycles workspace
  sellCycles: (onAdd: () => void) => ({
    title: 'No sell cycles yet',
    description: 'Create sell cycles to track property sales and manage offers',
    primaryAction: {
      label: 'Start Sell Cycle',
      onClick: onAdd,
    },
    guideItems: [
      {
        title: 'Select a property',
        description: 'Choose a property to list for sale'
      },
      {
        title: 'Set asking price',
        description: 'Define your target price and negotiation range'
      },
      {
        title: 'Receive and manage offers',
        description: 'Track offers and negotiate with potential buyers'
      }
    ]
  }),

  // Purchase cycles workspace
  purchaseCycles: (onAdd: () => void) => ({
    title: 'No purchase cycles yet',
    description: 'Create purchase cycles to track property acquisitions',
    primaryAction: {
      label: 'Start Purchase Cycle',
      onClick: onAdd,
    },
    guideItems: [
      {
        title: 'Find a property',
        description: 'Identify properties for acquisition'
      },
      {
        title: 'Submit an offer',
        description: 'Make an offer to the seller'
      },
      {
        title: 'Complete due diligence',
        description: 'Verify property details and documentation'
      }
    ]
  }),

  // Deals workspace
  deals: (onAdd: () => void) => ({
    title: 'No deals yet',
    description: 'Deals are created automatically when offers are accepted',
    guideItems: [
      {
        title: 'Start a sell cycle',
        description: 'List a property for sale'
      },
      {
        title: 'Receive offers',
        description: 'Wait for buyer offers on your property'
      },
      {
        title: 'Accept an offer',
        description: 'A deal is automatically created when you accept an offer'
      }
    ]
  }),

  // Requirements workspace
  requirements: (onAdd: () => void, type: 'buyer' | 'rent') => ({
    title: `No ${type} requirements yet`,
    description: `Track ${type === 'buyer' ? 'buyer' : 'tenant'} requirements to match properties`,
    primaryAction: {
      label: `Add ${type === 'buyer' ? 'Buyer' : 'Tenant'} Requirement`,
      onClick: onAdd,
    },
    guideItems: [
      {
        title: 'Define requirements',
        description: 'Specify budget, location, property type, and preferences'
      },
      {
        title: 'Find matches',
        description: 'System automatically matches available properties'
      },
      {
        title: 'Schedule viewings',
        description: 'Arrange property viewings with matched listings'
      }
    ]
  }),

  // No search results
  noResults: (onClear: () => void) => ({
    variant: 'no-results' as const,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters',
    primaryAction: {
      label: 'Clear Filters',
      onClick: onClear,
    },
  }),

  // Error state
  error: (onRetry: () => void) => ({
    variant: 'error' as const,
    title: 'Something went wrong',
    description: 'We couldn\'t load the data. Please try again.',
    primaryAction: {
      label: 'Retry',
      onClick: onRetry,
    },
  }),
};
