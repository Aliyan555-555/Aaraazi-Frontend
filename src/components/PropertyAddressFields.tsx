/**
 * PropertyAddressFields Component
 * Structured address input with cascading dropdowns
 * Property-type-specific fields (plot/building/floor/unit)
 * Now using real API calls
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { locationsApi, type City, type Area, type Block } from '../lib/api/locations';


interface PropertyAddressFieldsProps {
  propertyType: string;
  countryId?: string; // Default to Pakistan if not provided
  addressData: {
    cityId: string;
    areaId: string;
    blockId: string;
    buildingId: string;
    plotNumber: string;
    floorNumber: string;
    unitNumber: string;
  };
  errors: {
    cityId?: string;
    areaId?: string;
    blockId?: string;
    buildingId?: string;
    plotNumber?: string;
    floorNumber?: string;
    unitNumber?: string;
  };
  onChange: (field: any, value: string) => void;
}

export const PropertyAddressFields: React.FC<PropertyAddressFieldsProps> = ({
  propertyType,
  countryId,
  addressData,
  errors,
  onChange
}) => {
  // State for location data
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Load cities on mount: use countryId if provided (CUID), else resolve Pakistan by code
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoadingCities(true);
        let effectiveCountryId = countryId;
        if (!effectiveCountryId) {
          const countries = await locationsApi.getCountries();
          const pakistan = countries.find((c) => c.code === 'PK');
          effectiveCountryId = pakistan?.id;
        }
        if (!effectiveCountryId) {
          setCities([]);
          return;
        }
        const citiesData = await locationsApi.getCities(effectiveCountryId);
        setCities(citiesData);
      } catch (error) {
        console.error('Failed to load cities:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, [countryId]);

  // Load areas when city changes
  useEffect(() => {
    const loadAreas = async () => {
      if (!addressData.cityId) {
        setAreas([]);
        return;
      }

      try {
        setLoadingAreas(true);
        const areasData = await locationsApi.getAreas(addressData.cityId);
        setAreas(areasData);
      } catch (error) {
        console.error('Failed to load areas:', error);
      } finally {
        setLoadingAreas(false);
      }
    };

    loadAreas();
  }, [addressData.cityId]);

  // Load blocks when area changes
  useEffect(() => {
    const loadBlocks = async () => {
      if (!addressData.areaId) {
        setBlocks([]);
        return;
      }

      try {
        setLoadingBlocks(true);
        const blocksData = await locationsApi.getBlocks(addressData.areaId);
        setBlocks(blocksData);
      } catch (error) {
        console.error('Failed to load blocks:', error);
      } finally {
        setLoadingBlocks(false);
      }
    };

    loadBlocks();
  }, [addressData.areaId]);

  // Determine which fields to show based on property type
  const needsBuilding = ['apartment', 'commercial'].includes(propertyType);
  const needsPlot = ['plot', 'land', 'house'].includes(propertyType);
  const needsFloorAndUnit = ['apartment', 'commercial'].includes(propertyType);

  // Handle city change - reset dependent fields
  const handleCityChange = (value: string) => {
    onChange('cityId', value);
    onChange('areaId', '');
    onChange('blockId', '');
    onChange('buildingId', '');
  };

  // Handle area change - reset dependent fields
  const handleAreaChange = (value: string) => {
    onChange('areaId', value);
    onChange('blockId', '');
    onChange('buildingId', '');
  };

  // Handle block change - reset building
  const handleBlockChange = (value: string) => {
    onChange('blockId', value);
    onChange('buildingId', '');
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      {!propertyType && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            Select property type first to see relevant address fields
          </p>
        </div>
      )}

      {cities.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">No cities available</p>
            <p className="mt-1">Please contact your administrator to add cities before creating properties.</p>
          </div>
        </div>
      )}

      {/* City Selection */}
      <FormField
        label="City"
        required
        error={errors.cityId}
        hint="Select the city where the property is located"
      >
        <Select value={addressData.cityId || undefined} onValueChange={handleCityChange} disabled={loadingCities}>
          <SelectTrigger>
            <SelectValue placeholder={loadingCities ? "Loading cities..." : "Select city"} />
          </SelectTrigger>
          <SelectContent>
            {loadingCities ? (
              <div className="px-2 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading cities...
              </div>
            ) : cities.length > 0 ? (
              cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-3 text-sm text-gray-500 text-center">
                No cities available
              </div>
            )}
          </SelectContent>
        </Select>
      </FormField>

      {/* Area Selection */}
      <FormField
        label="Area"
        required
        error={errors.areaId}
        hint="Select the specific area or society"
      >
        <Select
          value={addressData.areaId || undefined}
          onValueChange={handleAreaChange}
          disabled={!addressData.cityId || loadingAreas}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              loadingAreas ? "Loading areas..." : 
              addressData.cityId ? "Select area" : 
              "Select city first"
            } />
          </SelectTrigger>
          <SelectContent>
            {loadingAreas ? (
              <div className="px-2 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading areas...
              </div>
            ) : areas.length > 0 ? (
              areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-3 text-sm text-gray-500 text-center">
                No areas available in this city
              </div>
            )}
          </SelectContent>
        </Select>
      </FormField>

      {/* Block Selection (Optional) - Only show if blocks exist or loading */}
      {(blocks.length > 0 || loadingBlocks) && (
        <FormField
          label="Block (Optional)"
          error={errors.blockId}
          hint="Select block if applicable"
        >
          <Select
            value={addressData.blockId || undefined}
            onValueChange={handleBlockChange}
            disabled={!addressData.areaId || loadingBlocks}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingBlocks ? "Loading blocks..." : "Select block (optional)"} />
            </SelectTrigger>
            <SelectContent>
              {loadingBlocks ? (
                <div className="px-2 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading blocks...
                </div>
              ) : blocks.length > 0 ? (
                blocks.map((block) => (
                  <SelectItem key={block.id} value={block.id}>
                    {block.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-3 text-sm text-gray-500 text-center">
                  No blocks in this area
                </div>
              )}
            </SelectContent>
          </Select>
        </FormField>
      )}

      {/* Building Selection (for apartments/commercial) */}
      {needsBuilding && (
        <FormField
          label="Building Name"
          required
          error={errors.buildingId}
          hint="Enter the building name (e.g., Pearl Tower, Ocean Heights)"
        >
          <Input
            value={addressData.buildingId}
            onChange={(e) => onChange('buildingId', e.target.value)}
            placeholder="Enter building name"
            disabled={!addressData.areaId}
          />
        </FormField>
      )}

      {/* Plot Number (for plots/land/houses) */}
      {needsPlot && propertyType && (
        <FormField
          label="Plot Number"
          required
          error={errors.plotNumber}
          hint="Enter the plot or house number"
        >
          <Input
            value={addressData.plotNumber}
            onChange={(e) => onChange('plotNumber', e.target.value)}
            placeholder="e.g., 123, A-45, Plot 7"
          />
        </FormField>
      )}

      {/* Floor Number (for apartments/commercial) */}
      {needsFloorAndUnit && (
        <>
          <FormField
            label="Floor Number"
            required
            error={errors.floorNumber}
            hint="Enter the floor number"
          >
            <Input
              value={addressData.floorNumber}
              onChange={(e) => onChange('floorNumber', e.target.value)}
              placeholder="e.g., 5, Ground, 12th"
              disabled={!addressData.buildingId}
            />
          </FormField>

          <FormField
            label={propertyType === 'apartment' ? 'Apartment Number' : 'Unit/Shop Number'}
            required
            error={errors.unitNumber}
            hint={propertyType === 'apartment' ? 'Enter the apartment number' : 'Enter the unit or shop number'}
          >
            <Input
              value={addressData.unitNumber}
              onChange={(e) => onChange('unitNumber', e.target.value)}
              placeholder={propertyType === 'apartment' ? 'e.g., A-501, 12B' : 'e.g., Shop 23, Unit B'}
              disabled={!addressData.buildingId}
            />
          </FormField>
        </>
      )}

      {/* Address Preview */}
      {addressData.cityId && addressData.areaId && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <Label className="text-xs text-gray-600 mb-1 block">Address Preview</Label>
          <p className="text-sm text-gray-900">
            {getAddressPreview(propertyType, addressData, cities, areas, blocks)}
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to generate address preview
function getAddressPreview(
  propertyType: string,
  data: {
    cityId: string;
    areaId: string;
    blockId: string;
    buildingId: string;
    plotNumber: string;
    floorNumber: string;
    unitNumber: string;
  },
  cities: City[],
  areas: Area[],
  blocks: Block[]
): string {
  const parts: string[] = [];

  const city = cities.find(c => c.id === data.cityId);
  const area = areas.find(a => a.id === data.areaId);
  const block = blocks.find(b => b.id === data.blockId);

  // For buildings (apartments/commercial)
  if (data.buildingId) {
    if (data.unitNumber) parts.push(`Unit ${data.unitNumber}`);
    if (data.floorNumber) parts.push(`Floor ${data.floorNumber}`);
    parts.push(data.buildingId); // Building name
  } else {
    // For plots
    if (data.plotNumber) parts.push(`Plot ${data.plotNumber}`);
  }

  if (block) parts.push(block.name);
  if (area) parts.push(area.name);
  if (city) parts.push(city.name);

  return parts.length > 0 ? parts.join(', ') : 'Incomplete address';
}