/**
 * Investor Syndication Service
 * 
 * NOTE: This service supports investor syndication for property purchase cycles only.
 * The standalone "Investors Management" section has been removed from navigation.
 * 
 * Investors can be assigned to properties during purchase cycles (investor-purchase type)
 * and this service handles their allocations, investments, and profit distributions.
 */

import { Investor, InvestorInvestment, Property, InvestorShare } from '../types';
import { getProperties, getContacts } from './data';

const INVESTORS_KEY = 'estate_investors';
const INVESTMENTS_KEY = 'estate_investor_investments';

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize investor data on app startup
 * Creates default structure if needed
 * 
 * Used for investor syndication in purchase cycles
 */
export function initializeInvestorData(): void {
  // Check if investors exist, if not create empty array
  const investorsJson = localStorage.getItem(INVESTORS_KEY);
  if (!investorsJson) {
    localStorage.setItem(INVESTORS_KEY, JSON.stringify([]));
  }
  
  // Check if investments exist, if not create empty array
  const investmentsJson = localStorage.getItem(INVESTMENTS_KEY);
  if (!investmentsJson) {
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify([]));
  }
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate Pakistani CNIC format (XXXXX-XXXXXXX-X)
 */
export function validateCNIC(cnic: string): boolean {
  if (!cnic) return false;
  // Remove dashes for validation
  const cleaned = cnic.replace(/-/g, '');
  // Must be exactly 13 digits
  return /^\d{13}$/.test(cleaned);
}

/**
 * Validate Pakistani phone number
 * Accepts formats: 03001234567, +923001234567, 3001234567
 */
export function validatePakistaniPhone(phone: string): boolean {
  if (!phone) return false;
  // Remove spaces, dashes, and plus
  const cleaned = phone.replace(/[\s\-+]/g, '');
  // Must be 10 digits (03XXXXXXXXX) or 11 digits (923XXXXXXXXX) or 12 digits (923XXXXXXXXX)
  return /^(0?3\d{9}|92?3\d{9})$/.test(cleaned);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if email is already used by another investor
 */
export function isDuplicateEmail(email: string, excludeInvestorId?: string): boolean {
  if (!email) return false;
  const investors = getInvestors();
  return investors.some(inv => 
    inv.email?.toLowerCase() === email.toLowerCase() && 
    inv.id !== excludeInvestorId
  );
}

/**
 * Check if phone is already used by another investor
 */
export function isDuplicatePhone(phone: string, excludeInvestorId?: string): boolean {
  if (!phone) return false;
  const investors = getInvestors();
  const cleanedPhone = phone.replace(/[\s\-+]/g, '');
  return investors.some(inv => {
    const invPhone = inv.phone?.replace(/[\s\-+]/g, '');
    return invPhone === cleanedPhone && inv.id !== excludeInvestorId;
  });
}

/**
 * Check if CNIC is already used by another investor
 */
export function isDuplicateCNIC(cnic: string, excludeInvestorId?: string): boolean {
  if (!cnic) return false;
  const investors = getInvestors();
  const cleanedCNIC = cnic.replace(/-/g, '');
  return investors.some(inv => {
    const invCNIC = inv.cnic?.replace(/-/g, '');
    return invCNIC === cleanedCNIC && inv.id !== excludeInvestorId;
  });
}

// ============================================
// FORMATTING FUNCTIONS
// ============================================

/**
 * Format CNIC with dashes (XXXXX-XXXXXXX-X)
 */
export function formatCNIC(cnic: string): string {
  if (!cnic) return '';
  // Remove any existing dashes
  const cleaned = cnic.replace(/-/g, '');
  // Add dashes in correct positions
  if (cleaned.length >= 13) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
  }
  return cnic;
}

/**
 * Format Pakistani phone number (03XX-XXXXXXX)
 */
export function formatPakistaniPhone(phone: string): string {
  if (!phone) return '';
  // Remove any spaces, dashes, plus signs
  let cleaned = phone.replace(/[\s\-+]/g, '');
  
  // Handle international format (92XXXXXXXXXX)
  if (cleaned.startsWith('92')) {
    cleaned = '0' + cleaned.slice(2);
  }
  
  // Add dash after 4th digit (03XX-XXXXXXX)
  if (cleaned.length >= 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  return phone;
}

// ============================================
// INVESTOR CRUD OPERATIONS
// ============================================

/**
 * Get all investors (with optional filtering by user)
 */
export function getInvestors(userId?: string, userRole?: string): Investor[] {
  const json = localStorage.getItem(INVESTORS_KEY);
  const investors: Investor[] = json ? JSON.parse(json) : [];
  
  // Admin sees everything
  if (!userId || userRole === 'admin') {
    return investors;
  }
  
  // Agents see only their managed investors
  return investors.filter(inv => inv.managingAgentId === userId);
}

/**
 * Get a specific investor by ID
 */
export function getInvestorById(id: string): Investor | undefined {
  const investors = getInvestors();
  return investors.find(inv => inv.id === id);
}

/**
 * Create a new investor
 */
export function createInvestor(data: Partial<Investor>, userId: string, userName: string): Investor {
  const investors = getInvestors();
  
  const newInvestor: Investor = {
    id: `investor_${Date.now()}`,
    contactId: data.contactId || `contact_${Date.now()}`,
    
    // Basic info
    name: data.name!,
    email: data.email,
    phone: data.phone!,
    cnic: data.cnic,
    address: data.address,
    city: data.city,
    
    // Investor-specific
    investorType: data.investorType || 'individual',
    riskProfile: data.riskProfile || 'moderate',
    investmentGoals: data.investmentGoals || [],
    preferredPropertyTypes: data.preferredPropertyTypes || [],
    preferredLocations: data.preferredLocations || [],
    minimumROIExpectation: data.minimumROIExpectation,
    
    // Investment capacity
    totalInvestmentCapacity: data.totalInvestmentCapacity,
    minimumInvestmentAmount: data.minimumInvestmentAmount,
    maximumInvestmentAmount: data.maximumInvestmentAmount,
    investmentHorizon: data.investmentHorizon,
    
    // Banking information
    bankName: data.bankName,
    accountTitle: data.accountTitle,
    accountNumber: data.accountNumber,
    iban: data.iban,
    
    // Previous experience
    previousInvestments: data.previousInvestments,
    
    // Portfolio summary (initial zeros)
    totalInvested: 0,
    currentPortfolioValue: 0,
    realizedGains: 0,
    unrealizedGains: 0,
    totalROI: 0,
    activeProperties: 0,
    soldProperties: 0,
    
    // Investment tracking
    investments: [],
    
    // Relationship
    managingAgentId: data.managingAgentId || userId,
    managingAgentName: data.managingAgentName || userName,
    relationshipStatus: data.relationshipStatus || 'active',
    
    // Preferences
    communicationPreference: data.communicationPreference,
    reportingFrequency: data.reportingFrequency,
    
    // Metadata
    joinedDate: new Date().toISOString().split('T')[0],
    lastReviewDate: undefined,
    nextReviewDate: undefined,
    status: data.status || 'active',
    notes: data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  investors.push(newInvestor);
  localStorage.setItem(INVESTORS_KEY, JSON.stringify(investors));
  
  return newInvestor;
}

/**
 * Alias for createInvestor (for consistency)
 */
export function addInvestor(data: Partial<Investor>): Investor {
  // Use a default user if not provided in data
  const userId = data.agentId || 'system';
  const userName = data.agentName || 'System';
  return createInvestor(data, userId, userName);
}

/**
 * Update an existing investor
 */
export function updateInvestor(id: string, updates: Partial<Investor>): void {
  const investors = getInvestors();
  const index = investors.findIndex(inv => inv.id === id);
  
  if (index !== -1) {
    investors[index] = {
      ...investors[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(INVESTORS_KEY, JSON.stringify(investors));
  }
}

/**
 * Delete an investor (soft delete - mark as archived)
 */
export function deleteInvestor(id: string): void {
  updateInvestor(id, { status: 'archived' });
}

// ============================================
// INVESTMENT OPERATIONS
// ============================================

/**
 * Get all investments
 */
function getAllInvestments(): InvestorInvestment[] {
  const json = localStorage.getItem(INVESTMENTS_KEY);
  return json ? JSON.parse(json) : [];
}

/**
 * Get all investments (exported version)
 * For use in analytics and reporting components
 */
export function getAllInvestorInvestments(): InvestorInvestment[] {
  return getAllInvestments();
}

/**
 * Save investments to localStorage
 */
function saveInvestments(investments: InvestorInvestment[]): void {
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments));
}

/**
 * Get all investments for a specific investor
 */
export function getInvestorInvestments(investorId: string): InvestorInvestment[] {
  const investments = getAllInvestments();
  return investments.filter(inv => inv.investorId === investorId);
}

/**
 * Get all investments for a specific property
 */
export function getPropertyInvestments(propertyId: string): InvestorInvestment[] {
  const investments = getAllInvestments();
  return investments.filter(inv => inv.propertyId === propertyId);
}

/**
 * Add a new investment record
 */
export function addInvestorInvestment(
  investorId: string,
  propertyId: string,
  details: {
    propertyAddress: string;
    sharePercentage: number;
    investmentAmount: number;
    acquisitionPrice: number;
    purchaseCycleId?: string;
    notes?: string;
  }
): InvestorInvestment {
  const investments = getAllInvestments();
  
  const newInvestment: InvestorInvestment = {
    id: `investment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    investorId,
    propertyId,
    propertyAddress: details.propertyAddress,
    
    // Investment details
    sharePercentage: details.sharePercentage,
    investmentAmount: details.investmentAmount,
    investmentDate: new Date().toISOString().split('T')[0],
    acquisitionPrice: details.acquisitionPrice,
    
    // Current status
    status: 'active',
    currentValue: details.acquisitionPrice, // Start with acquisition price
    
    // Returns (initial zeros)
    rentalIncome: 0,
    appreciationValue: 0,
    unrealizedProfit: 0,
    roi: 0,
    
    // Links
    purchaseCycleId: details.purchaseCycleId,
    
    // Metadata
    notes: details.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  investments.push(newInvestment);
  saveInvestments(investments);
  
  // Update investor's portfolio summary
  recalculateInvestorPortfolio(investorId);
  
  return newInvestment;
}

/**
 * Update an investment's current value (for appreciation tracking)
 */
export function updateInvestmentValue(investmentId: string, newValue: number): void {
  const investments = getAllInvestments();
  const index = investments.findIndex(inv => inv.id === investmentId);
  
  if (index !== -1) {
    const investment = investments[index];
    const acquisitionValue = investment.acquisitionPrice * (investment.sharePercentage / 100);
    const currentValue = newValue * (investment.sharePercentage / 100);
    
    investments[index] = {
      ...investment,
      currentValue: newValue,
      appreciationValue: currentValue - acquisitionValue,
      unrealizedProfit: currentValue - investment.investmentAmount,
      roi: ((currentValue - investment.investmentAmount) / investment.investmentAmount) * 100,
      updatedAt: new Date().toISOString(),
    };
    
    saveInvestments(investments);
    recalculateInvestorPortfolio(investment.investorId);
  }
}

/**
 * Close an investment (when property is sold)
 */
export function closeInvestment(
  investmentId: string,
  salePrice: number,
  sellCycleId?: string
): void {
  const investments = getAllInvestments();
  const index = investments.findIndex(inv => inv.id === investmentId);
  
  if (index !== -1) {
    const investment = investments[index];
    const investorShare = salePrice * (investment.sharePercentage / 100);
    const profit = investorShare - investment.investmentAmount;
    const roi = (profit / investment.investmentAmount) * 100;
    
    investments[index] = {
      ...investment,
      status: 'sold',
      soldDate: new Date().toISOString().split('T')[0],
      soldPrice: salePrice,
      saleProfit: profit,
      realizedProfit: profit,
      roi,
      sellCycleId,
      updatedAt: new Date().toISOString(),
    };
    
    saveInvestments(investments);
    recalculateInvestorPortfolio(investment.investorId);
  }
}

/**
 * Add rental income to an investment
 */
export function addRentalIncome(investmentId: string, amount: number): void {
  const investments = getAllInvestments();
  const index = investments.findIndex(inv => inv.id === investmentId);
  
  if (index !== -1) {
    const investment = investments[index];
    const newRentalIncome = (investment.rentalIncome || 0) + amount;
    
    investments[index] = {
      ...investment,
      rentalIncome: newRentalIncome,
      updatedAt: new Date().toISOString(),
    };
    
    saveInvestments(investments);
    recalculateInvestorPortfolio(investment.investorId);
  }
}

// ============================================
// PORTFOLIO CALCULATIONS
// ============================================

/**
 * Recalculate an investor's portfolio summary
 */
export function recalculateInvestorPortfolio(investorId: string): void {
  const investments = getInvestorInvestments(investorId);
  
  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const soldInvestments = investments.filter(inv => inv.status === 'sold');
  
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  
  const currentPortfolioValue = activeInvestments.reduce((sum, inv) => {
    return sum + (inv.currentValue || inv.acquisitionPrice) * (inv.sharePercentage / 100);
  }, 0);
  
  const realizedGains = soldInvestments.reduce((sum, inv) => sum + (inv.realizedProfit || 0), 0);
  
  const unrealizedGains = activeInvestments.reduce((sum, inv) => {
    const currentValue = (inv.currentValue || inv.acquisitionPrice) * (inv.sharePercentage / 100);
    return sum + (currentValue - inv.investmentAmount);
  }, 0);
  
  const totalROI = totalInvested > 0
    ? ((realizedGains + unrealizedGains) / totalInvested) * 100
    : 0;
  
  updateInvestor(investorId, {
    totalInvested,
    currentPortfolioValue,
    realizedGains,
    unrealizedGains,
    totalROI,
    activeProperties: activeInvestments.length,
    soldProperties: soldInvestments.length,
  });
}

/**
 * Calculate ROI for a specific investor
 */
export function calculateInvestorROI(investorId: string): number {
  const investor = getInvestorById(investorId);
  return investor?.totalROI || 0;
}

/**
 * Calculate portfolio value for a specific investor
 */
export function calculateInvestorPortfolioValue(investorId: string): number {
  const investor = getInvestorById(investorId);
  return investor?.currentPortfolioValue || 0;
}

/**
 * Get properties owned by a specific investor
 */
export function getInvestorProperties(investorId: string): Property[] {
  const investments = getInvestorInvestments(investorId);
  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const propertyIds = activeInvestments.map(inv => inv.propertyId);
  
  const allProperties = getProperties();
  return allProperties.filter(prop => propertyIds.includes(prop.id));
}

/**
 * Get detailed property information for an investor's investment
 */
export function getInvestorPropertyDetails(investorId: string, propertyId: string): {
  property: Property | undefined;
  investment: InvestorInvestment | undefined;
  sharePercentage: number;
  investmentAmount: number;
  currentValue: number;
  roi: number;
} | null {
  const investments = getInvestorInvestments(investorId);
  const investment = investments.find(inv => inv.propertyId === propertyId);
  
  if (!investment) {
    return null;
  }
  
  const allProperties = getProperties();
  const property = allProperties.find(p => p.id === propertyId);
  
  return {
    property,
    investment,
    sharePercentage: investment.sharePercentage,
    investmentAmount: investment.investmentAmount,
    currentValue: investment.currentValue || investment.acquisitionPrice,
    roi: investment.roi || 0,
  };
}

/**
 * Get portfolio summary for an investor
 */
export function getInvestorPortfolioSummary(investorId: string): {
  totalInvested: number;
  currentValue: number;
  realizedGains: number;
  unrealizedGains: number;
  totalROI: number;
  activeProperties: number;
  soldProperties: number;
  averageInvestment: number;
  bestPerformingProperty?: {
    address: string;
    roi: number;
  };
} {
  const investor = getInvestorById(investorId);
  const investments = getInvestorInvestments(investorId);
  
  if (!investor) {
    return {
      totalInvested: 0,
      currentValue: 0,
      realizedGains: 0,
      unrealizedGains: 0,
      totalROI: 0,
      activeProperties: 0,
      soldProperties: 0,
      averageInvestment: 0,
    };
  }
  
  const averageInvestment = investments.length > 0
    ? investor.totalInvested / investments.length
    : 0;
  
  // Find best performing property
  const bestPerforming = investments
    .filter(inv => inv.roi !== undefined && inv.roi > 0)
    .sort((a, b) => (b.roi || 0) - (a.roi || 0))[0];
  
  return {
    totalInvested: investor.totalInvested,
    currentValue: investor.currentPortfolioValue,
    realizedGains: investor.realizedGains,
    unrealizedGains: investor.unrealizedGains,
    totalROI: investor.totalROI,
    activeProperties: investor.activeProperties,
    soldProperties: investor.soldProperties,
    averageInvestment,
    bestPerformingProperty: bestPerforming ? {
      address: bestPerforming.propertyAddress,
      roi: bestPerforming.roi || 0,
    } : undefined,
  };
}

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * Get investor statistics
 */
export function getInvestorStats(userId?: string, userRole?: string): {
  totalInvestors: number;
  activeInvestors: number;
  totalCapitalInvested: number;
  totalPortfolioValue: number;
  averageROI: number;
  totalActiveProperties: number;
  totalSoldProperties: number;
} {
  const investors = getInvestors(userId, userRole);
  const activeInvestors = investors.filter(inv => inv.status === 'active');
  
  const totalCapitalInvested = investors.reduce((sum, inv) => sum + inv.totalInvested, 0);
  const totalPortfolioValue = investors.reduce((sum, inv) => sum + inv.currentPortfolioValue, 0);
  
  const averageROI = activeInvestors.length > 0
    ? activeInvestors.reduce((sum, inv) => sum + inv.totalROI, 0) / activeInvestors.length
    : 0;
  
  const totalActiveProperties = investors.reduce((sum, inv) => sum + inv.activeProperties, 0);
  const totalSoldProperties = investors.reduce((sum, inv) => sum + inv.soldProperties, 0);
  
  return {
    totalInvestors: investors.length,
    activeInvestors: activeInvestors.length,
    totalCapitalInvested,
    totalPortfolioValue,
    averageROI,
    totalActiveProperties,
    totalSoldProperties,
  };
}

/**
 * Get top performing investors
 */
export function getTopPerformingInvestors(limit: number = 5): Investor[] {
  const investors = getInvestors();
  const activeInvestors = investors.filter(inv => inv.status === 'active' && inv.totalInvested > 0);
  
  return activeInvestors
    .sort((a, b) => b.totalROI - a.totalROI)
    .slice(0, limit);
}

// ============================================
// LEGACY COMPATIBILITY FUNCTIONS
// (For backward compatibility with existing components)
// ============================================

/**
 * @deprecated Use createInvestor or updateInvestor instead
 */
export function saveInvestor(investor: Investor): void {
  if (investor.id && getInvestorById(investor.id)) {
    updateInvestor(investor.id, investor);
  } else {
    // For create, we need userId which isn't in the Investor type
    // This is a compatibility shim - new code should use createInvestor
    const investors = getInvestors();
    investors.push(investor);
    localStorage.setItem(INVESTORS_KEY, JSON.stringify(investors));
  }
}

/**
 * @deprecated Use getInvestorInvestments instead
 */
export function getPropertyInvestmentsByInvestor(investorId: string): InvestorInvestment[] {
  return getInvestorInvestments(investorId);
}

/**
 * @deprecated Use getPropertyInvestments instead
 */
export function getPropertyInvestmentsByProperty(propertyId: string): InvestorInvestment[] {
  return getPropertyInvestments(propertyId);
}

/**
 * @deprecated Use addInvestorInvestment or update investment manually
 */
export function savePropertyInvestment(investment: InvestorInvestment): void {
  const investments = getAllInvestments();
  const existingIndex = investments.findIndex(inv => inv.id === investment.id);
  
  if (existingIndex >= 0) {
    investments[existingIndex] = investment;
  } else {
    investments.push(investment);
  }
  
  saveInvestments(investments);
  recalculateInvestorPortfolio(investment.investorId);
}

/**
 * @deprecated Delete investment
 */
export function deletePropertyInvestment(investmentId: string): void {
  const investments = getAllInvestments();
  const investment = investments.find(inv => inv.id === investmentId);
  
  if (investment) {
    const filtered = investments.filter(inv => inv.id !== investmentId);
    saveInvestments(filtered);
    recalculateInvestorPortfolio(investment.investorId);
  }
}

/**
 * @deprecated Profit distributions not implemented in new system
 * Returns empty array for compatibility
 */
export function getProfitDistributionsByInvestor(investorId: string): any[] {
  return [];
}

/**
 * @deprecated Profit distributions not implemented in new system
 * Returns empty array for compatibility
 */
export function getProfitDistributionByProperty(propertyId: string): any[] {
  return [];
}

/**
 * @deprecated Profit distributions not implemented in new system
 */
export function saveProfitDistribution(distribution: any): void {
  // No-op for compatibility
  console.warn('saveProfitDistribution is deprecated and does nothing');
}

/**
 * @deprecated Share validation - always returns true for compatibility
 */
export function validateProfitShares(shares: any[]): boolean {
  return true;
}

/**
 * @deprecated Use getInvestorPortfolioSummary instead
 */
export function calculateInvestorPerformance(investorId: string): any {
  return getInvestorPortfolioSummary(investorId);
}

/**
 * @deprecated Use recalculateInvestorPortfolio instead
 */
export function updateInvestorStats(investorId: string): void {
  recalculateInvestorPortfolio(investorId);
}