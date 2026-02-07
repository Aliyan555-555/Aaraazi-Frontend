/**
 * Navigation Helper - V3.0
 * Central navigation state management for all cycles and properties
 */

import { SellCycle, PurchaseCycle, RentCycle, BuyerRequirement, Property } from '../types';
import { getSellCycleById } from './sellCycle';
import { getProperties } from './data';

/**
 * Navigate to sell cycle details
 */
export function navigateToSellCycle(cycleId: string, onNavigate: (page: string, data: any) => void) {
  const cycle = getSellCycleById(cycleId);
  if (cycle) {
    onNavigate('sell-cycle-details', cycle);
  }
}

/**
 * Navigate to property with its sell cycle
 */
export function navigateToPropertySellCycle(propertyId: string, onNavigate: (page: string, data: any) => void) {
  const properties = getProperties();
  const property = properties.find(p => p.id === propertyId);
  
  if (property && property.activeSellCycleIds && property.activeSellCycleIds.length > 0) {
    const cycleId = property.activeSellCycleIds[0]; // Get first active sell cycle
    navigateToSellCycle(cycleId, onNavigate);
  }
}

/**
 * Check if property has active sell cycle
 */
export function hasActiveSellCycle(propertyId: string): boolean {
  const properties = getProperties();
  const property = properties.find(p => p.id === propertyId);
  return !!(property && property.activeSellCycleIds && property.activeSellCycleIds.length > 0);
}

/**
 * Get active sell cycle ID for a property
 */
export function getActiveSellCycleId(propertyId: string): string | null {
  const properties = getProperties();
  const property = properties.find(p => p.id === propertyId);
  
  if (property && property.activeSellCycleIds && property.activeSellCycleIds.length > 0) {
    return property.activeSellCycleIds[0];
  }
  
  return null;
}
