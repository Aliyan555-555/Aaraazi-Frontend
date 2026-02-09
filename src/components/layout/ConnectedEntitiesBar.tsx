import React, { useState } from 'react';
import { EntityChip } from './EntityChip';
import { Button } from '../ui/button';
import { ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export interface ConnectedEntity {
  type: 'property' | 'agent' | 'client' | 'deal' | 'investor' | 'owner' | 'seller' | 'buyer' | 'tenant' | 'landlord' | 'location' | 'purchaser' | 'contact' | 'requirement';
  id?: string;
  name: string;
  role?: string;
  icon?: React.ReactNode;
  status?: 'active' | 'inactive';
  onClick?: () => void;
}

export interface ConnectedEntitiesBarProps {
  entities: ConnectedEntity[];
  maxVisible?: number;
  onViewAll?: () => void;
  className?: string;
}

/**
 * ConnectedEntitiesBar - Compact horizontal display of connected entities
 * 
 * Usage:
 * <ConnectedEntitiesBar 
 *   entities={[
 *     { type: 'owner', id: '1', name: 'Ahmed Khan', onClick: () => nav('client', '1') },
 *     { type: 'agent', id: '2', name: 'Sarah Ali', role: 'Listing Agent' },
 *     { type: 'deal', id: '3', name: 'Deal #12', onClick: () => nav('deal', '3') }
 *   ]}
 *   maxVisible={5}
 * />
 */
export function ConnectedEntitiesBar({
  entities,
  maxVisible = 5,
  onViewAll,
  className = ''
}: ConnectedEntitiesBarProps) {
  const [showAllDialog, setShowAllDialog] = useState(false);

  if (!entities || entities.length === 0) {
    return null;
  }

  const visibleEntities = entities.slice(0, maxVisible);
  const hiddenCount = entities.length - maxVisible;
  const hasMore = hiddenCount > 0;

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      setShowAllDialog(true);
    }
  };

  return (
    <>
      <div
        className={`flex items-center gap-2 px-4 py-2 bg-[#f8f8f9] border-y border-gray-200 ${className}`}
        role="navigation"
        aria-label="Connected entities"
      >
        {/* Connected Entities Label */}
        <span className="text-sm text-gray-600 mr-2">Connected:</span>

        {/* Entity Chips */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {visibleEntities.map((entity, index) => (
            <React.Fragment key={entity.id || index}>
              <EntityChip
                type={entity.type}
                name={entity.name}
                role={entity.role}
                status={entity.status}
                onClick={entity.onClick}
                variant="compact"
              />
              {index < visibleEntities.length - 1 && (
                <span className="text-gray-300" aria-hidden="true">|</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Show More Button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="text-gray-600 hover:text-[#030213] ml-2"
          >
            +{hiddenCount} more
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* View All Dialog */}
      <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Connected Entities ({entities.length})</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {entities.map((entity, index) => (
              <EntityChip
                key={entity.id || index}
                type={entity.type}
                name={entity.name}
                role={entity.role}
                status={entity.status}
                onClick={() => {
                  entity.onClick?.();
                  setShowAllDialog(false);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}