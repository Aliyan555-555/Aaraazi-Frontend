/**
 * Location Management Types
 * Structured address system for properties
 */

export interface City {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string; // saasAdminId
}

export interface Area {
  id: string;
  cityId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Block {
  id: string;
  areaId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Building {
  id: string;
  areaId: string;
  blockId?: string; // Optional - some buildings aren't in blocks
  name: string;
  type: 'residential' | 'commercial' | 'mixed';
  totalFloors: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface PropertyAddress {
  // Core location (required for all types)
  cityId: string;
  cityName: string; // Denormalized for display
  areaId: string;
  areaName: string;
  blockId?: string; // Optional - not all areas have blocks
  blockName?: string;
  
  // For Plot/Land properties
  plotNumber?: string; // User input
  
  // For Apartments/Commercial in buildings
  buildingId?: string;
  buildingName?: string;
  floorNumber?: string; // User input
  unitNumber?: string; // User input (apartment/shop number)
}
