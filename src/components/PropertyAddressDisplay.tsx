/**
 * PropertyAddressDisplay Component
 * Displays formatted property address with proper formatting
 * Handles both legacy string addresses and new structured addresses
 */

import React from 'react';
import { Property } from '../types';
import { PropertyAddress } from '../types/locations';
import { formatPropertyAddress, formatPropertyAddressShort } from '../lib/utils';
import { MapPin } from 'lucide-react';

interface PropertyAddressDisplayProps {
  property: Property;
  showIcon?: boolean;
  format?: 'short' | 'full';
  className?: string;
}

export const PropertyAddressDisplay: React.FC<PropertyAddressDisplayProps> = ({
  property,
  showIcon = false,
  format = 'full',
  className = ''
}) => {
  // Handle both legacy string addresses and new structured addresses
  const getFormattedAddress = (): string => {
    // Use the appropriate formatting function based on format parameter
    if (format === 'short') {
      return formatPropertyAddressShort(property.address);
    }
    return formatPropertyAddress(property.address);
  };

  const formattedAddress = getFormattedAddress();

  if (showIcon) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
        <span>{formattedAddress}</span>
      </div>
    );
  }

  return <span className={className}>{formattedAddress}</span>;
};

/**
 * Hook to get formatted address string
 */
export const useFormattedAddress = (property: Property, format: 'short' | 'full' = 'full'): string => {
  // Use the appropriate formatting function based on format parameter
  if (format === 'short') {
    return formatPropertyAddressShort(property.address);
  }
  return formatPropertyAddress(property.address);
};
