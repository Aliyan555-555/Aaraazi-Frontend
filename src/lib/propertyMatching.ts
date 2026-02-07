/**
 * Property Matching Service - V3.0
 * Matches buyer/rent requirements with available properties
 */

import { Property, BuyerRequirement, RentRequirement, SellCycle, RentCycle } from '../types';
import { getProperties } from './data';
import { getSellCycles } from './sellCycle';
import { getRentCycles } from './rentCycle';
import { formatPropertyAddress } from './utils';

export interface PropertyMatch {
  propertyId: string;
  property: Property;
  sellCycleId?: string; // V3.0: Link to the active sell cycle
  rentCycleId?: string; // V3.0: Link to the active rent cycle
  askingPrice?: number; // V3.0: Asking price from the sell cycle
  monthlyRent?: number; // V3.0: Monthly rent from the rent cycle
  matchScore: number;
  matchReasons: string[];
  mismatches: string[];
}

/**
 * Find properties matching a buyer requirement
 */
export function findMatchingPropertiesForBuyer(
  requirement: BuyerRequirement,
  userId: string,
  userRole: string
): PropertyMatch[] {
  const allProperties = getProperties(userId, userRole);
  const sellCycles = getSellCycles(userId, userRole);
  
  // Only match properties that have active sell cycles
  const propertiesForSale = allProperties.filter(property => {
    const activeSellCycle = sellCycles.find(
      cycle => cycle.propertyId === property.id && 
      cycle.status !== 'sold' && 
      cycle.status !== 'cancelled'
    );
    return activeSellCycle !== undefined;
  });
  
  const matches: PropertyMatch[] = [];
  
  for (const property of propertiesForSale) {
    const sellCycle = sellCycles.find(c => c.propertyId === property.id);
    if (!sellCycle) continue;
    
    let matchScore = 0;
    const matchReasons: string[] = [];
    const mismatches: string[] = [];
    
    // Budget matching (40 points)
    const askingPrice = sellCycle.askingPrice || property.price;
    if (askingPrice >= requirement.minBudget && askingPrice <= requirement.maxBudget) {
      matchScore += 40;
      matchReasons.push('Price within budget');
    } else if (askingPrice < requirement.minBudget) {
      mismatches.push(`Price below budget (${((requirement.minBudget - askingPrice) / requirement.minBudget * 100).toFixed(0)}% less)`);
    } else {
      mismatches.push(`Price above budget (${((askingPrice - requirement.maxBudget) / requirement.maxBudget * 100).toFixed(0)}% more)`);
    }
    
    // Property type matching (20 points)
    if (requirement.propertyTypes && requirement.propertyTypes.includes(property.propertyType)) {
      matchScore += 20;
      matchReasons.push('Matching property type');
    } else if (requirement.propertyTypes) {
      mismatches.push('Property type does not match');
    }
    
    // Bedroom matching (15 points)
    if (property.bedrooms && property.bedrooms >= requirement.minBedrooms) {
      if (!requirement.maxBedrooms || property.bedrooms <= requirement.maxBedrooms) {
        matchScore += 15;
        matchReasons.push('Bedrooms match requirements');
      } else {
        matchScore += 5;
        matchReasons.push('More bedrooms than needed');
      }
    } else if (property.bedrooms) {
      mismatches.push(`Not enough bedrooms (has ${property.bedrooms}, needs ${requirement.minBedrooms})`);
    }
    
    // Bathroom matching (10 points)
    if (requirement.minBathrooms && property.bathrooms) {
      if (property.bathrooms >= requirement.minBathrooms) {
        matchScore += 10;
        matchReasons.push('Bathrooms meet requirements');
      } else {
        mismatches.push(`Not enough bathrooms (has ${property.bathrooms}, needs ${requirement.minBathrooms})`);
      }
    }
    
    // Location matching (15 points)
    if (requirement.preferredLocations && requirement.preferredLocations.length > 0) {
      // Get the formatted address string for matching
      const addressString = formatPropertyAddress(property.address).toLowerCase();
      
      // For structured addresses, also check individual fields
      const addressObject = property.address;
      const cityName = typeof addressObject === 'object' ? addressObject.cityName?.toLowerCase() || '' : '';
      const areaName = typeof addressObject === 'object' ? addressObject.areaName?.toLowerCase() || '' : '';
      const blockName = typeof addressObject === 'object' ? addressObject.blockName?.toLowerCase() || '' : '';
      
      const locationMatch = requirement.preferredLocations.some(loc => {
        const searchLoc = loc.toLowerCase();
        return addressString.includes(searchLoc) ||
               cityName.includes(searchLoc) ||
               areaName.includes(searchLoc) ||
               blockName.includes(searchLoc);
      });
      
      if (locationMatch) {
        matchScore += 15;
        matchReasons.push('Located in preferred area');
      } else {
        mismatches.push('Location not in preferred areas');
      }
    } else {
      // No location preference, give some points
      matchScore += 7;
    }
    
    // Must-have features matching (bonus points)
    if (requirement.mustHaveFeatures && requirement.mustHaveFeatures.length > 0) {
      const propertyFeatures = property.features || [];
      const matchingFeatures = requirement.mustHaveFeatures.filter(feature =>
        propertyFeatures.some(pf => pf.toLowerCase().includes(feature.toLowerCase()))
      );
      
      if (matchingFeatures.length === requirement.mustHaveFeatures.length) {
        matchScore += 10;
        matchReasons.push('All must-have features available');
      } else if (matchingFeatures.length > 0) {
        matchScore += 5;
        matchReasons.push(`${matchingFeatures.length}/${requirement.mustHaveFeatures.length} must-have features`);
        const missing = requirement.mustHaveFeatures.filter(f => !matchingFeatures.includes(f));
        mismatches.push(`Missing: ${missing.join(', ')}`);
      } else {
        mismatches.push(`Missing all must-have features: ${requirement.mustHaveFeatures.join(', ')}`);
      }
    }
    
    // Only include if match score is at least 30% (30 points)
    if (matchScore >= 30) {
      matches.push({
        propertyId: property.id,
        property,
        sellCycleId: sellCycle.id, // V3.0: Link to the active sell cycle
        askingPrice: askingPrice, // V3.0: Include the asking price from sell cycle
        matchScore,
        matchReasons,
        mismatches,
      });
    }
  }
  
  // Sort by match score (highest first)
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  return matches;
}

/**
 * Find properties matching a rent requirement
 */
export function findMatchingPropertiesForRent(
  requirement: RentRequirement,
  userId: string,
  userRole: string
): PropertyMatch[] {
  const allProperties = getProperties(userId, userRole);
  const rentCycles = getRentCycles(userId, userRole);
  
  // Only match properties that have active rent cycles (available for rent)
  const propertiesForRent = allProperties.filter(property => {
    const activeRentCycle = rentCycles.find(
      cycle => cycle.propertyId === property.id && 
      (cycle.status === 'available' || cycle.status === 'showing' || cycle.status === 'application-received')
    );
    return activeRentCycle !== undefined;
  });
  
  const matches: PropertyMatch[] = [];
  
  for (const property of propertiesForRent) {
    const rentCycle = rentCycles.find(c => c.propertyId === property.id);
    if (!rentCycle) continue;
    
    let matchScore = 0;
    const matchReasons: string[] = [];
    const mismatches: string[] = [];
    
    // Budget matching (40 points)
    const monthlyRent = rentCycle.monthlyRent || property.price;
    if (monthlyRent >= requirement.minBudget && monthlyRent <= requirement.maxBudget) {
      matchScore += 40;
      matchReasons.push('Price within budget');
    } else if (monthlyRent < requirement.minBudget) {
      mismatches.push(`Price below budget (${((requirement.minBudget - monthlyRent) / requirement.minBudget * 100).toFixed(0)}% less)`);
    } else {
      mismatches.push(`Price above budget (${((monthlyRent - requirement.maxBudget) / requirement.maxBudget * 100).toFixed(0)}% more)`);
    }
    
    // Property type matching (20 points)
    if (requirement.propertyTypes && requirement.propertyTypes.includes(property.propertyType)) {
      matchScore += 20;
      matchReasons.push('Matching property type');
    } else if (requirement.propertyTypes) {
      mismatches.push('Property type does not match');
    }
    
    // Bedroom matching (15 points)
    if (property.bedrooms && property.bedrooms >= requirement.minBedrooms) {
      if (!requirement.maxBedrooms || property.bedrooms <= requirement.maxBedrooms) {
        matchScore += 15;
        matchReasons.push('Bedrooms match requirements');
      } else {
        matchScore += 5;
        matchReasons.push('More bedrooms than needed');
      }
    } else if (property.bedrooms) {
      mismatches.push(`Not enough bedrooms (has ${property.bedrooms}, needs ${requirement.minBedrooms})`);
    }
    
    // Bathroom matching (10 points)
    if (requirement.minBathrooms && property.bathrooms) {
      if (property.bathrooms >= requirement.minBathrooms) {
        matchScore += 10;
        matchReasons.push('Bathrooms meet requirements');
      } else {
        mismatches.push(`Not enough bathrooms (has ${property.bathrooms}, needs ${requirement.minBathrooms})`);
      }
    }
    
    // Location matching (15 points)
    if (requirement.preferredLocations && requirement.preferredLocations.length > 0) {
      // Get the formatted address string for matching
      const addressString = formatPropertyAddress(property.address).toLowerCase();
      
      // For structured addresses, also check individual fields
      const addressObject = property.address;
      const cityName = typeof addressObject === 'object' ? addressObject.cityName?.toLowerCase() || '' : '';
      const areaName = typeof addressObject === 'object' ? addressObject.areaName?.toLowerCase() || '' : '';
      const blockName = typeof addressObject === 'object' ? addressObject.blockName?.toLowerCase() || '' : '';
      
      const locationMatch = requirement.preferredLocations.some(loc => {
        const searchLoc = loc.toLowerCase();
        return addressString.includes(searchLoc) ||
               cityName.includes(searchLoc) ||
               areaName.includes(searchLoc) ||
               blockName.includes(searchLoc);
      });
      
      if (locationMatch) {
        matchScore += 15;
        matchReasons.push('Located in preferred area');
      } else {
        mismatches.push('Location not in preferred areas');
      }
    } else {
      // No location preference, give some points
      matchScore += 7;
    }
    
    // Must-have features matching (bonus points)
    if (requirement.mustHaveFeatures && requirement.mustHaveFeatures.length > 0) {
      const propertyFeatures = property.features || [];
      const matchingFeatures = requirement.mustHaveFeatures.filter(feature =>
        propertyFeatures.some(pf => pf.toLowerCase().includes(feature.toLowerCase()))
      );
      
      if (matchingFeatures.length === requirement.mustHaveFeatures.length) {
        matchScore += 10;
        matchReasons.push('All must-have features available');
      } else if (matchingFeatures.length > 0) {
        matchScore += 5;
        matchReasons.push(`${matchingFeatures.length}/${requirement.mustHaveFeatures.length} must-have features`);
        const missing = requirement.mustHaveFeatures.filter(f => !matchingFeatures.includes(f));
        mismatches.push(`Missing: ${missing.join(', ')}`);
      } else {
        mismatches.push(`Missing all must-have features: ${requirement.mustHaveFeatures.join(', ')}`);
      }
    }
    
    // Only include if match score is at least 30% (30 points)
    if (matchScore >= 30) {
      matches.push({
        propertyId: property.id,
        property,
        rentCycleId: rentCycle.id, // V3.0: Link to the active rent cycle
        monthlyRent: monthlyRent, // V3.0: Include the monthly rent from rent cycle
        matchScore,
        matchReasons,
        mismatches,
      });
    }
  }
  
  // Sort by match score (highest first)
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  return matches;
}

/**
 * Get match score color
 */
export function getMatchScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-blue-600 bg-blue-50';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50';
  return 'text-gray-600 bg-gray-50';
}

/**
 * Get match score label
 */
export function getMatchScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Partial Match';
}
