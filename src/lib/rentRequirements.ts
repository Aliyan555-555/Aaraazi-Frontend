/**
 * Rent Requirements Data Management - V3.0
 * CRUD operations for tenant search criteria
 */

import { RentRequirement } from '../types';

const STORAGE_KEY = 'estatemanager_rent_requirements_v3';

/**
 * Get all rent requirements or filter by agent/role
 */
export function getRentRequirements(agentId?: string, role?: string): RentRequirement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let requirements: RentRequirement[] = stored ? JSON.parse(stored) : [];

    // Filter based on role
    if (role === 'admin') {
      return requirements; // Admin sees all
    } else if (agentId) {
      return requirements.filter(
        req => req.agentId === agentId || req.sharedWith?.includes(agentId)
      );
    }

    return requirements;
  } catch (error) {
    console.error('Error loading rent requirements:', error);
    return [];
  }
}

/**
 * Get a single rent requirement by ID
 */
export function getRentRequirement(id: string): RentRequirement | null {
  const requirements = getRentRequirements();
  return requirements.find(req => req.id === id) || null;
}

/**
 * Create a new rent requirement
 */
export function createRentRequirement(data: Omit<RentRequirement, 'id' | 'createdAt' | 'updatedAt'>): RentRequirement {
  const requirements = getRentRequirements();
  
  const newRequirement: RentRequirement = {
    ...data,
    id: `rent_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  requirements.push(newRequirement);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));

  return newRequirement;
}

/**
 * Update an existing rent requirement
 */
export function updateRentRequirement(
  id: string,
  updates: Partial<Omit<RentRequirement, 'id' | 'createdAt'>>
): RentRequirement | null {
  const requirements = getRentRequirements();
  const index = requirements.findIndex(req => req.id === id);

  if (index === -1) {
    console.error('Rent requirement not found:', id);
    return null;
  }

  requirements[index] = {
    ...requirements[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));
  return requirements[index];
}

/**
 * Delete a rent requirement
 */
export function deleteRentRequirement(id: string): boolean {
  const requirements = getRentRequirements();
  const filtered = requirements.filter(req => req.id !== id);

  if (filtered.length === requirements.length) {
    console.error('Rent requirement not found:', id);
    return false;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Match properties to a rent requirement
 */
export function addMatchedProperty(requirementId: string, propertyId: string): boolean {
  const requirement = getRentRequirement(requirementId);
  if (!requirement) return false;

  const matchedProperties = requirement.matchedProperties || [];
  if (matchedProperties.includes(propertyId)) {
    return true; // Already matched
  }

  return updateRentRequirement(requirementId, {
    matchedProperties: [...matchedProperties, propertyId],
  }) !== null;
}

/**
 * Get statistics for rent requirements
 */
export function getRentRequirementStats(agentId?: string, role?: string) {
  const requirements = getRentRequirements(agentId, role);

  return {
    total: requirements.length,
    active: requirements.filter(req => req.status === 'active').length,
    matched: requirements.filter(req => req.status === 'matched').length,
    closed: requirements.filter(req => req.status === 'closed').length,
    urgent: requirements.filter(req => req.status === 'active' && req.urgency === 'high').length,
  };
}

/**
 * Get active rent requirements (not closed)
 */
export function getActiveRentRequirements(agentId?: string, role?: string): RentRequirement[] {
  return getRentRequirements(agentId, role).filter(req => req.status !== 'closed');
}

/**
 * Close a rent requirement (tenant found property)
 */
export function closeRentRequirement(
  requirementId: string,
  rentedPropertyId: string,
  notes?: string
): RentRequirement | null {
  return updateRentRequirement(requirementId, {
    status: 'closed',
    rentedPropertyId,
    closedAt: new Date().toISOString(),
    notes: notes || undefined,
  });
}

/**
 * Mark a rent requirement as matched (found options, not yet rented)
 */
export function markRentRequirementAsMatched(requirementId: string): RentRequirement | null {
  return updateRentRequirement(requirementId, {
    status: 'matched',
  });
}
