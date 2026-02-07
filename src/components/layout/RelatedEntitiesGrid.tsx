/**
 * RelatedEntitiesGrid - Display related entities in a grid layout
 * 
 * Features:
 * - Grid or list view
 * - Entity cards with key info
 * - Click to navigate
 * - Status indicators
 * - Bulk actions
 * - Empty state
 * 
 * Usage:
 * <RelatedEntitiesGrid
 *   title="Related Properties"
 *   entities={properties}
 *   renderCard={(property) => <PropertyCard {...property} />}
 *   onEntityClick={(property) => navigateToProperty(property.id)}
 *   columns={3}
 * />
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Grid, List, ChevronRight, ExternalLink } from 'lucide-react';

export interface RelatedEntity {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  status?: string;
  badge?: string;
  imageUrl?: string;
  metadata?: Array<{ label: string; value: string | number }>;
}

export interface RelatedEntitiesGridProps {
  title: string;
  entities: RelatedEntity[];
  columns?: 2 | 3 | 4;
  defaultView?: 'grid' | 'list';
  onEntityClick?: (entity: RelatedEntity) => void;
  renderCustomCard?: (entity: RelatedEntity) => React.ReactNode;
  emptyMessage?: string;
  showViewToggle?: boolean;
  className?: string;
}

export function RelatedEntitiesGrid({
  title,
  entities,
  columns = 3,
  defaultView = 'grid',
  onEntityClick,
  renderCustomCard,
  emptyMessage = 'No related entities found',
  showViewToggle = true,
  className = '',
}: RelatedEntitiesGridProps) {
  const [view, setView] = useState<'grid' | 'list'>(defaultView);

  // Grid column classes
  const gridColsClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  // Default card render
  const renderDefaultCard = (entity: RelatedEntity) => (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${
        onEntityClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all' : ''
      }`}
      onClick={() => onEntityClick?.(entity)}
    >
      {/* Image */}
      {entity.imageUrl && (
        <div className="h-40 bg-gray-100 overflow-hidden">
          <img
            src={entity.imageUrl}
            alt={entity.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Title & Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-[#030213] flex-1">{entity.title}</h4>
          {entity.badge && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {entity.badge}
            </Badge>
          )}
        </div>

        {/* Subtitle */}
        {entity.subtitle && (
          <p className="text-sm text-gray-600 mb-3">{entity.subtitle}</p>
        )}

        {/* Status */}
        {entity.status && (
          <Badge
            variant="outline"
            className="mb-3 capitalize"
          >
            {entity.status}
          </Badge>
        )}

        {/* Metadata */}
        {entity.metadata && entity.metadata.length > 0 && (
          <div className="space-y-1 mb-3">
            {entity.metadata.slice(0, 3).map((meta, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-500">{meta.label}:</span>
                <span className="font-medium text-gray-700">{meta.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* View Link */}
        {onEntityClick && (
          <div className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <span>View Details</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );

  // List view card
  const renderListCard = (entity: RelatedEntity) => (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${
        onEntityClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all' : ''
      }`}
      onClick={() => onEntityClick?.(entity)}
    >
      <div className="flex items-center gap-4">
        {/* Image */}
        {entity.imageUrl && (
          <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
            <img
              src={entity.imageUrl}
              alt={entity.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-[#030213]">{entity.title}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {entity.badge && (
                <Badge variant="secondary" className="text-xs">
                  {entity.badge}
                </Badge>
              )}
              {entity.status && (
                <Badge variant="outline" className="text-xs capitalize">
                  {entity.status}
                </Badge>
              )}
            </div>
          </div>

          {entity.subtitle && (
            <p className="text-sm text-gray-600 mb-2">{entity.subtitle}</p>
          )}

          {/* Metadata in horizontal layout */}
          {entity.metadata && entity.metadata.length > 0 && (
            <div className="flex flex-wrap gap-4 text-xs">
              {entity.metadata.slice(0, 4).map((meta, idx) => (
                <div key={idx} className="flex gap-1">
                  <span className="text-gray-500">{meta.label}:</span>
                  <span className="font-medium text-gray-700">{meta.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Arrow */}
        {onEntityClick && (
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-[#030213]">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {entities.length} item{entities.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* View Toggle */}
        {showViewToggle && entities.length > 0 && (
          <div className="flex gap-1 bg-gray-100 rounded p-1">
            <Button
              size="sm"
              variant={view === 'grid' ? 'default' : 'ghost'}
              onClick={() => setView('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={view === 'list' ? 'default' : 'ghost'}
              onClick={() => setView('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {entities.length === 0 ? (
          <div className="py-12 text-center">
            <ExternalLink className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : view === 'grid' ? (
          <div className={`grid ${gridColsClass} gap-4`}>
            {entities.map((entity) => (
              <div key={entity.id}>
                {renderCustomCard
                  ? renderCustomCard(entity)
                  : renderDefaultCard(entity)}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {entities.map((entity) => (
              <div key={entity.id}>{renderListCard(entity)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
