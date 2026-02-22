/**
 * Buyer Requirements Service - V3.0
 * Manage buyer/client search criteria (wanted-to-buy)
 * Separate from properties - these are requirements, not listings
 */

import { BuyerRequirement } from '../types';

const STORAGE_KEY = 'buyer_requirements_v3';

// Get all buyer requirements (stub - no localStorage)
export function getBuyerRequirements(_userId: string, _userRole: string): BuyerRequirement[] {
  return [];
}

// Get single buyer requirement by ID (stub)
export function getBuyerRequirementById(_id: string): BuyerRequirement | undefined {
  return undefined;
}

// Get requirements by buyer ID (stub)
export function getBuyerRequirementsByBuyer(_buyerId: string): BuyerRequirement[] {
  return [];
}

// Create new buyer requirement
export function createBuyerRequirement(data: {
  buyerId: string;
  buyerName: string;
  buyerContact: string;
  agentId: string;
  agentName: string;
  
  // Budget
  minBudget: number;
  maxBudget: number;
  
  // Property criteria
  propertyTypes: string[];
  minBedrooms: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  preferredLocations: string[];
  
  // Features
  mustHaveFeatures?: string[];
  niceToHaveFeatures?: string[];
  
  // Timeline
  urgency: 'low' | 'medium' | 'high';
  targetMoveDate?: string;
  
  // Financing
  preApproved?: boolean;
  financingType?: 'cash' | 'loan' | 'installment';
  
  // Notes
  additionalNotes?: string;
}): BuyerRequirement {
  return {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Alias for createBuyerRequirement (for consistency)
export const addBuyerRequirement = createBuyerRequirement;

// Update buyer requirement (stub)
export function updateBuyerRequirement(_id: string, _updates: Partial<BuyerRequirement>): void {
  // no-op
}

// Match requirement with properties (stub)
export function matchRequirementWithProperties(
  _requirementId: string,
  _propertyIds: string[]
): void {
  // no-op
}

// Add viewing to requirement (stub)
export function addViewing(
  _requirementId: string,
  _propertyId: string,
  _viewingDate: string,
  _feedback?: string
): void {
  // no-op
}

// Close requirement (stub)
export function closeBuyerRequirement(_id: string, _purchasedPropertyId?: string): void {
  // no-op
}

// Delete buyer requirement (stub)
export function deleteBuyerRequirement(_id: string): void {
  // no-op
}

// Get statistics (stub)
export function getBuyerRequirementStats(_userId: string, _userRole: string) {
  return {
    total: 0,
    byStatus: {} as Record<string, number>,
    byUrgency: {} as Record<string, number>,
    totalBuyers: 0,
    avgBudget: 0,
    totalMatches: 0,
  };
}

// Auto-match requirements (stub)
export function autoMatchRequirements(_propertyId: string, _property: any): string[] {
  return [];
}