/**
 * Property Card - V3.0
 * Displays property with all active cycles
 * Shows sell, purchase, and rent cycles simultaneously
 */

import React from 'react';
import { Property } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { formatPropertyAddress } from '../lib/utils';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  TrendingUp,
  TrendingDown,
  Key,
  AlertTriangle,
  Users,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { formatPKR } from '../lib/currency';
import { formatAreaDisplay } from '../lib/areaUnits';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  onStartCycle?: (type: 'sell' | 'purchase' | 'rent') => void;
  onEdit?: () => void;
  onDelete?: () => void;
  sellCyclesCount?: number;
  purchaseCyclesCount?: number;
  rentCyclesCount?: number;
  hasDualRep?: boolean;
  hasInternalMatch?: boolean;
}

export function PropertyCard({
  property,
  onClick,
  onStartCycle,
  onEdit,
  onDelete,
  sellCyclesCount = 0,
  purchaseCyclesCount = 0,
  rentCyclesCount = 0,
  hasDualRep = false,
  hasInternalMatch = false,
}: PropertyCardProps) {
  const totalActiveCycles = sellCyclesCount + purchaseCyclesCount + rentCyclesCount;

  return (
    <Card className="overflow-visible hover:shadow-lg transition-shadow cursor-pointer group">
      {/* Image */}
      <div
        onClick={onClick}
        className="relative h-48 bg-muted overflow-hidden w-full text-left border-0 p-0 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`View details for ${property.address || 'property'}`}
      >
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasInternalMatch && (
            <Badge className="bg-success text-white">
              🎯 Internal Match
            </Badge>
          )}
          {hasDualRep && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Dual Rep
            </Badge>
          )}
        </div>

        {/* Cycle Count */}
        {totalActiveCycles > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="font-medium">
              {totalActiveCycles} Active {totalActiveCycles === 1 ? 'Cycle' : 'Cycles'}
            </Badge>
          </div>
        )}

        {/* Action Menu */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onStartCycle && (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartCycle('sell'); }}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Start Sell Cycle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartCycle('purchase'); }}>
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Start Purchase Cycle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartCycle('rent'); }}>
                    <Key className="mr-2 h-4 w-4" />
                    Start Rent Cycle
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  Edit Property
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  Delete Property
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <button onClick={onClick} className="p-4 space-y-3 w-full text-left border-0" aria-label="View property details">
        {/* Address & Type */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium line-clamp-1 flex-1">
              {formatPropertyAddress(property.address) || 'Untitled Property'}
            </h3>
            <Badge variant="secondary" className="capitalize">
              {property.propertyType}
            </Badge>
          </div>
          {/* Features Tags - Show after property type with light green style */}
          {property.features && Array.isArray(property.features) && property.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
              {property.features.map((feature, index) => {
                if (!feature || typeof feature !== 'string') return null;
                return (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 border border-green-200/50"
                  >
                    {feature}
                  </span>
                );
              })}
            </div>
          )}
          <p className="text-muted-foreground">
            Owner: {property.currentOwnerName || 'Not specified'}
          </p>
        </div>

        {/* Property Details */}
        <div className="flex items-center flex-wrap gap-3 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Maximize className="h-4 w-4" />
            <span>
              {formatAreaDisplay(Number(property.area), property.areaUnit)}
            </span>
          </div>
          {property.bedrooms !== undefined && property.bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>
                {property.bedrooms} Bed{property.bedrooms !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {property.bathrooms !== undefined && property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>
                {property.bathrooms} Bath{property.bathrooms !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Active Cycles - More Informative */}
        {totalActiveCycles > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Active Cycles:
              </span>
              <Badge variant="outline">
                {totalActiveCycles} Total
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {sellCyclesCount > 0 && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 cycle-badge-selling"
                >
                  <TrendingUp className="h-3 w-3" />
                  {sellCyclesCount} Selling
                </Badge>
              )}
              {purchaseCyclesCount > 0 && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 cycle-badge-buying"
                >
                  <TrendingDown className="h-3 w-3" />
                  {purchaseCyclesCount} Buying
                </Badge>
              )}
              {rentCyclesCount > 0 && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 cycle-badge-renting"
                >
                  <Key className="h-3 w-3" />
                  {rentCyclesCount} Renting
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-3 border border-dashed rounded-lg bg-muted/30">
            <p className="text-muted-foreground">No active cycles</p>
          </div>
        )}

        {/* Status Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-muted-foreground">
            {property.status || 'Available'}
          </div>

          {hasInternalMatch && (
            <div className="flex items-center gap-1 text-success font-medium">
              <Users className="h-3 w-3" />
              <span>Match!</span>
            </div>
          )}
        </div>
      </button>
    </Card>
  );
}