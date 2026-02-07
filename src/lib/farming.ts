import { Farm, Contact } from '../types';

const FARMS_KEY = 'crm_farms';

// ============================================================================
// FARM MANAGEMENT
// ============================================================================

export function getFarms(userId: string, userRole: string): Farm[] {
  try {
    const stored = localStorage.getItem(FARMS_KEY);
    if (!stored) return [];
    
    const farms = JSON.parse(stored);
    
    if (!Array.isArray(farms)) {
      console.error('Farms data is not an array');
      return [];
    }
    
    // Filter by user role
    if (userRole === 'admin') {
      return farms;
    }
    
    // Agents see only their own farms
    return farms.filter((farm: Farm) => farm.agentId === userId);
  } catch (error) {
    console.error('Error loading farms:', error);
    return [];
  }
}

export function getFarmById(farmId: string): Farm | null {
  try {
    const stored = localStorage.getItem(FARMS_KEY);
    if (!stored) return null;
    
    const farms = JSON.parse(stored);
    return farms.find((farm: Farm) => farm.id === farmId) || null;
  } catch (error) {
    console.error('Error loading farm:', error);
    return null;
  }
}

export function saveFarm(farm: Farm): void {
  try {
    const stored = localStorage.getItem(FARMS_KEY);
    const farms = stored ? JSON.parse(stored) : [];
    
    const existingIndex = farms.findIndex((f: Farm) => f.id === farm.id);
    
    if (existingIndex >= 0) {
      farms[existingIndex] = farm;
    } else {
      farms.push(farm);
    }
    
    localStorage.setItem(FARMS_KEY, JSON.stringify(farms));
  } catch (error) {
    console.error('Error saving farm:', error);
    throw error;
  }
}

export function deleteFarm(farmId: string): void {
  try {
    const stored = localStorage.getItem(FARMS_KEY);
    if (!stored) return;
    
    const farms = JSON.parse(stored);
    const filtered = farms.filter((farm: Farm) => farm.id !== farmId);
    
    localStorage.setItem(FARMS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting farm:', error);
    throw error;
  }
}

export function addContactsToFarm(farmId: string, contactIds: string[]): void {
  try {
    const farm = getFarmById(farmId);
    if (!farm) {
      throw new Error('Farm not found');
    }
    
    // Add unique contacts only
    const uniqueContactIds = Array.from(new Set([...farm.contactIds, ...contactIds]));
    
    farm.contactIds = uniqueContactIds;
    farm.updatedAt = new Date().toISOString();
    
    saveFarm(farm);
  } catch (error) {
    console.error('Error adding contacts to farm:', error);
    throw error;
  }
}

export function removeContactFromFarm(farmId: string, contactId: string): void {
  try {
    const farm = getFarmById(farmId);
    if (!farm) {
      throw new Error('Farm not found');
    }
    
    farm.contactIds = farm.contactIds.filter(id => id !== contactId);
    farm.updatedAt = new Date().toISOString();
    
    saveFarm(farm);
  } catch (error) {
    console.error('Error removing contact from farm:', error);
    throw error;
  }
}

export function updateFarmStats(farmId: string, contacts: Contact[]): void {
  try {
    const farm = getFarmById(farmId);
    if (!farm) return;
    
    // Get contacts in this farm
    const farmContacts = contacts.filter(c => farm.contactIds.includes(c.id));
    
    // Calculate stats
    farm.activeProspects = farmContacts.filter(c => c.status === 'active').length;
    farm.convertedProspects = farmContacts.filter(c => c.totalTransactions > 0).length;
    
    saveFarm(farm);
  } catch (error) {
    console.error('Error updating farm stats:', error);
  }
}

// ============================================================================
// FARM ANALYTICS
// ============================================================================

export function getFarmAnalytics(farm: Farm, contacts: Contact[]): {
  totalContacts: number;
  activeProspects: number;
  convertedProspects: number;
  conversionRate: number;
  totalRevenue: number;
  avgRevenuePerContact: number;
} {
  const farmContacts = contacts.filter(c => farm.contactIds.includes(c.id));
  const totalContacts = farmContacts.length;
  const activeProspects = farmContacts.filter(c => c.status === 'active').length;
  const convertedProspects = farmContacts.filter(c => c.totalTransactions > 0).length;
  const conversionRate = totalContacts > 0 ? (convertedProspects / totalContacts) * 100 : 0;
  const totalRevenue = farmContacts.reduce((sum, c) => sum + c.totalCommissionEarned, 0);
  const avgRevenuePerContact = totalContacts > 0 ? totalRevenue / totalContacts : 0;
  
  return {
    totalContacts,
    activeProspects,
    convertedProspects,
    conversionRate,
    totalRevenue,
    avgRevenuePerContact
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initializeFarms(userId: string): void {
  const existing = getFarms(userId, 'agent');
  if (existing.length > 0) return;
  
  // Initialize with sample farms for demo
  const sampleFarms: Farm[] = [
    {
      id: 'farm-1',
      name: 'DHA Phase 6 Prospects',
      type: 'geographic',
      criteria: 'All prospects interested in DHA Phase 6 properties, focusing on 500 sq yard plots and above',
      contactIds: [],
      agentId: userId,
      createdAt: new Date('2025-09-01').toISOString(),
      updatedAt: new Date('2025-09-01').toISOString(),
      activeProspects: 0,
      convertedProspects: 0,
      totalInteractions: 0,
      tags: ['dha', 'premium', 'plots']
    },
    {
      id: 'farm-2',
      name: 'First-Time Buyers',
      type: 'demographic',
      criteria: 'Young professionals and couples looking for their first property. Budget: PKR 1-2 Crore. Preference for apartments in Clifton, PECHS, or Gulshan.',
      contactIds: [],
      agentId: userId,
      createdAt: new Date('2025-09-10').toISOString(),
      updatedAt: new Date('2025-09-10').toISOString(),
      activeProspects: 0,
      convertedProspects: 0,
      totalInteractions: 0,
      tags: ['first-time-buyer', 'apartments', 'budget-friendly']
    },
    {
      id: 'farm-3',
      name: 'Overseas Investors',
      type: 'custom',
      criteria: 'Pakistani diaspora interested in investment properties. Remote buying process. Preference for rental-yield properties and commercial spaces.',
      contactIds: [],
      agentId: userId,
      createdAt: new Date('2025-09-15').toISOString(),
      updatedAt: new Date('2025-09-15').toISOString(),
      activeProspects: 0,
      convertedProspects: 0,
      totalInteractions: 0,
      tags: ['overseas', 'investment', 'commercial']
    }
  ];
  
  localStorage.setItem(FARMS_KEY, JSON.stringify(sampleFarms));
}
