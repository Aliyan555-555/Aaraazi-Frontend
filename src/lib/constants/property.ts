/**
 * Central property-related constants derived from Prisma schema enums.
 * Use these instead of hardcoded arrays in form components.
 */

import { PropertyType, AreaUnit } from '@/types/schema/enums';

/** Default real estate commission rate percentage */
export const DEFAULT_COMMISSION_RATE = 2;

/** Property type options for use in selects/dropdowns */
export const PROPERTY_TYPE_OPTIONS = [
  { value: PropertyType.HOUSE, label: 'House' },
  { value: PropertyType.APARTMENT, label: 'Apartment' },
  { value: PropertyType.PLOT, label: 'Plot' },
  { value: PropertyType.COMMERCIAL, label: 'Commercial' },
  { value: PropertyType.LAND, label: 'Land' },
  { value: PropertyType.INDUSTRIAL, label: 'Industrial' },
  { value: PropertyType.VILLA, label: 'Villa' },
  { value: PropertyType.FARMHOUSE, label: 'Farmhouse' },
  { value: PropertyType.PENTHOUSE, label: 'Penthouse' },
  { value: PropertyType.STUDIO, label: 'Studio' },
  { value: PropertyType.WAREHOUSE, label: 'Warehouse' },
  { value: PropertyType.OFFICE, label: 'Office' },
  { value: PropertyType.SHOP, label: 'Shop' },
  { value: PropertyType.OTHER, label: 'Other' },
] as const;

/** Area unit options for use in selects/dropdowns */
export const AREA_UNIT_OPTIONS = [
  { value: AreaUnit.MARLA, label: 'Marla' },
  { value: AreaUnit.KANAL, label: 'Kanal' },
  { value: AreaUnit.SQFT, label: 'Sq. Feet' },
  { value: AreaUnit.SQYARDS, label: 'Sq. Yards' },
  { value: AreaUnit.SQMETER, label: 'Sq. Meter' },
  { value: AreaUnit.ACRE, label: 'Acre' },
  { value: AreaUnit.HECTARE, label: 'Hectare' },
] as const;

/** Listing type options */
export const LISTING_TYPE_OPTIONS = [
  { value: 'SALE', label: 'For Sale' },
  { value: 'RENT', label: 'For Rent' },
  { value: 'WANTED', label: 'Wanted' },
  { value: 'INVESTOR', label: 'Investment' },
] as const;

/** Property listing status labels */
export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  UNDER_OFFER: 'Under Offer',
  SOLD: 'Sold',
  RENTED: 'Rented',
  WITHDRAWN: 'Withdrawn',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived',
};
