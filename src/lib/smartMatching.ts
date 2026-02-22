import {
  Property,
  BuyerRequirement,
  RentRequirement,
  PropertyMatch,
  MatchDetails,
} from '../types';
import { getProperties } from './data';
import { getSellCycles, getSellCycleById, submitCrossAgentOffer as submitSellOffer } from './sellCycle';
import { getRentCycles, getRentCycleById, submitCrossAgentRentOffer as submitRentOffer } from './rentCycle';
import { createNotification } from './notifications';
import { logger } from './logger';
import { getBuyerRequirementById } from './buyerRequirements';
import { getRentRequirement as getRentRequirementById } from './rentRequirements';

// ============================================
// CONSTANTS
// ============================================

const MATCH_THRESHOLD = 70; // Minimum score to be considered a match

// Weights for scoring (must add up to 100)
const WEIGHTS = {
  propertyType: 20,
  location: 25,
  price: 20,
  area: 15,
  bedrooms: 10,
  bathrooms: 5,
  features: 5,
};

// ============================================
// STORAGE KEYS
// ============================================

const MATCHES_KEY = 'property_matches';

// ============================================
// MATCH SCORE CALCULATION
// ============================================

/**
 * Calculate match score between a property and requirement
 * @returns Score from 0-100
 */
export function calculateMatchScore(
  property: Property,
  requirement: BuyerRequirement | RentRequirement,
  cyclePrice?: number
): number {
  let score = 0;
  let totalWeight = 0;

  // 1. Property Type (20%)
  if (requirement.propertyType && requirement.propertyType.length > 0) {
    const typeMatch = requirement.propertyType.includes(property.propertyType);
    if (typeMatch) {
      score += WEIGHTS.propertyType;
    }
    totalWeight += WEIGHTS.propertyType;
  }

  // 2. Location (25%)
  if (requirement.preferredAreas && requirement.preferredAreas.length > 0) {
    const addressLower = (
      (property.address?.cityName || '') + ' ' +
      (property.address?.areaName || '') + ' ' +
      (property.address?.blockName || '')
    ).toLowerCase();

    const locationMatch = requirement.preferredAreas.some(loc =>
      addressLower.includes(loc.toLowerCase())
    );

    if (locationMatch) {
      score += WEIGHTS.location;
    } else {
      // Partial match for nearby areas (same city)
      const sameCity = property.address?.cityName && requirement.preferredAreas.some(loc =>
        property.address?.cityName?.toLowerCase().includes(loc.toLowerCase())
      );
      if (sameCity) {
        score += WEIGHTS.location * 0.6; // 60% of location weight
      }
    }
    totalWeight += WEIGHTS.location;
  }

  // 3. Price Range (20%)
  const price = cyclePrice || property.price || 0;
  const budgetMin = requirement.budgetMin || 0;
  const budgetMax = requirement.budgetMax || Number.MAX_SAFE_INTEGER;

  if (price >= budgetMin && price <= budgetMax) {
    score += WEIGHTS.price; // Perfect match
  } else {
    // Partial score if within 10% of range
    const deviationLow = Math.abs(price - budgetMin) / (budgetMin || 1);
    const deviationHigh = Math.abs(price - budgetMax) / (budgetMax || 1);
    const deviation = Math.min(deviationLow, deviationHigh);

    if (deviation <= 0.1) {
      score += WEIGHTS.price * 0.75; // 75% if within 10%
    } else if (deviation <= 0.2) {
      score += WEIGHTS.price * 0.5; // 50% if within 20%
    }
  }
  totalWeight += WEIGHTS.price;

  // 4. Area/Size (15%)
  if (property.area && ('sizeMin' in requirement || 'sizeMax' in requirement)) {
    const req = requirement as BuyerRequirement;
    const propertyArea = typeof property.area === 'string' ? parseFloat(property.area) : property.area;
    const minArea = req.sizeMin || 0;
    const maxArea = req.sizeMax || Number.MAX_SAFE_INTEGER;

    if (propertyArea >= minArea && propertyArea <= maxArea) {
      score += WEIGHTS.area;
    } else {
      // Partial score if close
      const deviationLow = Math.abs(propertyArea - minArea) / (minArea || 1);
      const deviationHigh = Math.abs(propertyArea - maxArea) / (maxArea || 1);
      const deviation = Math.min(deviationLow, deviationHigh);

      if (deviation <= 0.15) {
        score += WEIGHTS.area * 0.7; // 70% if within 15%
      }
    }
  }

  // 5. Bedrooms (10%)
  if (requirement.minBedrooms && property.bedrooms) {
    if (property.bedrooms >= requirement.minBedrooms) {
      if (!requirement.maxBedrooms || property.bedrooms <= requirement.maxBedrooms) {
        score += WEIGHTS.bedrooms; // Perfect match
      } else {
        score += WEIGHTS.bedrooms * 0.5; // 50% if more than needed
      }
    } else if (Math.abs(property.bedrooms - requirement.minBedrooms) === 1) {
      score += WEIGHTS.bedrooms * 0.5; // 50% if off by 1
    }
    totalWeight += WEIGHTS.bedrooms;
  }

  // 6. Bathrooms (5%)
  if (requirement.minBathrooms && property.bathrooms) {
    if (property.bathrooms >= requirement.minBathrooms) {
      score += WEIGHTS.bathrooms;
    } else if (Math.abs(property.bathrooms - requirement.minBathrooms) === 1) {
      score += WEIGHTS.bathrooms * 0.5;
    }
    totalWeight += WEIGHTS.bathrooms;
  }

  // 7. Features (5%)
  if (requirement.features && requirement.features.length > 0 && property.features) {
    const propertyFeatures = property.features.map(f => f.toLowerCase());
    const matchingFeatures = requirement.features.filter(f =>
      propertyFeatures.some(pf =>
        pf.includes(f.toLowerCase()) || f.toLowerCase().includes(pf)
      )
    );

    const featureMatchRatio = matchingFeatures.length / requirement.features.length;
    score += WEIGHTS.features * featureMatchRatio;
    totalWeight += WEIGHTS.features;
  }

  // Normalize to 0-100
  const normalizedScore = totalWeight > 0
    ? Math.round((score / totalWeight) * 100)
    : 0;

  return normalizedScore;
}

/**
 * Get detailed match breakdown
 */
export function getMatchDetails(
  property: Property,
  requirement: BuyerRequirement | RentRequirement,
  cyclePrice?: number
): MatchDetails {
  const price = cyclePrice || property.price || 0;

  // Property type match
  const propertyTypeMatch = requirement.propertyType?.includes(property.propertyType) || false;

  // Location match
  const addressLower = (
    (property.address?.cityName || '') + ' ' +
    (property.address?.areaName || '')
  ).toLowerCase();
  const locationMatch = requirement.preferredAreas?.some(loc =>
    addressLower.includes(loc.toLowerCase())
  ) || false;

  // Price match
  const budgetMin = requirement.budgetMin || 0;
  const budgetMax = requirement.budgetMax || Number.MAX_SAFE_INTEGER;
  const priceMatch = price >= budgetMin && price <= budgetMax;

  // Area match
  let areaMatch = false;
  if (property.area && ('sizeMin' in requirement || 'sizeMax' in requirement)) {
    const req = requirement as BuyerRequirement;
    const propertyArea = typeof property.area === 'string' ? parseFloat(property.area) : property.area;
    areaMatch = propertyArea >= (req.sizeMin || 0) && propertyArea <= (req.sizeMax || Number.MAX_SAFE_INTEGER);
  }

  // Bedrooms match
  const bedroomsMatch = (requirement.minBedrooms && property.bedrooms)
    ? (property.bedrooms >= requirement.minBedrooms &&
      (!requirement.maxBedrooms || property.bedrooms <= requirement.maxBedrooms))
    : false;

  // Bathrooms match
  const bathroomsMatch = (requirement.minBathrooms && property.bathrooms)
    ? (property.bathrooms >= requirement.minBathrooms)
    : false;

  // Features match
  const featuresMatch: string[] = [];
  if (requirement.features && property.features) {
    const propertyFeatures = property.features.map(f => f.toLowerCase());
    featuresMatch.push(...requirement.features.filter(f =>
      propertyFeatures.some(pf =>
        pf.includes(f.toLowerCase()) || f.toLowerCase().includes(pf)
      )
    ));
  }

  const overallScore = calculateMatchScore(property, requirement, cyclePrice);

  return {
    propertyTypeMatch,
    locationMatch,
    priceMatch,
    areaMatch,
    bedroomsMatch,
    bathroomsMatch,
    featuresMatch,
    overallScore,
  };
}

// ============================================
// BATCH MATCHING
// ============================================

/**
 * Run matching for all shared cycles
 * Matches:
 * - Shared Sell Cycles ↔ Active Buyer Requirements
 * - Shared Rent Cycles ↔ Active Rent Requirements
 */
export function runMatchingForAllSharedCycles(
  userId: string,
  userRole: string
): PropertyMatch[] {
  logger.info('🔄 Running smart matching...');

  const allMatches: PropertyMatch[] = [];

  try {
    // Get shared sell cycles
    const allSellCycles = getSellCycles(userId, userRole);
    const sharedSellCycles = allSellCycles.filter(c =>
      c.sharing?.isShared === true &&
      (c.status === 'active' || c.status === 'pending' || c.status === 'available')
    );

    // Get shared rent cycles
    const allRentCycles = getRentCycles(userId, userRole);
    const sharedRentCycles = allRentCycles.filter(c =>
      c.sharing?.isShared === true &&
      (c.status === 'available' || c.status === 'active' || c.status === 'showing' || c.status === 'application-received')
    );

    // Get active buyer requirements
    const buyerRequirements = getBuyerRequirements(userId, userRole).filter(r =>
      r.status === 'active'
    );

    // Get active rent requirements
    const rentRequirements = getRentRequirements(userId, userRole).filter(r =>
      r.status === 'active'
    );

    // Get all properties organization-wide (using 'admin' role to bypass user filtering)
    // This is necessary because shared cycles reference properties owned by other agents
    const properties = getProperties(undefined, 'admin');

    // Match Sell Cycles with Buyer Requirements
    for (const sellCycle of sharedSellCycles) {
      const property = properties.find(p => p.id === sellCycle.propertyId);
      if (!property) continue;

      for (const requirement of buyerRequirements) {
        // Skip own requirements
        if (requirement.agentId === sellCycle.agentId) continue;

        const score = calculateMatchScore(property, requirement, sellCycle.askingPrice);

        if (score >= MATCH_THRESHOLD) {
          const match: PropertyMatch = {
            matchId: `match_${Date.now()}_${sellCycle.id}_${requirement.id}`,
            cycleId: sellCycle.id,
            cycleType: 'sell',
            requirementId: requirement.id,
            requirementType: 'buyer',
            listingAgentId: sellCycle.agentId,
            listingAgentName: sellCycle.agentName || 'Unknown Agent',
            buyerAgentId: requirement.agentId,
            buyerAgentName: requirement.agentName || 'Unknown Agent',
            matchScore: score,
            matchDetails: getMatchDetails(property, requirement, sellCycle.askingPrice),
            matchedAt: new Date().toISOString(),
            status: 'pending',
            notificationSent: false,
            updatedAt: new Date().toISOString(),
          };

          allMatches.push(match);
        }
      }
    }

    // Match Rent Cycles with Rent Requirements
    for (const rentCycle of sharedRentCycles) {
      const property = properties.find(p => p.id === rentCycle.propertyId);
      if (!property) continue;

      for (const requirement of rentRequirements) {
        // Skip own requirements
        if (requirement.agentId === rentCycle.agentId) continue;

        const score = calculateMatchScore(property, requirement, rentCycle.monthlyRent);

        if (score >= MATCH_THRESHOLD) {
          const match: PropertyMatch = {
            matchId: `match_${Date.now()}_${rentCycle.id}_${requirement.id}`,
            cycleId: rentCycle.id,
            cycleType: 'rent',
            requirementId: requirement.id,
            requirementType: 'rent',
            listingAgentId: rentCycle.agentId,
            listingAgentName: rentCycle.agentName || 'Unknown Agent',
            renterAgentId: requirement.agentId,
            renterAgentName: requirement.agentName || 'Unknown Agent',
            matchScore: score,
            matchDetails: getMatchDetails(property, requirement, rentCycle.monthlyRent),
            matchedAt: new Date().toISOString(),
            status: 'pending',
            notificationSent: false,
            updatedAt: new Date().toISOString(),
          };

          allMatches.push(match);
        }
      }
    }

    // Save matches
    saveMatches(allMatches);

    // Send notifications for new matches
    sendMatchNotifications(allMatches, properties);

    logger.info(`✅ Found ${allMatches.length} matches`);

  } catch (error) {
    logger.error('❌ Error in matching:', error);
  }

  return allMatches;
}

// ============================================
// MATCH STORAGE
// ============================================

/**
 * Save matches to localStorage
 */
export function saveMatches(_matches: PropertyMatch[]): void {
  // no-op (stub)
}

/**
 * Get all matches
 */
export function getMatches(): PropertyMatch[] {
  return [];
}

/**
 * Get matches for a specific requirement
 */
export function getMatchesForRequirement(requirementId: string): PropertyMatch[] {
  return getMatches().filter(m => m.requirementId === requirementId);
}

/**
 * Get matches for a specific agent
 */
export function getMatchesForAgent(agentId: string): PropertyMatch[] {
  return getMatches().filter(m =>
    m.buyerAgentId === agentId || m.renterAgentId === agentId
  );
}

/**
 * Update a match
 */
export function updateMatch(_matchId: string, _updates: Partial<PropertyMatch>): void {
  // no-op (stub)
}

/**
 * Clear all matches (for testing)
 */
export function clearMatches(): void {
  // no-op (stub)
}

// ============================================
// HELPER FUNCTIONS (TO BE IMPLEMENTED)
// ============================================

/**
 * Get buyer requirements
 */
function getBuyerRequirements(_userId: string, _userRole: string): BuyerRequirement[] {
  return [];
}

/**
 * Get rent requirements
 */
function getRentRequirements(_userId: string, _userRole: string): RentRequirement[] {
  try {
    const data = localStorage.getItem('estatemanager_rent_requirements_v3');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Send notifications for new matches
 */
function sendMatchNotifications(matches: PropertyMatch[], properties: Property[]): void {
  matches.forEach(match => {
    // Skip if notification already sent
    if (match.notificationSent) return;

    const property = properties.find(p => p.id === match.cycleId);
    if (!property) return;

    const agentId = match.buyerAgentId || match.renterAgentId || '';
    if (!agentId) return;

    const propertyTitle = property.title || `${property.propertyType} in ${property.address?.areaName}`;
    const priority = match.matchScore >= 90 ? 'HIGH' : 'MEDIUM';

    createNotification({
      userId: agentId,
      type: 'NEW_PROPERTY_MATCH',
      priority,
      title: `🎯 ${match.matchScore}% Match Found!`,
      message: `${propertyTitle} matches your ${match.requirementType === 'buyer' ? "buyer's" : "renter's"} requirements`,
      entityType: 'property-match',
      entityId: match.matchId,
      actionLabel: 'View Match',
      actionType: 'view',
      actionData: {
        matchId: match.matchId,
        cycleId: match.cycleId,
        cycleType: match.cycleType,
        requirementId: match.requirementId,
      },
      metadata: {
        matchScore: match.matchScore,
        listingAgent: match.listingAgentName,
      },
    });

    // Mark as sent
    match.notificationSent = true;
  });

  // Update matches with notification status
  saveMatches(matches);
}

// ============================================
// CROSS-AGENT MATCHING FOR REQUIREMENTS
// ============================================

/**
 * Find shared sell cycles that match a buyer requirement
 * Returns properties with sellCycleId included
 */
export function findSharedMatchesForBuyerRequirement(
  requirement: BuyerRequirement,
  userId: string,
  userRole: string
): PropertyMatch[] {
  const matches: PropertyMatch[] = [];

  try {
    // Get all sell cycles
    const allSellCycles = getSellCycles(userId, userRole);

    logger.info(`🔍 Finding shared matches for buyer requirement ${requirement.id}`);
    logger.info(`   Total sell cycles returned: ${allSellCycles.length}`);

    // Filter to shared cycles from OTHER agents
    // Status can be: 'active', 'pending', 'available'
    const sharedSellCycles = allSellCycles.filter(c =>
      c.sharing?.isShared === true &&
      c.agentId !== userId && // Not my own cycle
      (c.status === 'active' || c.status === 'pending' || c.status === 'available')
    );

    logger.info(`   Shared sell cycles from other agents: ${sharedSellCycles.length}`);
    if (sharedSellCycles.length > 0) {
      sharedSellCycles.forEach(c => {
        logger.info(`     - Cycle ${c.id}: ${c.status}, Agent: ${c.agentName}, Shared: ${c.sharing?.isShared}`);
      });
    }

    // Get all properties organization-wide (using 'admin' role to bypass user filtering)
    // This is necessary because shared cycles reference properties owned by other agents
    const properties = getProperties(undefined, 'admin');
    logger.info(`   Total properties available for matching: ${properties.length}`);

    // Match each shared cycle against the requirement
    for (const sellCycle of sharedSellCycles) {
      const property = properties.find(p => p.id === sellCycle.propertyId);
      if (!property) {
        logger.warn(`     - Property ${sellCycle.propertyId} not found for cycle ${sellCycle.id}`);
        continue;
      }

      const score = calculateMatchScore(property, requirement, sellCycle.askingPrice);

      logger.info(`     - Score for ${property.title || property.id}: ${score}%`);

      if (score >= MATCH_THRESHOLD) {
        const matchDetails = getMatchDetails(property, requirement, sellCycle.askingPrice);
        matches.push({
          matchId: `match-${Date.now()}-${sellCycle.id}-${requirement.id}`,
          cycleId: sellCycle.id,
          cycleType: 'sell',
          listingAgentId: sellCycle.agentId,
          listingAgentName: sellCycle.agentName || 'Unknown Agent',
          requirementId: requirement.id,
          requirementType: 'buyer',
          buyerAgentId: requirement.agentId,
          buyerAgentName: requirement.agentName || 'Unknown Agent',
          matchScore: score,
          matchDetails,
          matchedAt: new Date().toISOString(),
          status: 'pending',
          property, // UI Enrichment
          notificationSent: false,
          updatedAt: new Date().toISOString()
        } as PropertyMatch);
      }
    }

    logger.info(`Found ${matches.length} shared sell cycle matches for buyer requirement ${requirement.id}`);
  } catch (error) {
    logger.error('Error finding shared matches for buyer requirement:', error);
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Find shared rent cycles that match a rent requirement
 * Returns properties with rentCycleId included
 */
export function findSharedMatchesForRentRequirement(
  requirement: RentRequirement,
  userId: string,
  userRole: string
): PropertyMatch[] {
  const matches: PropertyMatch[] = [];

  try {
    // Get all rent cycles
    const allRentCycles = getRentCycles(userId, userRole);

    // Filter to shared cycles from OTHER agents
    const sharedRentCycles = allRentCycles.filter(c =>
      c.sharing?.isShared === true &&
      c.agentId !== userId && // Not my own cycle
      (c.status === 'available' || c.status === 'active' || c.status === 'showing' || c.status === 'application-received')
    );

    // Get all properties organization-wide (using 'admin' role to bypass user filtering)
    // This is necessary because shared cycles reference properties owned by other agents
    const properties = getProperties(undefined, 'admin');
    logger.info(`   Total properties available for rent matching: ${properties.length}`);

    // Match each shared cycle against the requirement
    for (const rentCycle of sharedRentCycles) {
      const property = properties.find(p => p.id === rentCycle.propertyId);
      if (!property) {
        logger.warn(`     - Property ${rentCycle.propertyId} not found for rent cycle ${rentCycle.id}`);
        continue;
      }

      const score = calculateMatchScore(property, requirement, rentCycle.monthlyRent);

      if (score >= MATCH_THRESHOLD) {
        const matchDetails = getMatchDetails(property, requirement, rentCycle.monthlyRent);
        matches.push({
          matchId: `match-${Date.now()}-${rentCycle.id}-${requirement.id}`,
          cycleId: rentCycle.id,
          cycleType: 'rent',
          listingAgentId: rentCycle.agentId,
          listingAgentName: rentCycle.agentName || 'Unknown Agent',
          requirementId: requirement.id,
          requirementType: 'rent',
          renterAgentId: requirement.agentId,
          renterAgentName: requirement.agentName || 'Unknown Agent',
          matchScore: score,
          matchDetails,
          matchedAt: new Date().toISOString(),
          status: 'pending',
          property, // UI Enrichment
          notificationSent: false,
          updatedAt: new Date().toISOString()
        } as PropertyMatch);
      }
    }

    logger.info(`Found ${matches.length} shared rent cycle matches for rent requirement ${requirement.id}`);
  } catch (error) {
    logger.error('Error finding shared matches for rent requirement:', error);
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Submit a cross-agent offer to a shared sell cycle
 */
export function submitCrossAgentOfferFromMatch(
  sellCycleId: string,
  buyerRequirementId: string,
  currentUserId: string,
  currentUserName: string,
  currentUserContact?: string
): void {
  try {
    // Get the buyer requirement
    const requirement = getBuyerRequirementById(buyerRequirementId);
    if (!requirement) {
      throw new Error('Buyer requirement not found');
    }

    // Get the sell cycle to get asking price
    const sellCycle = getSellCycleById(sellCycleId);
    if (!sellCycle) {
      throw new Error('Sell cycle not found');
    }

    // Build offer data
    const offerData = {
      amount: sellCycle.askingPrice, // Start with asking price
      buyerId: requirement.buyerId,
      buyerName: requirement.buyerName,
      buyerContact: requirement.buyerContact || '',
      buyerEmail: requirement.buyerEmail,
      submittedByAgentId: currentUserId,
      submittedByAgentName: currentUserName,
      submittedByAgentContact: currentUserContact,
      fromRequirementId: buyerRequirementId,
      agentNotes: `Offer submitted via smart matching for ${requirement.buyerName}`,
      coordinationRequired: true,
    };

    // Submit the offer
    submitSellOffer(sellCycleId, offerData);

    logger.info(`Submitted cross-agent offer from match: ${sellCycleId} <- ${buyerRequirementId}`);
  } catch (error) {
    logger.error('Error submitting cross-agent offer:', error);
    throw error;
  }
}

/**
 * Submit a cross-agent rent application to a shared rent cycle
 */
export function submitCrossAgentRentApplicationFromMatch(
  rentCycleId: string,
  rentRequirementId: string,
  currentUserId: string,
  currentUserName: string,
  currentUserContact?: string
): void {
  try {
    const requirement = getRentRequirementById(rentRequirementId);
    if (!requirement) {
      throw new Error('Rent requirement not found');
    }

    const rentCycle = getRentCycleById(rentCycleId);
    if (!rentCycle) {
      throw new Error('Rent cycle not found');
    }

    const applicationData = {
      amount: rentCycle.monthlyRent,
      tenantId: requirement.renterId,
      tenantName: requirement.renterName,
      tenantContact: requirement.renterContact || '',
      tenantEmail: requirement.renterEmail,
      submittedByAgentId: currentUserId,
      submittedByAgentName: currentUserName,
      submittedByAgentContact: currentUserContact,
      fromRequirementId: rentRequirementId,
      agentNotes: `Application submitted via smart matching for ${requirement.renterName}`,
      coordinationRequired: true,
    };

    submitRentOffer(rentCycleId, applicationData);

    logger.info(`Submitted cross-agent rent application from match: ${rentCycleId} <- ${rentRequirementId}`);
  } catch (error) {
    logger.error('Error submitting cross-agent rent application:', error);
    throw error;
  }
}

/**
 * Get match reasons for display
 */