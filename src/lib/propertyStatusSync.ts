/**
 * Property Status Synchronization
 * 
 * Automatically updates property status based on cycle states.
 * This ensures property listings accurately reflect their current transaction status.
 */

import { Property } from '../types';
import { getSellCycleById, getSellCycles } from './sellCycle';
import { getPurchaseCycleById, getPurchaseCycles } from './purchaseCycle';
import { getRentCycleById, getRentCycles } from './rentCycle';
import { getPropertyById, updateProperty, getProperties } from './data';
import { triggerAutomation } from './tasks';

/**
 * Determine the correct property status based on all active cycles
 * 
 * Priority order:
 * 1. sold (if any sell cycle is sold)
 * 2. under_contract (if any cycle is under contract)
 * 3. leased (if any rent cycle is leased/active)
 * 4. for_rent (if any rent cycle is listed/active marketing)
 * 5. for_sale (if any sell cycle is listed/active marketing)
 * 6. available (default)
 */
export function determinePropertyStatus(propertyId: string): Property['status'] {
  const sellCycles = getSellCycles().filter(c => c.propertyId === propertyId);
  const purchaseCycles = getPurchaseCycles().filter(c => c.propertyId === propertyId);
  const rentCycles = getRentCycles().filter(c => c.propertyId === propertyId);

  // Priority 1: Check if property is SOLD
  const soldSellCycle = sellCycles.find(c => c.status === 'sold');
  if (soldSellCycle) {
    return 'sold';
  }

  // Priority 2: Check if property is UNDER CONTRACT (any cycle type)
  // PropertyStatus type: 'available' | 'sold' | 'rented' | 'under-offer'
  const underContractSellCycle = sellCycles.find(c => c.status === 'under-contract');
  const underContractPurchaseCycle = purchaseCycles.find(c => c.status === 'under-contract');
  if (underContractSellCycle || underContractPurchaseCycle) {
    return 'under-offer'; // Use 'under-offer' which is valid PropertyStatus
  }

  // Priority 3: Check if property is LEASED
  const leasedRentCycle = rentCycles.find(c => 
    c.status === 'leased' || c.status === 'active-lease'
  );
  if (leasedRentCycle) {
    return 'rented'; // Use 'rented' which is valid PropertyStatus
  }

  // Priority 4: Check if property is FOR RENT (active rent marketing)
  const activeRentCycle = rentCycles.find(c => 
    c.status === 'listed' || 
    c.status === 'showing' || 
    c.status === 'application-received' ||
    c.status === 'negotiation'
  );
  if (activeRentCycle) {
    return 'available'; // Use 'available' for active marketing
  }

  // Priority 5: Check if property is FOR SALE (active sell marketing)
  const activeSellCycle = sellCycles.find(c => 
    c.status === 'listed' || 
    c.status === 'active-marketing' || 
    c.status === 'offer-received' ||
    c.status === 'negotiation'
  );
  if (activeSellCycle) {
    return 'available'; // Use 'available' for active marketing
  }

  // Priority 6: Check if property was acquired through purchase cycle
  const acquiredPurchaseCycle = purchaseCycles.find(c => c.status === 'acquired');
  if (acquiredPurchaseCycle) {
    // Property was acquired but no active sell/rent cycles
    return 'available';
  }

  // Default: Available
  return 'available';
}

/**
 * Sync property status after a sell cycle status change
 */
export function syncPropertyStatusFromSellCycle(sellCycleId: string): void {
  const sellCycle = getSellCycleById(sellCycleId);
  if (!sellCycle) {
    console.warn('Sell cycle not found:', sellCycleId);
    return;
  }

  const property = getPropertyById(sellCycle.propertyId);
  if (!property) {
    console.warn('Property not found:', sellCycle.propertyId);
    return;
  }

  const newStatus = determinePropertyStatus(sellCycle.propertyId);
  
  // Only update if status actually changed
  // Use property.status (not currentStatus) as that's the correct field name
  const currentStatus = property.status || (property as any).currentStatus || 'available';
  if (currentStatus !== newStatus) {
    console.log(`Syncing property ${property.id} status: ${currentStatus} → ${newStatus}`);
    updateProperty(property.id, { status: newStatus });
    
    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('propertyStatusChanged', {
        detail: {
          propertyId: property.id,
          oldStatus: currentStatus,
          newStatus: newStatus,
          triggeredBy: 'sell-cycle',
          cycleId: sellCycleId
        }
      }));
    }
    
    // Trigger task automation based on new status
    try {
      const createdTasks = triggerAutomation(
        {
          type: 'entity-status-changed',
          entityType: 'property',
          statusChange: {
            from: currentStatus,
            to: newStatus,
          },
        },
        {
          ...property,
          status: newStatus,
          name: property.title,
          agentId: sellCycle.agentId,
        },
        { id: sellCycle.agentId, name: sellCycle.agentName, role: 'agent' }
      );
      
      if (createdTasks.length > 0) {
        console.log(`📋 Created ${createdTasks.length} automated task(s) for property status change: ${currentStatus} → ${newStatus}`);
      }
    } catch (error) {
      console.error('Error triggering property automation:', error);
    }
  }
}

/**
 * Sync property status after a purchase cycle status change
 */
export function syncPropertyStatusFromPurchaseCycle(purchaseCycleId: string): void {
  const purchaseCycle = getPurchaseCycleById(purchaseCycleId);
  if (!purchaseCycle) {
    console.warn('Purchase cycle not found:', purchaseCycleId);
    return;
  }

  const property = getPropertyById(purchaseCycle.propertyId);
  if (!property) {
    console.warn('Property not found:', purchaseCycle.propertyId);
    return;
  }

  const newStatus = determinePropertyStatus(purchaseCycle.propertyId);
  
  // Only update if status actually changed
  // Use property.status (not currentStatus) as that's the correct field name
  const currentStatus = property.status || (property as any).currentStatus || 'available';
  if (currentStatus !== newStatus) {
    console.log(`Syncing property ${property.id} status: ${currentStatus} → ${newStatus}`);
    updateProperty(property.id, { status: newStatus });
    
    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('propertyStatusChanged', {
        detail: {
          propertyId: property.id,
          oldStatus: currentStatus,
          newStatus: newStatus,
          triggeredBy: 'purchase-cycle',
          cycleId: purchaseCycleId
        }
      }));
    }

    // Trigger task automation based on new status
    try {
      const createdTasks = triggerAutomation(
        {
          type: 'entity-status-changed',
          entityType: 'property',
          statusChange: {
            from: currentStatus,
            to: newStatus,
          },
        },
        {
          ...property,
          status: newStatus,
          name: property.title,
          agentId: purchaseCycle.agentId,
        },
        { id: purchaseCycle.agentId, name: purchaseCycle.agentName, role: 'agent' }
      );
      
      if (createdTasks.length > 0) {
        console.log(`📋 Created ${createdTasks.length} automated task(s) for property status change: ${currentStatus} → ${newStatus}`);
      }
    } catch (error) {
      console.error('Error triggering property automation:', error);
    }
  }
}

/**
 * Sync property status after a rent cycle status change
 */
export function syncPropertyStatusFromRentCycle(rentCycleId: string): void {
  const rentCycle = getRentCycleById(rentCycleId);
  if (!rentCycle) {
    console.warn('Rent cycle not found:', rentCycleId);
    return;
  }

  const property = getPropertyById(rentCycle.propertyId);
  if (!property) {
    console.warn('Property not found:', rentCycle.propertyId);
    return;
  }

  const newStatus = determinePropertyStatus(rentCycle.propertyId);
  
  // Only update if status actually changed
  // Use property.status (not currentStatus) as that's the correct field name
  const currentStatus = property.status || (property as any).currentStatus || 'available';
  if (currentStatus !== newStatus) {
    console.log(`Syncing property ${property.id} status: ${currentStatus} → ${newStatus}`);
    updateProperty(property.id, { status: newStatus });
    
    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('propertyStatusChanged', {
        detail: {
          propertyId: property.id,
          oldStatus: currentStatus,
          newStatus: newStatus,
          triggeredBy: 'rent-cycle',
          cycleId: rentCycleId
        }
      }));
    }

    // Trigger automation based on new status
    triggerAutomation(property.id, newStatus);
  }
}

/**
 * Force sync property status (useful for manual corrections or batch updates)
 */
export function forcePropertyStatusSync(propertyId: string): void {
  const property = getPropertyById(propertyId);
  if (!property) {
    console.warn('Property not found:', propertyId);
    return;
  }

  const newStatus = determinePropertyStatus(propertyId);
  
  if (property.status !== newStatus) {
    console.log(`Force syncing property ${property.id} status: ${property.status} → ${newStatus}`);
    updateProperty(property.id, { status: newStatus });
    
    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('propertyStatusChanged', {
        detail: {
          propertyId: property.id,
          oldStatus: property.status,
          newStatus: newStatus,
          triggeredBy: 'manual-sync'
        }
      }));
    }

    // Trigger automation based on new status
    triggerAutomation(property.id, newStatus);
  }
}

/**
 * Batch sync all property statuses (useful for data migrations or fixes)
 */
export function batchSyncAllPropertyStatuses(): void {
  const properties = getProperties();
  
  let syncedCount = 0;
  let changedCount = 0;
  
  properties.forEach((property: Property) => {
    const oldStatus = property.status;
    const newStatus = determinePropertyStatus(property.id);
    
    if (oldStatus !== newStatus) {
      updateProperty(property.id, { status: newStatus });
      changedCount++;
      console.log(`Batch sync: Property ${property.id} ${oldStatus} → ${newStatus}`);
    }
    syncedCount++;
  });
  
  console.log(`Batch sync complete: ${syncedCount} properties checked, ${changedCount} updated`);
  
  // Dispatch batch complete event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('propertyStatusBatchSyncComplete', {
      detail: {
        totalProperties: syncedCount,
        changedProperties: changedCount
      }
    }));
  }
}

/**
 * Get human-readable explanation of why a property has a certain status
 */
export function getPropertyStatusReason(propertyId: string): string {
  const sellCycles = getSellCycles().filter(c => c.propertyId === propertyId);
  const purchaseCycles = getPurchaseCycles().filter(c => c.propertyId === propertyId);
  const rentCycles = getRentCycles().filter(c => c.propertyId === propertyId);

  // Check sold
  const soldCycle = sellCycles.find(c => c.status === 'sold');
  if (soldCycle) {
    return `Property was sold through Sell Cycle on ${soldCycle.soldDate || 'unknown date'}`;
  }

  // Check under contract
  const underContractSell = sellCycles.find(c => c.status === 'under-contract');
  if (underContractSell) {
    return 'Property is under contract for sale';
  }
  const underContractPurchase = purchaseCycles.find(c => c.status === 'under-contract');
  if (underContractPurchase) {
    return 'Property is under contract for purchase';
  }

  // Check leased
  const leasedCycle = rentCycles.find(c => c.status === 'leased' || c.status === 'active-lease');
  if (leasedCycle) {
    return 'Property is currently leased to a tenant';
  }

  // Check for rent
  const rentCycle = rentCycles.find(c => 
    ['listed', 'showing', 'application-received', 'negotiation'].includes(c.status)
  );
  if (rentCycle) {
    return `Property is actively marketed for rent (${rentCycle.status})`;
  }

  // Check for sale
  const sellCycle = sellCycles.find(c => 
    ['listed', 'active-marketing', 'offer-received', 'negotiation'].includes(c.status)
  );
  if (sellCycle) {
    return `Property is actively marketed for sale (${sellCycle.status})`;
  }

  // Check acquired
  const acquiredCycle = purchaseCycles.find(c => c.status === 'acquired');
  if (acquiredCycle) {
    return 'Property was acquired but is not currently listed';
  }

  return 'Property is available (no active cycles)';
}