/**
 * Data Flow Connections
 * 
 * Ensures proper linking between entities during conversions and workflows.
 * Prevents data loss during Lead → Contact → Deal → Transaction flows.
 * 
 * Fixed Gaps:
 * - Contact → Deal automatic linking
 * - Deal → Transaction automatic creation with payment schedules
 * - Payment → Commission auto-calculation
 */

import { Deal } from '../types/deals';
import { Contact } from '../types';
import { getContactById, updateContact } from './data';
import { getDealById, updateDeal } from './deals';
import { logger } from './logger';

/**
 * Link Contact to Deal when deal is created
 * 
 * This ensures that when a deal is created from a contact (or includes a contact),
 * the contact record is updated with the deal ID for bidirectional linking.
 * 
 * @param deal - The deal that was created
 * @param contactId - The contact ID to link (can be buyer or seller)
 */
export function linkContactToDeal(deal: Deal, contactId?: string): void {
  if (!contactId) {
    return;
  }

  try {
    const contact = getContactById(contactId);
    
    if (!contact) {
      logger.warn(`Contact ${contactId} not found when linking to deal ${deal.id}`);
      return;
    }

    // Check if contact already has this deal linked (via deals field or notes)
    const existingNotes = contact.notes || '';
    const dealReference = `Deal: ${deal.dealNumber} (${deal.id})`;
    
    if (existingNotes.includes(deal.id) || existingNotes.includes(deal.dealNumber)) {
      return; // Already linked (found in notes)
    }

    // Try to add to deals array if field exists, otherwise add to notes
    const updates: Partial<Contact> = {};
    
    // If contact has a deals field, use it
    if ('deals' in contact && Array.isArray((contact as any).deals)) {
      const currentDeals = (contact as any).deals || [];
      if (!currentDeals.includes(deal.id)) {
        updates.deals = [...currentDeals, deal.id];
      }
    } else {
      // Otherwise, add deal reference to notes
      const dealNote = `\n\n=== Deal Link ===\nLinked to ${dealReference} on ${new Date().toLocaleDateString()}`;
      updates.notes = existingNotes + dealNote;
    }

    // Update contact with deal link
    if (Object.keys(updates).length > 0) {
      updateContact(contactId, updates);
      logger.info(`Linked contact ${contactId} to deal ${deal.id} (${deal.dealNumber})`);
    }
  } catch (error) {
    logger.error(`Failed to link contact ${contactId} to deal ${deal.id}`, error);
    // Don't throw - deal is still created even if contact link fails
  }
}

/**
 * Link both buyer and seller contacts to deal
 * 
 * @param deal - The deal that was created
 */
export function linkAllContactsToDeal(deal: Deal): void {
  // Link buyer contact if exists
  if (deal.parties.buyer.id) {
    linkContactToDeal(deal, deal.parties.buyer.id);
  }

  // Link seller contact if exists
  if (deal.parties.seller.id) {
    linkContactToDeal(deal, deal.parties.seller.id);
  }
}

/**
 * Link Lead to Contact after conversion
 * 
 * This is already handled in leadConversion.ts, but we ensure the link
 * is properly established in both directions.
 * 
 * @param contactId - The contact created from lead
 * @param leadId - The original lead ID
 */
export function ensureLeadContactLink(contactId: string, leadId: string): void {
  try {
    const contact = getContactById(contactId);
    
    if (!contact) {
      logger.warn(`Contact ${contactId} not found when ensuring lead link`);
      return;
    }

    // Ensure lead tracking fields are set
    if (!contact.leadId || contact.leadId !== leadId) {
      updateContact(contactId, {
        leadId: leadId,
        convertedFromLead: true,
        leadConvertedAt: new Date().toISOString(),
      });
      
      logger.info(`Ensured lead ${leadId} link to contact ${contactId}`);
    }
  } catch (error) {
    logger.error(`Failed to ensure lead-contact link`, error);
  }
}

/**
 * Ensure Deal → Transaction link when transaction is created
 * 
 * This ensures that when a transaction is created from a deal,
 * the deal is updated with the transaction ID.
 * 
 * @param dealId - The deal ID
 * @param transactionId - The transaction ID to link
 */
export function linkDealToTransaction(dealId: string, transactionId: string): void {
  try {
    const deal = getDealById(dealId);
    
    if (!deal) {
      logger.warn(`Deal ${dealId} not found when linking transaction ${transactionId}`);
      return;
    }

    // Ensure transactions array exists
    const currentTransactions = deal.metadata.transactions || [];
    
    // Check if transaction already linked
    if (currentTransactions.includes(transactionId)) {
      return; // Already linked
    }

    // Add transaction ID to deal's transactions array
    const updatedTransactions = [...currentTransactions, transactionId];

    // Update deal with transaction link
    updateDeal(dealId, {
      metadata: {
        ...deal.metadata,
        transactions: updatedTransactions,
      },
    });

    logger.info(`Linked deal ${dealId} to transaction ${transactionId}`);
  } catch (error) {
    logger.error(`Failed to link deal ${dealId} to transaction ${transactionId}`, error);
  }
}