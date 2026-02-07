import { RequirementLeadTracking } from './leadsIntegration';
import { PropertyType, AreaUnit } from './properties';

/**
 * Requirement Types
 */

export interface BuyerRequirement extends Partial<RequirementLeadTracking> {
    id: string;
    contactId: string;
    agentId: string;
    agentName?: string;
    propertyType: PropertyType[];
    budgetMin?: number;
    budgetMax: number;
    preferredAreas?: string[];
    sizeMin?: number;
    sizeMax?: number;
    sizeUnit?: AreaUnit;
    minBedrooms?: number;
    maxBedrooms?: number;
    minBathrooms?: number;
    features?: string[];
    // Contact Info for matching/offer display
    buyerId: string;
    buyerName: string;
    buyerContact?: string;
    buyerEmail?: string;
    status: 'active' | 'fulfilled' | 'cancelled';
    createdAt: string;
    updatedAt: string;

    // V4.0 UI Fields (Optional)
    urgency?: 'high' | 'medium' | 'low' | 'normal';
    targetMoveDate?: string;
    financingType?: string;
    preApproved?: boolean;
    additionalNotes?: string;
    viewings?: any[];
}

export interface RentRequirement extends Partial<RequirementLeadTracking> {
    id: string;
    contactId: string;
    agentId: string;
    agentName?: string;
    propertyType: PropertyType[];
    budgetMin?: number;
    budgetMax: number;
    preferredAreas?: string[];
    minBedrooms?: number;
    maxBedrooms?: number;
    minBathrooms?: number;
    features?: string[];
    // Contact Info for matching/offer display
    renterId: string;
    renterName: string;
    renterContact?: string;
    renterEmail?: string;
    status: 'active' | 'matched' | 'viewing-scheduled' | 'converted' | 'fulfilled' | 'cancelled' | 'closed';
    createdAt: string;
    updatedAt: string;

    // V4.0 UI Fields (Optional)
    urgency?: 'high' | 'medium' | 'low' | 'normal';
    targetMoveDate?: string;
    additionalNotes?: string;
    viewings?: any[];
    matchedProperties?: string[]; // Property IDs that match this requirement
    rentedPropertyId?: string; // Property ID when requirement is fulfilled
    closedAt?: string; // Date when requirement was closed
}
