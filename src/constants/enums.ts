/**
 * Database Enum Constants
 * Professional-grade constants that mirror backend Prisma schema enums
 * Use these instead of string literals for type safety and consistency
 */

/**
 * Cycle Status Enum
 * Represents the status of sell, purchase, and rent cycles
 */
export const CYCLE_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
  AVAILABLE: 'AVAILABLE',
  SHOWING: 'SHOWING',
  APPLICATION_RECEIVED: 'APPLICATION_RECEIVED',
  LEASED: 'LEASED',
  RENEWAL_PENDING: 'RENEWAL_PENDING',
  ENDING: 'ENDING',
  ENDED: 'ENDED',
  LISTED: 'LISTED',
  OFFER_RECEIVED: 'OFFER_RECEIVED',
  NEGOTIATION: 'NEGOTIATION',
  UNDER_CONTRACT: 'UNDER_CONTRACT',
  SOLD: 'SOLD',
} as const;

/**
 * Deal Offer Status Enum (for frontend use - lowercase)
 * Represents the status of offers made on properties
 */
export const OFFER_STATUS = {
  DRAFTED: 'drafted',
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  COUNTERED: 'countered',
  EXPIRED: 'expired',
} as const;

/**
 * Deal Offer Status Enum (backend format - uppercase)
 * Use for API communication
 */
export const DEAL_OFFER_STATUS = {
  DRAFTED: 'DRAFTED',
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  COUNTERED: 'COUNTERED',
  EXPIRED: 'EXPIRED',
} as const;

/**
 * Deal Status Enum
 * Represents the status of deals
 */
export const DEAL_STATUS = {
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

/**
 * Deal Stage Enum
 * Represents the stage of a deal in the transaction process
 */
export const DEAL_STAGE = {
  NEGOTIATION: 'NEGOTIATION',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  AGREEMENT_SIGNING: 'AGREEMENT_SIGNING',
  DOCUMENTATION: 'DOCUMENTATION',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAYMENT: 'PAYMENT',
  HANDOVER_PREP: 'HANDOVER_PREP',
  TRANSFER_REGISTRATION: 'TRANSFER_REGISTRATION',
  TRANSFER: 'TRANSFER',
  FINAL_HANDOVER: 'FINAL_HANDOVER',
  COMPLETED: 'COMPLETED',
} as const;

/**
 * Property Listing Status Enum
 * Represents the status of property listings
 */
export const PROPERTY_LISTING_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  UNDER_OFFER: 'UNDER_OFFER',
  SOLD: 'SOLD',
  RENTED: 'RENTED',
  WITHDRAWN: 'WITHDRAWN',
  EXPIRED: 'EXPIRED',
  ARCHIVED: 'ARCHIVED',
} as const;

/**
 * Sell Cycle Status (frontend format - lowercase)
 * Maps to CycleStatus but uses lowercase for frontend
 */
export const SELL_CYCLE_STATUS = {
  LISTED: 'listed',
  OFFER_RECEIVED: 'offer-received',
  NEGOTIATION: 'negotiation',
  UNDER_CONTRACT: 'under-contract',
  SOLD: 'sold',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on-hold',
  PENDING: 'pending',
} as const;

/**
 * Contact Type Enum
 */
export const CONTACT_TYPE = {
  CLIENT: 'CLIENT',
  AGENT: 'AGENT',
  BROKER: 'BROKER',
  DEVELOPER: 'DEVELOPER',
  VENDOR: 'VENDOR',
  OTHER: 'OTHER',
} as const;

/**
 * Contact Category Enum
 */
export const CONTACT_CATEGORY = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  TENANT: 'TENANT',
  LANDLORD: 'LANDLORD',
  INVESTOR: 'INVESTOR',
  OTHER: 'OTHER',
} as const;

/**
 * Contact Status Enum
 */
export const CONTACT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLACKLISTED: 'BLACKLISTED',
} as const;

// Type exports for TypeScript type checking
export type CycleStatus = (typeof CYCLE_STATUS)[keyof typeof CYCLE_STATUS];
export type OfferStatus = (typeof OFFER_STATUS)[keyof typeof OFFER_STATUS];
export type DealOfferStatus = (typeof DEAL_OFFER_STATUS)[keyof typeof DEAL_OFFER_STATUS];
export type DealStatus = (typeof DEAL_STATUS)[keyof typeof DEAL_STATUS];
export type DealStage = (typeof DEAL_STAGE)[keyof typeof DEAL_STAGE];
export type PropertyListingStatus = (typeof PROPERTY_LISTING_STATUS)[keyof typeof PROPERTY_LISTING_STATUS];
export type SellCycleStatus = (typeof SELL_CYCLE_STATUS)[keyof typeof SELL_CYCLE_STATUS];
export type ContactType = (typeof CONTACT_TYPE)[keyof typeof CONTACT_TYPE];
export type ContactCategory = (typeof CONTACT_CATEGORY)[keyof typeof CONTACT_CATEGORY];
export type ContactStatus = (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS];
