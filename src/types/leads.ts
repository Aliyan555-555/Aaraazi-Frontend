/**
 * Lead Management Types
 *
 * Redesigned Lead System - First Contact & Qualification Only
 * Lead lifecycle: < 72 hours (new → qualifying → qualified → converted → archived)
 *
 * After qualification, leads are:
 * - Converted to Contact (always)
 * - + Buyer Requirement (if buying)
 * - + Rent Requirement (if renting as tenant)
 * - + Property Listing (if selling or renting out)
 * - + Investor Requirement (if investing)
 * - Then archived (kept for reporting only)
 */

// ============================================
// LEAD INTENT & TIMELINE
// ============================================

/**
 * What the lead wants to do
 */
export type LeadIntent =
  | "buying" // Looking to buy a property
  | "selling" // Wants to sell their property
  | "renting" // Looking to rent (tenant)
  | "leasing-out" // Wants to rent out their property (landlord)
  | "investing" // Investment inquiry
  | "unknown"; // Not yet determined

/**
 * When the lead wants to act
 */
export type LeadTimeline =
  | "immediate" // Within 1 week
  | "within-1-month" // 1-4 weeks
  | "within-3-months" // 1-3 months
  | "within-6-months" // 3-6 months
  | "long-term" // 6+ months, just exploring
  | "unknown"; // Not yet determined

// ============================================
// LEAD STATUS & SOURCE
// ============================================

/**
 * Lead status in the qualification lifecycle
 */
export type LeadStatus =
  | "new" // Just received, not yet contacted
  | "qualifying" // Agent is gathering qualification information
  | "qualified" // Qualification complete, ready to route
  | "converted" // Routed to appropriate module, now archived
  | "lost" // Not interested or unqualified
  | "archived"; // Historical record (converted or lost)

/**
 * Where the lead came from
 */
export type LeadSource =
  | "website" // Website form
  | "phone-call" // Direct phone call
  | "walk-in" // Walk-in to office
  | "referral" // Referred by existing client
  | "social-media" // Facebook, Instagram, etc.
  | "whatsapp" // WhatsApp inquiry
  | "email" // Email inquiry
  | "property-sign" // Saw property sign/board
  | "olx" // OLX listing
  | "zameen" // Zameen.com listing
  | "coldcall" // Cold call outreach
  | "event" // Real estate event
  | "other"; // Other source

// ============================================
// LEAD PRIORITY
// ============================================

/**
 * Lead priority based on qualification score
 */
export type LeadPriority = "high" | "medium" | "low";

// ============================================
// LEAD LOSS REASON
// ============================================

/**
 * Why a lead was marked as lost
 */
export type LeadLossReason =
  | "no-budget" // Can't afford
  | "not-ready" // Timeline too far out
  | "no-response" // Can't reach them
  | "found-elsewhere" // Bought/rented elsewhere
  | "not-interested" // Changed mind
  | "duplicate" // Duplicate lead
  | "spam" // Spam/fake inquiry
  | "other"; // Other reason

// ============================================
// LEAD INTERACTION
// ============================================

/**
 * Interaction type
 */
export type LeadInteractionType =
  | "call" // Phone call
  | "email" // Email
  | "whatsapp" // WhatsApp message
  | "meeting" // In-person meeting
  | "sms" // SMS
  | "note"; // Internal note

/**
 * Interaction direction
 */
export type LeadInteractionDirection = "inbound" | "outbound";

/**
 * Single interaction with a lead
 */
export interface LeadInteraction {
  id: string;
  type: LeadInteractionType;
  direction: LeadInteractionDirection;
  summary: string;
  notes?: string;
  timestamp: string; // ISO timestamp
  agentId: string;
  agentName: string;
  durationMinutes?: number; // For calls/meetings
}

// ============================================
// LEAD SLA TRACKING
// ============================================

/**
 * SLA (Service Level Agreement) tracking
 * Tracks key timestamps to measure agent response time
 */
export interface LeadSLA {
  createdAt: string; // When lead was created
  firstContactAt?: string; // When agent first contacted (< 2h target)
  qualifiedAt?: string; // When qualification completed (< 24h target)
  convertedAt?: string; // When converted to Contact (< 48h target)
  slaCompliant: boolean; // Overall SLA compliance
  overdueBy?: number; // Hours overdue (if any)
}

// ============================================
// LEAD QUALIFICATION SCORE
// ============================================

/**
 * Breakdown of qualification score factors
 */
export interface LeadScoreBreakdown {
  contactQuality: number; // /20 - Phone verified, email valid
  intentClarity: number; // /20 - Clear intent identified
  budgetRealism: number; // /20 - Budget aligns with market
  timelineUrgency: number; // /20 - Timeline is realistic
  sourceQuality: number; // /20 - Quality of lead source
}

// ============================================
// LEAD ROUTING
// ============================================

/**
 * Where the lead was routed after qualification
 */
export interface LeadRouting {
  contactId: string; // Always created
  buyerRequirementId?: string; // If intent = buying
  rentRequirementId?: string; // If intent = renting
  propertyId?: string; // If intent = selling or leasing-out
  investorId?: string; // If intent = investing
  convertedAt: string; // When conversion happened
  convertedBy: string; // Agent ID who converted
}

// ============================================
// LEAD DETAILS (Intent-specific)
// ============================================

/**
 * Additional details captured during qualification
 * Fields vary based on intent
 */
export interface LeadDetails {
  // FOR BUYERS
  budgetMin?: number; // PKR
  budgetMax?: number; // PKR
  preferredAreas?: string[]; // Max 3 areas
  propertyTypes?: string[]; // 'house', 'apartment', etc.
  bedrooms?: number;
  bathrooms?: number;
  mustHaveFeatures?: string[]; // Parking, elevator, etc.

  // FOR SELLERS
  propertyAddress?: string; // Their property
  propertyType?: string;
  expectedPrice?: number; // PKR
  propertyArea?: number;
  propertyAreaUnit?: "sqft" | "sqyards" | "marla" | "kanal";
  reasonForSelling?: string;

  // FOR RENTERS (tenant)
  monthlyBudget?: number; // PKR per month
  leaseDuration?: string; // '1-year', '2-years', etc.
  moveInDate?: string; // Desired move-in date

  // FOR LANDLORDS
  rentalPropertyAddress?: string;
  expectedRent?: number; // PKR per month
  availableFrom?: string; // When property is available

  // FOR INVESTORS
  investmentBudget?: number; // PKR
  investmentType?: string; // 'flip', 'rental-income', 'long-term'
  riskTolerance?: "low" | "medium" | "high";
}

// ============================================
// MAIN LEAD INTERFACE
// ============================================

/**
 * Lead Entity - First Contact & Qualification
 *
 * Purpose: Temporary record for initial inquiry qualification
 * Lifecycle: < 72 hours (new → qualifying → qualified → converted → archived)
 *
 * After qualification, lead is:
 * - Converted to Contact (for all leads)
 * - + Buyer Requirement (if buying)
 * - + Rent Requirement (if renting)
 * - + Property Listing (if selling)
 * - + Investor Requirement (if investing)
 * - Then archived (kept for reporting only)
 */
export interface Lead {
  // ==================== CORE IDENTITY ====================
  id: string; // lead_[timestamp]_[random]
  workspaceId: string; // Multi-tenant support

  // ==================== CONTACT INFORMATION ====================
  // Temporary storage - copied to Contact on conversion
  name: string; // Full name
  phone: string; // Primary phone (required)
  email?: string; // Email (optional but recommended)
  alternatePhone?: string; // Secondary contact

  phoneVerified: boolean; // Phone number is valid
  emailVerified: boolean; // Email is valid

  // ==================== QUALIFICATION DATA ====================
  // Key questions to route the lead
  intent: LeadIntent; // What they want to do
  timeline: LeadTimeline; // When they want to do it

  // Intent-specific details
  details?: LeadDetails;

  // ==================== SOURCE & ATTRIBUTION ====================
  source: LeadSource; // Primary source
  sourceDetails?: string; // Additional context
  campaign?: string; // Marketing campaign
  referredBy?: string; // Referrer name (if referral)
  initialMessage?: string; // First inquiry text

  // ==================== QUALIFICATION SCORE ====================
  // Automatic scoring for prioritization
  qualificationScore: number; // 0-100
  scoreBreakdown: LeadScoreBreakdown;
  priority: LeadPriority; // high/medium/low

  // ==================== STATUS & LIFECYCLE ====================
  status: LeadStatus;
  lossReason?: LeadLossReason; // If status = 'lost'
  lossNotes?: string; // Additional context for loss

  // ==================== ROUTING ====================
  routedTo?: LeadRouting; // Where lead was routed (if converted)

  // ==================== INTERACTIONS ====================
  interactions: LeadInteraction[]; // All interactions with this lead
  notes: string; // General qualification notes

  // ==================== SLA TRACKING ====================
  sla: LeadSLA;

  // ==================== ASSIGNMENT ====================
  agentId: string; // Assigned agent
  agentName: string; // Agent full name

  // ==================== METADATA ====================
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  createdBy: string; // User ID who created
  version: number; // Data model version (2 for new system)
}

// ============================================
// LEGACY LEAD INTERFACE (for migration reference)
// ============================================

/**
 * Old Lead structure ()
 * Keep for reference during migration
 * DO NOT USE - use Lead interface above
 */
export interface LegacyLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  notes: string;
  status: "new" | "contacted" | "interested" | "converted" | "lost";
  propertyId?: string;
  interestedProperties?: string[]; // Deprecated - use Requirements
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Dashboard TYPES
// ============================================

/**
 * Lead type formatted for Dashboard
 */
export interface DashboardLead {
  id: string;
  contactId: string;
  agentId: string;
  stage:
    | "new"
    | "contacted"
    | "qualified"
    | "negotiation"
    | "proposal"
    | "closed-won"
    | "closed-lost"
    | "disqualified";
  priority: string;
  propertyId?: string;
  source: string;
  intent: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredLocations: string[];
  propertyType?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityDate?: string;
  conversionStatus: "converted" | "lost" | "pending";
  convertedToContactId?: string;
  tags: string[];
  notes: string;
}
