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
  _requirement: BuyerRequirement,
  _userId: string,
  _userRole: string
): PropertyMatch[] {
  return [];
}

/**
 * Find properties matching a rent requirement
 */
export function findMatchingPropertiesForRent(
  _requirement: RentRequirement,
  _userId: string,
  _userRole: string
): PropertyMatch[] {
  return []
}
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
