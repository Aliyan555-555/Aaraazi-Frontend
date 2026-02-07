/**
 * Utility functions
 * Re-exports from UI utils for backwards compatibility
 */

export { cn } from '../components/ui/utils';

import { PropertyAddress } from '../types/locations';

/**
 * Format property address for full display
 * Returns formatted string like: "Plot 123, Block A, DHA Phase 8, Karachi"
 * or "Unit A-301, Floor 3, Coral Tower, Clifton Block 2, Karachi"
 * 
 * Handles both new PropertyAddress objects and legacy string addresses
 */
export const formatPropertyAddress = (address: PropertyAddress | string | undefined): string => {
  // Handle undefined/null/empty
  if (!address || (typeof address === 'string' && !address.trim())) {
    return 'Address not set';
  }
  
  // Handle legacy string addresses
  if (typeof address === 'string') {
    return address;
  }
  
  // Handle new structured PropertyAddress
  const parts: string[] = [];
  
  // For buildings (apartments/commercial)
  if (address.buildingName) {
    if (address.unitNumber) parts.push(`Unit ${address.unitNumber}`);
    if (address.floorNumber) parts.push(`Floor ${address.floorNumber}`);
    parts.push(address.buildingName);
  } else {
    // For plots
    if (address.plotNumber) parts.push(`Plot ${address.plotNumber}`);
  }
  
  if (address.blockName) parts.push(address.blockName);
  if (address.areaName) parts.push(address.areaName);
  if (address.cityName) parts.push(address.cityName);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not set';
};

/**
 * Format property address for short display (cards/lists)
 * Returns formatted string like: "Plot 123, DHA Phase 8"
 * or "Unit A-301, Coral Tower"
 * 
 * Handles both new PropertyAddress objects and legacy string addresses
 */
export const formatPropertyAddressShort = (address: PropertyAddress | string | undefined): string => {
  // Handle undefined/null/empty
  if (!address || (typeof address === 'string' && !address.trim())) {
    return 'Address not set';
  }
  
  // Handle legacy string addresses
  if (typeof address === 'string') {
    // Try to shorten string addresses by taking first 2 parts
    const parts = address.split(',').map(p => p.trim());
    return parts.slice(0, 2).join(', ');
  }
  
  // Handle new structured PropertyAddress
  if (address.buildingName) {
    return `${address.unitNumber ? 'Unit ' + address.unitNumber + ', ' : ''}${address.buildingName}`;
  }
  if (address.plotNumber && address.areaName) {
    return `Plot ${address.plotNumber}, ${address.areaName}`;
  }
  if (address.areaName) {
    return address.areaName;
  }
  
  return 'Address not set';
};

/**
 * Format property address for one-line display
 * Returns formatted string like: "DHA Phase 8, Karachi"
 * 
 * Handles both new PropertyAddress objects and legacy string addresses
 */
export const formatPropertyAddressOneLine = (address: PropertyAddress | string | undefined): string => {
  // Handle undefined/null/empty
  if (!address || (typeof address === 'string' && !address.trim())) {
    return 'Address not set';
  }
  
  // Handle legacy string addresses
  if (typeof address === 'string') {
    // Try to get area and city from string
    const parts = address.split(',').map(p => p.trim());
    return parts.slice(-2).join(', ') || address;
  }
  
  // Handle new structured PropertyAddress
  const parts: string[] = [];
  
  if (address.areaName) parts.push(address.areaName);
  if (address.cityName) parts.push(address.cityName);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not set';
};