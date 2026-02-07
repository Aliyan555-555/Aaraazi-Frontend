/**
 * PropertyAddressFields Component
 * Structured address input with cascading dropdowns
 * Property-type-specific fields (plot/building/floor/unit)
 */

import React, { useMemo } from 'react';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { PropertyAddress } from '../types/locations';
import {
  getActiveCities,
  getActiveAreasByCity,
  getActiveBlocksByArea,
  getActiveBuildingsByArea,
  getCityById,
  getAreaById,
  getBlockById,
  getBuildingById
} from '../lib/data';
import { AlertCircle } from 'lucide-react';

interface PropertyAddressFieldsProps {
  propertyType: string;
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
  addressData,
  errors,
  onChange
}) => {
  // Load location data
  const cities = getActiveCities();
  const areas = useMemo(() => {
    return addressData.cityId ? getActiveAreasByCity(addressData.cityId) : [];
  }, [addressData.cityId]);

  const blocks = useMemo(() => {
    return addressData.areaId ? getActiveBlocksByArea(addressData.areaId) : [];
  }, [addressData.areaId]);

  const buildings = useMemo(() => {
    return addressData.areaId ? getActiveBuildingsByArea(addressData.areaId, addressData.blockId || undefined) : [];
  }, [addressData.areaId, addressData.blockId]);

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
        <Select value={addressData.cityId || undefined} onValueChange={handleCityChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
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
          disabled={!addressData.cityId}
        >
          <SelectTrigger>
            <SelectValue placeholder={addressData.cityId ? "Select area" : "Select city first"} />
          </SelectTrigger>
          <SelectContent>
            {areas.length > 0 ? (
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

      {/* Block Selection (Optional) */}
      {blocks.length > 0 && (
        <FormField
          label="Block (Optional)"
          error={errors.blockId}
          hint="Select block if applicable"
        >
          <Select
            value={addressData.blockId || undefined}
            onValueChange={handleBlockChange}
            disabled={!addressData.areaId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select block (optional)" />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((block) => (
                <SelectItem key={block.id} value={block.id}>
                  {block.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      {/* Building Selection (for apartments/commercial) */}
      {needsBuilding && (
        <FormField
          label="Building"
          required
          error={errors.buildingId}
          hint="Select the building name"
        >
          <Select
            value={addressData.buildingId || undefined}
            onValueChange={(value) => onChange('buildingId', value)}
            disabled={!addressData.areaId}
          >
            <SelectTrigger>
              <SelectValue placeholder={addressData.areaId ? "Select building" : "Select area first"} />
            </SelectTrigger>
            <SelectContent>
              {buildings.length > 0 ? (
                buildings.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-3 text-sm text-gray-500 text-center">
                  No buildings available in this area
                </div>
              )}
            </SelectContent>
          </Select>
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
            {getAddressPreview(propertyType, addressData)}
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
  }
): string {
  const parts: string[] = [];

  const city = data.cityId ? getCityById(data.cityId) : null;
  const area = data.areaId ? getAreaById(data.areaId) : null;
  const block = data.blockId ? getBlockById(data.blockId) : null;
  const building = data.buildingId ? getBuildingById(data.buildingId) : null;

  // For buildings (apartments/commercial)
  if (building) {
    if (data.unitNumber) parts.push(`Unit ${data.unitNumber}`);
    if (data.floorNumber) parts.push(`Floor ${data.floorNumber}`);
    parts.push(building.name);
  } else {
    // For plots
    if (data.plotNumber) parts.push(`Plot ${data.plotNumber}`);
  }

  if (block) parts.push(block.name);
  if (area) parts.push(area.name);
  if (city) parts.push(city.name);

  return parts.length > 0 ? parts.join(', ') : 'Incomplete address';
}