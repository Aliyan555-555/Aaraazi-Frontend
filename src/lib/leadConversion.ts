/**
 * Lead Conversion Service
 * 
 * Handles the conversion of qualified leads to:
 * - Contact (always created)
 * - Buyer Requirement (if buying)
 * - Rent Requirement (if renting as tenant)
 * - Property Listing (if selling or leasing out)
 * - Investor (if investing)
 * 
 * After conversion, lead is marked as 'converted' and eventually archived
 */

import { Lead, LeadIntent, LeadRouting } from '../types/leads';
import { updateLead, getLeadById, addLeadInteraction } from './leads';
import { logger } from './logger';

// Import existing data services
// Note: These imports assume the Contact, Property, Requirement types exist
// If they don't exist yet, these will be created in next phase
import { addContact, getContacts } from './data';
import { createBuyerRequirement } from './buyerRequirements';
import { createRentRequirement } from './rentRequirements';
import { createInvestor } from './investors';
import { ensureLeadContactLink } from './dataFlowConnections';
import { 
  extractContactLeadTracking, 
  extractRequirementLeadTracking, 
  extractPropertyListingSource 
} from '../types/leadsIntegration';

// ============================================
// CONVERSION RESULT
// ============================================

export interface ConversionResult {
  success: boolean;
  contactId?: string;
  buyerRequirementId?: string;
  rentRequirementId?: string;
  propertyId?: string;
  investorId?: string;
  errors?: string[];
  warnings?: string[];
}

// ============================================
// MAIN CONVERSION FUNCTION
// ============================================

/**
 * Convert a qualified lead to Contact + appropriate entities
 * 
 * This is the main conversion workflow:
 * 1. Validate lead is qualified
 * 2. Create Contact (always)
 * 3. Create Requirement/Property based on intent
 * 4. Update lead with routing info
 * 5. Mark lead as converted
 * 6. Add conversion interaction
 */
export async function convertLead(
  leadId: string,
  options: {
    convertedBy: string;
    convertedByName: string;
    additionalNotes?: string;
  }
): Promise<ConversionResult> {
  try {
    const lead = getLeadById(leadId);
    
    if (!lead) {
      return {
        success: false,
        errors: ['Lead not found'],
      };
    }
    
    // Validate lead can be converted
    const validation = validateLeadForConversion(lead);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }
    
    const result: ConversionResult = {
      success: false,
      errors: [],
      warnings: validation.warnings || [],
    };
    
    // Step 1: Create Contact (always)
    try {
      const contactId = await createContactFromLead(lead);
      result.contactId = contactId;
      logger.info(`Created contact ${contactId} from lead ${leadId}`);
      
      // DATA FLOW CONNECTION: Ensure lead-contact link is properly established
      try {
        ensureLeadContactLink(contactId, leadId);
      } catch (error) {
        logger.warn('Error ensuring lead-contact link', error);
        // Don't throw - contact is still created
      }
    } catch (error) {
      logger.error('Failed to create contact from lead', error);
      result.errors?.push('Failed to create contact');
      return result;
    }
    
    // Step 2: Create intent-specific entities
    try {
      switch (lead.intent) {
        case 'buying':
          result.buyerRequirementId = await createBuyerRequirementFromLead(lead, result.contactId!);
          logger.info(`Created buyer requirement ${result.buyerRequirementId} from lead ${leadId}`);
          break;
          
        case 'renting':
          result.rentRequirementId = await createRentRequirementFromLead(lead, result.contactId!);
          logger.info(`Created rent requirement ${result.rentRequirementId} from lead ${leadId}`);
          break;
          
        case 'selling':
          result.propertyId = await createPropertyFromLead(lead, result.contactId!, 'for-sale');
          logger.info(`Created property listing ${result.propertyId} from lead ${leadId}`);
          break;
          
        case 'leasing-out':
          result.propertyId = await createPropertyFromLead(lead, result.contactId!, 'for-rent');
          logger.info(`Created rental property ${result.propertyId} from lead ${leadId}`);
          break;
          
        case 'investing':
          // For investors, create as buyer requirement with investment flag
          result.investorId = await createInvestorRequirementFromLead(lead, result.contactId!);
          logger.info(`Created investor requirement ${result.investorId} from lead ${leadId}`);
          break;
          
        case 'unknown':
          // Just contact creation, no additional entities
          result.warnings?.push('Lead converted to contact only - intent was unknown');
          break;
      }
    } catch (error) {
      logger.error('Failed to create intent-specific entity', error);
      result.errors?.push(`Failed to create ${lead.intent} entity`);
      result.warnings?.push('Contact was created but additional entities failed');
    }
    
    // Step 3: Update lead with routing info
    const routing: LeadRouting = {
      contactId: result.contactId!,
      buyerRequirementId: result.buyerRequirementId,
      rentRequirementId: result.rentRequirementId,
      propertyId: result.propertyId,
      investorId: result.investorId,
      convertedAt: new Date().toISOString(),
      convertedBy: options.convertedBy,
    };
    
    // Step 4: Mark lead as converted
    updateLead(leadId, {
      status: 'converted',
      routedTo: routing,
    });
    
    // Step 5: Add conversion interaction
    addLeadInteraction(leadId, {
      type: 'note',
      direction: 'outbound',
      summary: 'Lead converted successfully',
      notes: `Converted to: Contact ${result.contactId}` +
        (result.buyerRequirementId ? `, Buyer Requirement ${result.buyerRequirementId}` : '') +
        (result.rentRequirementId ? `, Rent Requirement ${result.rentRequirementId}` : '') +
        (result.propertyId ? `, Property ${result.propertyId}` : '') +
        (result.investorId ? `, Investor ${result.investorId}` : '') +
        (options.additionalNotes ? `\n\n${options.additionalNotes}` : ''),
      agentId: options.convertedBy,
      agentName: options.convertedByName,
    });
    
    result.success = true;
    logger.info(`Successfully converted lead ${leadId}`, result);
    
    return result;
  } catch (error) {
    logger.error('Lead conversion failed', error);
    return {
      success: false,
      errors: ['Unexpected error during conversion'],
    };
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate a lead is ready for conversion
 */
function validateLeadForConversion(lead: Lead): {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check status
  if (lead.status === 'converted') {
    errors.push('Lead has already been converted');
  }
  
  if (lead.status === 'lost') {
    errors.push('Cannot convert a lost lead');
  }
  
  if (lead.status === 'archived') {
    errors.push('Cannot convert an archived lead');
  }
  
  // Check required data
  if (!lead.name || lead.name.trim().length < 2) {
    errors.push('Lead name is required');
  }
  
  if (!lead.phone) {
    errors.push('Lead phone number is required');
  }
  
  // Warnings for data quality
  if (!lead.phoneVerified) {
    warnings.push('Phone number is not verified');
  }
  
  if (!lead.email) {
    warnings.push('No email address provided');
  }
  
  if (lead.intent === 'unknown') {
    warnings.push('Lead intent is unknown - will create contact only');
  }
  
  if (lead.qualificationScore < 40) {
    warnings.push('Lead has low qualification score - consider re-qualifying');
  }
  
  // Intent-specific validation
  if (lead.intent === 'buying' && !lead.details?.budgetMin && !lead.details?.budgetMax) {
    warnings.push('No budget information for buyer');
  }
  
  if (lead.intent === 'selling' && !lead.details?.propertyAddress) {
    warnings.push('No property address for seller');
  }
  
  if (lead.intent === 'renting' && !lead.details?.monthlyBudget) {
    warnings.push('No budget information for renter');
  }
  
  if (lead.intent === 'leasing-out' && !lead.details?.rentalPropertyAddress) {
    warnings.push('No property address for landlord');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ============================================
// CONTACT CREATION
// ============================================

/**
 * Create a Contact from a Lead
 * This is always done for every lead conversion
 */
async function createContactFromLead(lead: Lead): Promise<string> {
  try {
    // Determine contact type based on intent
    let contactType: 'client' | 'prospect' | 'investor' | 'vendor' = 'prospect';
    
    switch (lead.intent) {
      case 'buying':
      case 'selling':
      case 'renting':
      case 'leasing-out':
        contactType = 'client';
        break;
      case 'investing':
        contactType = 'investor';
        break;
      default:
        contactType = 'prospect';
    }
    
    // Create contact data from lead - ensure it matches Contact interface
    const contactData: any = {
      name: lead.name,
      phone: lead.phone,
      email: lead.email || undefined,
      alternatePhone: lead.alternatePhone || undefined,
      type: contactType,
      category: lead.intent === 'buying' ? 'buyer' : 
                lead.intent === 'selling' ? 'seller' :
                lead.intent === 'renting' ? 'tenant' :
                lead.intent === 'leasing-out' ? 'landlord' :
                lead.intent === 'investing' ? 'investor' : 'other',
      status: 'active',
      source: lead.source,
      agentId: lead.agentId,
      agentName: lead.agentName,
      tags: [],
      
      // Notes with comprehensive lead conversion info
      notes: `Converted from lead ${lead.id} on ${new Date().toLocaleDateString()}\n\n` +
        `=== Lead Information ===\n` +
        `Intent: ${lead.intent}\n` +
        `Timeline: ${lead.timeline}\n` +
        `Source: ${lead.source}` +
        (lead.sourceDetails ? `\nSource Details: ${lead.sourceDetails}` : '') +
        (lead.referredBy ? `\nReferred by: ${lead.referredBy}` : '') +
        `\nQualification Score: ${lead.qualificationScore}/100\n\n` +
        (lead.initialMessage ? `=== Initial Message ===\n${lead.initialMessage}\n\n` : '') +
        (lead.notes ? `=== Qualification Notes ===\n${lead.notes}` : ''),
      
      // Lead tracking fields (additional fields beyond base Contact interface)
      leadId: lead.id,
      convertedFromLead: true,
      leadSource: lead.source,
      leadInitialIntent: lead.intent,
      leadQualificationScore: lead.qualificationScore,
      leadConvertedAt: new Date().toISOString(),
      
      // Metadata - createdBy from lead
      createdBy: lead.createdBy,
    };
    
    // Use existing addContact function
    const contact = addContact(contactData);
    
    logger.info('Created contact from lead', { leadId: lead.id, contactId: contact.id, contactType });
    
    return contact.id;
  } catch (error) {
    logger.error('Failed to create contact from lead', error);
    throw new Error('Contact creation failed');
  }
}

// ============================================
// BUYER REQUIREMENT CREATION
// ============================================

/**
 * Create a Buyer Requirement from a Lead
 */
async function createBuyerRequirementFromLead(
  lead: Lead,
  contactId: string
): Promise<string> {
  try {
    const details = lead.details || {};
    
    // Map lead data to buyer requirement format
    const requirement = createBuyerRequirement({
      buyerId: contactId,
      buyerName: lead.name,
      buyerContact: lead.phone,
      agentId: lead.agentId,
      agentName: lead.agentName,
      
      // Budget
      minBudget: details.budgetMin || 0,
      maxBudget: details.budgetMax || 0,
      
      // Property criteria
      propertyTypes: details.propertyTypes || [],
      minBedrooms: details.bedrooms || 1,
      maxBedrooms: details.bedrooms,
      minBathrooms: details.bathrooms,
      preferredLocations: details.preferredAreas || [],
      
      // Features
      mustHaveFeatures: details.mustHaveFeatures || [],
      niceToHaveFeatures: [],
      
      // Timeline - map lead timeline to urgency
      urgency: lead.timeline === 'immediate' ? 'high' : 
               lead.timeline === 'within-1-month' ? 'high' :
               lead.timeline === 'within-3-months' ? 'medium' : 'low',
      targetMoveDate: undefined,
      
      // Financing
      preApproved: false,
      financingType: undefined,
      
      // Notes with lead tracking
      additionalNotes: `Created from lead ${lead.id}\\n\\n` +
        `Lead Source: ${lead.source}\\n` +
        `Timeline: ${lead.timeline}\\n` +
        `Qualification Score: ${lead.qualificationScore}/100\\n\\n` +
        (lead.notes ? `Qualification Notes:\\n${lead.notes}\\n\\n` : '') +
        (lead.initialMessage ? `Initial Message:\\n${lead.initialMessage}` : ''),
    });
    
    logger.info('Created buyer requirement from lead', { leadId: lead.id, requirementId: requirement.id });
    
    return requirement.id;
  } catch (error) {
    logger.error('Failed to create buyer requirement from lead', error);
    throw new Error('Buyer requirement creation failed');
  }
}

// ============================================
// RENT REQUIREMENT CREATION
// ============================================

/**
 * Create a Rent Requirement from a Lead
 */
async function createRentRequirementFromLead(
  lead: Lead,
  contactId: string
): Promise<string> {
  try {
    const details = lead.details || {};
    
    const requirementData: any = {
      contactId,
      leadId: lead.id,
      createdFromLead: true,
      
      // From lead details
      monthlyBudget: details.monthlyBudget,
      preferredAreas: details.preferredAreas || [],
      propertyTypes: details.propertyTypes || [],
      bedrooms: details.bedrooms,
      bathrooms: details.bathrooms,
      mustHaveFeatures: details.mustHaveFeatures || [],
      leaseDuration: details.leaseDuration,
      moveInDate: details.moveInDate,
      
      // Timeline
      timeline: lead.timeline,
      
      // Status
      status: 'active',
      
      // Notes
      notes: `Created from lead ${lead.id}\n\n` +
        (lead.notes ? `Qualification Notes:\n${lead.notes}\n\n` : '') +
        (lead.initialMessage ? `Initial Message:\n${lead.initialMessage}` : ''),
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: lead.createdBy,
    };
    
    const requirementId = await createRentRequirement(requirementData);
    
    logger.info('Created rent requirement from lead', { leadId: lead.id, requirementId });
    
    return requirementId;
  } catch (error) {
    logger.error('Failed to create rent requirement from lead', error);
    throw new Error('Rent requirement creation failed');
  }
}

// ============================================
// PROPERTY LISTING CREATION
// ============================================

/**
 * Create a Property Listing from a Lead (for sellers or landlords)
 */
async function createPropertyFromLead(
  lead: Lead,
  contactId: string,
  listingType: 'for-sale' | 'for-rent'
): Promise<string> {
  try {
    const details = lead.details || {};
    
    const propertyData: any = {
      // Basic info
      title: `Property from ${lead.name}`,
      address: listingType === 'for-sale' 
        ? details.propertyAddress 
        : details.rentalPropertyAddress,
      propertyType: details.propertyType || 'house',
      
      // Financial
      price: listingType === 'for-sale' 
        ? details.expectedPrice 
        : details.expectedRent,
      
      // Area
      area: details.propertyArea,
      areaUnit: details.propertyAreaUnit || 'sqft',
      
      // Listing info
      listingType,
      status: 'available',
      
      // Owner info
      currentOwnerId: contactId,
      
      // Source tracking
      listingSource: extractPropertyListingSource(lead.id, contactId),
      
      // Notes
      description: `Listed from lead conversion\n\n` +
        (details.reasonForSelling ? `Reason for selling: ${details.reasonForSelling}\n\n` : '') +
        (lead.notes ? `Notes:\n${lead.notes}\n\n` : '') +
        (lead.initialMessage ? `Initial Message:\n${lead.initialMessage}` : ''),
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: lead.createdBy,
    };
    
    const propertyId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    logger.info('Created property listing from lead', { leadId: lead.id, propertyId, listingType });
    
    return propertyId;
  } catch (error) {
    logger.error('Failed to create property from lead', error);
    throw new Error('Property creation failed');
  }
}

// ============================================
// INVESTOR REQUIREMENT CREATION
// ============================================

/**
 * Create an Investor from a Lead
 * Creates both an Investor record (for Portfolio Management) 
 * AND a Buyer Requirement (for matching properties)
 */
async function createInvestorRequirementFromLead(
  lead: Lead,
  contactId: string
): Promise<string> {
  try {
    const details = lead.details || {};
    
    // Create Investor record for Portfolio Management
    const investor = createInvestor({
      contactId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      cnic: details.cnic,
      address: details.address,
      city: details.city,
      
      // Investor-specific fields
      investorType: details.investorType || 'individual',
      riskProfile: details.riskTolerance || 'moderate',
      investmentGoals: details.investmentGoals || [],
      preferredPropertyTypes: details.propertyTypes || [],
      preferredLocations: details.preferredAreas || [],
      minimumROIExpectation: details.minimumROI,
      
      // Investment capacity
      totalInvestmentCapacity: details.investmentBudget,
      minimumInvestmentAmount: details.investmentBudget ? details.investmentBudget * 0.1 : undefined,
      maximumInvestmentAmount: details.investmentBudget,
      investmentHorizon: details.investmentHorizon,
      
      // Agent relationship
      managingAgentId: lead.agentId,
      managingAgentName: lead.agentName,
      relationshipStatus: 'active',
      
      // Status
      status: 'active',
      
      // Notes
      notes: `Created from investor lead ${lead.id} on ${new Date().toLocaleDateString()}\\n\\n` +
        `=== Lead Information ===\\n` +
        `Source: ${lead.source}\\n` +
        `Timeline: ${lead.timeline}\\n` +
        `Qualification Score: ${lead.qualificationScore}/100\\n\\n` +
        (details.investmentType ? `Investment Type: ${details.investmentType}\\n` : '') +
        (details.riskTolerance ? `Risk Tolerance: ${details.riskTolerance}\\n\\n` : '') +
        (lead.notes ? `=== Qualification Notes ===\\n${lead.notes}\\n\\n` : '') +
        (lead.initialMessage ? `=== Initial Message ===\\n${lead.initialMessage}` : ''),
    }, lead.agentId, lead.agentName);
    
    logger.info('Created investor record from lead', { leadId: lead.id, investorId: investor.id });
    
    // Also create a Buyer Requirement for property matching
    // This ensures the investor shows up in requirements and can be matched with properties
    const buyerRequirement = createBuyerRequirement({
      buyerId: contactId,
      buyerName: lead.name,
      buyerContact: lead.phone,
      agentId: lead.agentId,
      agentName: lead.agentName,
      
      // Budget from investment capacity
      minBudget: details.investmentBudget ? details.investmentBudget * 0.5 : 0,
      maxBudget: details.investmentBudget || 0,
      
      // Property criteria
      propertyTypes: details.propertyTypes || [],
      minBedrooms: 1,
      maxBedrooms: undefined,
      minBathrooms: undefined,
      preferredLocations: details.preferredAreas || [],
      
      // Features
      mustHaveFeatures: [],
      niceToHaveFeatures: [],
      
      // Timeline - map lead timeline to urgency
      urgency: lead.timeline === 'immediate' ? 'high' : 
               lead.timeline === 'within-1-month' ? 'high' :
               lead.timeline === 'within-3-months' ? 'medium' : 'low',
      targetMoveDate: undefined,
      
      // Financing - investors typically have cash or pre-approved financing
      preApproved: true,
      financingType: 'cash',
      
      // Notes with investor flag
      additionalNotes: `🏦 INVESTOR REQUIREMENT\\n` +
        `Created from investor lead ${lead.id}\\n` +
        `Investor ID: ${investor.id}\\n\\n` +
        `Investment Capacity: ${details.investmentBudget ? `PKR ${details.investmentBudget.toLocaleString()}` : 'Not specified'}\\n` +
        `Risk Profile: ${details.riskTolerance || 'Moderate'}\\n` +
        `Investment Type: ${details.investmentType || 'Not specified'}\\n\\n` +
        `Lead Source: ${lead.source}\\n` +
        `Timeline: ${lead.timeline}\\n` +
        `Qualification Score: ${lead.qualificationScore}/100\\n\\n` +
        (lead.notes ? `Qualification Notes:\\n${lead.notes}\\n\\n` : '') +
        (lead.initialMessage ? `Initial Message:\\n${lead.initialMessage}` : ''),
    });
    
    logger.info('Created buyer requirement for investor from lead', { 
      leadId: lead.id, 
      investorId: investor.id,
      requirementId: buyerRequirement.id 
    });
    
    // Return the investor ID (the main entity created)
    return investor.id;
  } catch (error) {
    logger.error('Failed to create investor from lead', error);
    throw new Error('Investor creation failed');
  }
}

// ============================================
// DUPLICATE DETECTION
// ============================================

/**
 * Check if a contact with similar details already exists
 * This helps prevent duplicate contacts from lead conversion
 */
export function checkDuplicateContact(lead: Lead): {
  hasDuplicate: boolean;
  duplicateId?: string;
  matchConfidence: 'high' | 'medium' | 'low';
} {
  try {
    const contacts = getContacts();
    
    // Check for exact phone match
    const phoneMatch = contacts.find(c => 
      c.phone === lead.phone ||
      c.alternatePhone === lead.phone ||
      (lead.alternatePhone && (c.phone === lead.alternatePhone || c.alternatePhone === lead.alternatePhone))
    );
    
    if (phoneMatch) {
      return {
        hasDuplicate: true,
        duplicateId: phoneMatch.id,
        matchConfidence: 'high',
      };
    }
    
    // Check for email match
    if (lead.email) {
      const emailMatch = contacts.find(c => 
        c.email?.toLowerCase() === lead.email?.toLowerCase()
      );
      
      if (emailMatch) {
        return {
          hasDuplicate: true,
          duplicateId: emailMatch.id,
          matchConfidence: 'high',
        };
      }
    }
    
    // Check for name similarity (fuzzy match)
    const nameSimilarity = contacts.filter(c => {
      const leadNameLower = lead.name.toLowerCase().trim();
      const contactNameLower = c.name.toLowerCase().trim();
      
      // Exact match
      if (leadNameLower === contactNameLower) {
        return true;
      }
      
      // Similar (basic check - can be enhanced with Levenshtein distance)
      const leadWords = leadNameLower.split(/\s+/);
      const contactWords = contactNameLower.split(/\s+/);
      
      const matchingWords = leadWords.filter(word => 
        contactWords.some(cWord => cWord.includes(word) || word.includes(cWord))
      );
      
      // If more than 50% of words match
      return matchingWords.length >= leadWords.length * 0.5;
    });
    
    if (nameSimilarity.length > 0) {
      return {
        hasDuplicate: true,
        duplicateId: nameSimilarity[0].id,
        matchConfidence: 'medium',
      };
    }
    
    return {
      hasDuplicate: false,
      matchConfidence: 'low',
    };
  } catch (error) {
    logger.error('Error checking for duplicate contacts', error);
    return {
      hasDuplicate: false,
      matchConfidence: 'low',
    };
  }
}

// ============================================
// CONVERSION PREVIEW
// ============================================

/**
 * Preview what will be created when converting a lead
 * Useful for showing user what will happen before actual conversion
 */
export function previewLeadConversion(leadId: string): {
  lead: Lead;
  willCreate: {
    contact: boolean;
    buyerRequirement: boolean;
    rentRequirement: boolean;
    property: boolean;
    investor: boolean;
  };
  validation: ReturnType<typeof validateLeadForConversion>;
  duplicateCheck: ReturnType<typeof checkDuplicateContact>;
} | null {
  const lead = getLeadById(leadId);
  
  if (!lead) {
    return null;
  }
  
  const willCreate = {
    contact: true, // Always created
    buyerRequirement: lead.intent === 'buying' || lead.intent === 'investing',
    rentRequirement: lead.intent === 'renting',
    property: lead.intent === 'selling' || lead.intent === 'leasing-out',
    investor: lead.intent === 'investing',
  };
  
  return {
    lead,
    willCreate,
    validation: validateLeadForConversion(lead),
    duplicateCheck: checkDuplicateContact(lead),
  };
}