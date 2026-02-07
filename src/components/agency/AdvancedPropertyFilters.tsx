import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';

export interface AdvancedFilters {
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  
  // Area filters
  minArea?: number;
  maxArea?: number;
  areaUnits?: string[];
  
  // Property features
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  
  // Date filters
  listedInDays?: number; // 7, 30, 90, etc.
  updatedInDays?: number;
  expiringInDays?: number;
  
  // Performance filters
  hasNoOffers?: boolean;
  hasHighInterest?: boolean; // 3+ leads
  isStale?: boolean; // >90 days on market
  
  // Location filters
  cities?: string[];
  
  // Acquisition type
  acquisitionType?: string;
  
  // Listing type
  listingTypes?: string[];
}

interface AdvancedPropertyFiltersProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  availableCities: string[];
}

export function AdvancedPropertyFilters({ 
  filters, 
  onFiltersChange,
  availableCities 
}: AdvancedPropertyFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.minArea) count++;
    if (filters.maxArea) count++;
    if (filters.minBedrooms) count++;
    if (filters.maxBedrooms) count++;
    if (filters.minBathrooms) count++;
    if (filters.maxBathrooms) count++;
    if (filters.listedInDays) count++;
    if (filters.updatedInDays) count++;
    if (filters.expiringInDays) count++;
    if (filters.hasNoOffers) count++;
    if (filters.hasHighInterest) count++;
    if (filters.isStale) count++;
    if (filters.cities && filters.cities.length > 0) count++;
    if (filters.acquisitionType) count++;
    if (filters.listingTypes && filters.listingTypes.length > 0) count++;
    return count;
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsExpanded(false);
  };

  const handleResetFilters = () => {
    const emptyFilters: AdvancedFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const updateFilter = (key: keyof AdvancedFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayFilter = (key: 'cities' | 'areaUnits' | 'listingTypes', value: string) => {
    setLocalFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return {
        ...prev,
        [key]: updated.length > 0 ? updated : undefined
      };
    });
  };

  return (
    <div className="space-y-3">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-2">
        <Button
          variant={isExpanded ? 'default' : 'outline'}
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Expanded Filters Panel */}
      {isExpanded && (
        <Card className="p-6 space-y-6">
          {/* Price Range */}
          <div className="space-y-3">
            <Label className="font-medium">Price Range (PKR)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Min Price</Label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minPrice || ''}
                  onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Max Price</Label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxPrice || ''}
                  onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Area Range */}
          <div className="space-y-3">
            <Label className="font-medium">Area Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Min Area</Label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minArea || ''}
                  onChange={(e) => updateFilter('minArea', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Max Area</Label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxArea || ''}
                  onChange={(e) => updateFilter('maxArea', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {['sq-ft', 'sq-yards', 'marla', 'kanal'].map(unit => (
                <Button
                  key={unit}
                  variant={(localFilters.areaUnits || []).includes(unit) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleArrayFilter('areaUnits', unit)}
                >
                  {unit}
                </Button>
              ))}
            </div>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="font-medium">Bedrooms</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">Min</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.minBedrooms || ''}
                    onChange={(e) => updateFilter('minBedrooms', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Max</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.maxBedrooms || ''}
                    onChange={(e) => updateFilter('maxBedrooms', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="font-medium">Bathrooms</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">Min</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.minBathrooms || ''}
                    onChange={(e) => updateFilter('minBathrooms', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Max</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.maxBathrooms || ''}
                    onChange={(e) => updateFilter('maxBathrooms', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date Filters */}
          <div className="space-y-3">
            <Label className="font-medium">Date Filters</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Listed in last</Label>
                <Select
                  value={localFilters.listedInDays?.toString() || 'all'}
                  onValueChange={(value:any) => updateFilter('listedInDays', value === 'all' ? undefined : parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Last updated</Label>
                <Select
                  value={localFilters.updatedInDays?.toString() || 'all'}
                  onValueChange={(value:any) => updateFilter('updatedInDays', value === 'all' ? undefined : parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Expiring in</Label>
                <Select
                  value={localFilters.expiringInDays?.toString() || 'all'}
                  onValueChange={(value:any) => updateFilter('expiringInDays', value === 'all' ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Performance Filters */}
          <div className="space-y-3">
            <Label className="font-medium">Performance Filters</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="no-offers"
                  checked={localFilters.hasNoOffers || false}
                  onCheckedChange={(checked:any) => updateFilter('hasNoOffers', checked)}
                />
                <Label htmlFor="no-offers" className="cursor-pointer">
                  Properties with no offers
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="high-interest"
                  checked={localFilters.hasHighInterest || false}
                  onCheckedChange={(checked:any) => updateFilter('hasHighInterest', checked)}
                />
                <Label htmlFor="high-interest" className="cursor-pointer">
                  High interest (3+ leads)
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="stale"
                  checked={localFilters.isStale || false}
                  onCheckedChange={(checked:any) => updateFilter('isStale', checked)}
                />
                <Label htmlFor="stale" className="cursor-pointer">
                  Stale listings (&gt;90 days on market)
                </Label>
              </div>
            </div>
          </div>

          {/* Location Filter */}
          {availableCities.length > 0 && (
            <div className="space-y-3">
              <Label className="font-medium">Cities</Label>
              <div className="flex flex-wrap gap-2">
                {availableCities.map(city => (
                  <Button
                    key={city}
                    variant={(localFilters.cities || []).includes(city) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleArrayFilter('cities', city)}
                  >
                    {city}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Acquisition Type */}
          <div className="space-y-3">
            <Label className="font-medium">Acquisition Type</Label>
            <Select
              value={localFilters.acquisitionType || 'all'}
              onValueChange={(value:any) => updateFilter('acquisitionType', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="agency-owned">Agency Owned</SelectItem>
                <SelectItem value="client-listing">Client Listing</SelectItem>
                <SelectItem value="investor">Investor Purchase</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Listing Type */}
          <div className="space-y-3">
            <Label className="font-medium">Listing Type</Label>
            <div className="flex gap-2">
              <Button
                variant={(localFilters.listingTypes || []).includes('sale') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayFilter('listingTypes', 'sale')}
              >
                For Sale
              </Button>
              <Button
                variant={(localFilters.listingTypes || []).includes('rent') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayFilter('listingTypes', 'rent')}
              >
                For Rent
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleApplyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={() => setIsExpanded(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2">
          {filters.minPrice && (
            <Badge variant="secondary" className="gap-1">
              Min: PKR {filters.minPrice.toLocaleString()}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, minPrice: undefined })}
              />
            </Badge>
          )}
          {filters.maxPrice && (
            <Badge variant="secondary" className="gap-1">
              Max: PKR {filters.maxPrice.toLocaleString()}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, maxPrice: undefined })}
              />
            </Badge>
          )}
          {filters.minArea && (
            <Badge variant="secondary" className="gap-1">
              Min Area: {filters.minArea}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, minArea: undefined })}
              />
            </Badge>
          )}
          {filters.hasNoOffers && (
            <Badge variant="secondary" className="gap-1">
              No Offers
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, hasNoOffers: undefined })}
              />
            </Badge>
          )}
          {filters.hasHighInterest && (
            <Badge variant="secondary" className="gap-1">
              High Interest
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, hasHighInterest: undefined })}
              />
            </Badge>
          )}
          {filters.isStale && (
            <Badge variant="secondary" className="gap-1">
              Stale Listings
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => onFiltersChange({ ...filters, isStale: undefined })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}