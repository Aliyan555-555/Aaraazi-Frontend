/**
 * Buyer Requirements Service - V3.0
 * Manage buyer/client search criteria (wanted-to-buy)
 * Separate from properties - these are requirements, not listings
 */

import { BuyerRequirement } from '../types';

const STORAGE_KEY = 'buyer_requirements_v3';

// Get all buyer requirements with RBAC
export function getBuyerRequirements(userId: string, userRole: string): BuyerRequirement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const requirements: BuyerRequirement[] = JSON.parse(stored);

    // Admin sees all
    if (userRole === 'admin' || userRole === 'superadmin') {
      return requirements;
    }

    // Agents see only their requirements
    return requirements.filter(r => r.agentId === userId);
  } catch (error) {
    console.error('Error loading buyer requirements:', error);
    return [];
  }
}

// Get single buyer requirement by ID
export function getBuyerRequirementById(id: string): BuyerRequirement | undefined {
  const requirements = getBuyerRequirements('', 'admin'); // Get all for lookup
  return requirements.find(r => r.id === id);
}

// Get requirements by buyer ID
export function getBuyerRequirementsByBuyer(buyerId: string): BuyerRequirement[] {
  const requirements = getBuyerRequirements('', 'admin'); // Get all for lookup
  return requirements.filter(r => r.buyerId === buyerId);
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
  const newRequirement: BuyerRequirement = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const requirements = getBuyerRequirements('', 'admin');
  requirements.push(newRequirement);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));

  return newRequirement;
}

// Alias for createBuyerRequirement (for consistency)
export const addBuyerRequirement = createBuyerRequirement;

// Update buyer requirement
export function updateBuyerRequirement(
  id: string,
  updates: Partial<BuyerRequirement>
): void {
  const requirements = getBuyerRequirements('', 'admin');
  const index = requirements.findIndex(r => r.id === id);

  if (index === -1) {
    throw new Error('Buyer requirement not found');
  }

  requirements[index] = {
    ...requirements[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));
}

// Match requirement with properties
export function matchRequirementWithProperties(
  requirementId: string,
  propertyIds: string[]
): void {
  const requirements = getBuyerRequirements('', 'admin');
  const index = requirements.findIndex(r => r.id === requirementId);

  if (index === -1) {
    throw new Error('Buyer requirement not found');
  }

  requirements[index] = {
    ...requirements[index],
    matchedProperties: propertyIds,
    status: propertyIds.length > 0 ? 'matched' : 'active',
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));
}

// Add viewing to requirement
export function addViewing(
  requirementId: string,
  propertyId: string,
  viewingDate: string,
  feedback?: string
): void {
  const requirements = getBuyerRequirements('', 'admin');
  const index = requirements.findIndex(r => r.id === requirementId);

  if (index === -1) {
    throw new Error('Buyer requirement not found');
  }

  const viewing = {
    propertyId,
    viewingDate,
    feedback,
    scheduledAt: new Date().toISOString(),
  };

  requirements[index] = {
    ...requirements[index],
    viewings: [...(requirements[index].viewings || []), viewing],
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));
}

// Close requirement (buyer found property)
export function closeBuyerRequirement(
  id: string,
  purchasedPropertyId?: string
): void {
  const requirements = getBuyerRequirements('', 'admin');
  const index = requirements.findIndex(r => r.id === id);

  if (index === -1) {
    throw new Error('Buyer requirement not found');
  }

  requirements[index] = {
    ...requirements[index],
    status: 'closed',
    purchasedPropertyId,
    closedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));
}

// Delete buyer requirement
export function deleteBuyerRequirement(id: string): void {
  const requirements = getBuyerRequirements('', 'admin');
  const filtered = requirements.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Get statistics
export function getBuyerRequirementStats(userId: string, userRole: string) {
  const requirements = getBuyerRequirements(userId, userRole);

  const byStatus = requirements.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byUrgency = requirements.reduce((acc, req) => {
    acc[req.urgency] = (acc[req.urgency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Unique buyers
  const uniqueBuyers = new Set(requirements.map(r => r.buyerId));

  // Average budget
  const avgBudget = requirements.length > 0
    ? requirements.reduce((sum, r) => sum + r.maxBudget, 0) / requirements.length
    : 0;

  // Total matched properties
  const totalMatches = requirements.reduce(
    (sum, r) => sum + (r.matchedProperties?.length || 0),
    0
  );

  return {
    total: requirements.length,
    byStatus,
    byUrgency,
    totalBuyers: uniqueBuyers.size,
    avgBudget,
    totalMatches,
  };
}

// Auto-match requirements with properties
// This would be called when new properties are added
export function autoMatchRequirements(propertyId: string, property: any): string[] {
  const requirements = getBuyerRequirements('', 'admin').filter(r => r.status === 'active');
  const matchedRequirements: string[] = [];

  for (const req of requirements) {
    let matches = true;

    // Check budget
    if (property.price && (property.price < req.minBudget || property.price > req.maxBudget)) {
      matches = false;
    }

    // Check property type
    if (property.propertyType && !req.propertyTypes.includes(property.propertyType)) {
      matches = false;
    }

    // Check bedrooms
    if (property.bedrooms && property.bedrooms < req.minBedrooms) {
      matches = false;
    }
    if (req.maxBedrooms && property.bedrooms && property.bedrooms > req.maxBedrooms) {
      matches = false;
    }

    // Check location (simple string match for now)
    if (req.preferredLocations.length > 0) {
      const locationMatch = req.preferredLocations.some(loc =>
        property.address?.toLowerCase().includes(loc.toLowerCase())
      );
      if (!locationMatch) {
        matches = false;
      }
    }

    if (matches) {
      matchedRequirements.push(req.id);
      
      // Add to matched properties
      const currentMatches = req.matchedProperties || [];
      if (!currentMatches.includes(propertyId)) {
        matchRequirementWithProperties(req.id, [...currentMatches, propertyId]);
      }
    }
  }

  return matchedRequirements;
}