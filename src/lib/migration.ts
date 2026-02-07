/**
 * Data Migration Utilities - V3.0
 * Safely migrate from V2.0 to V3.0 data structure
 */

import { Property, PropertyV2, SellCycle, PurchaseCycle, RentCycle } from '../types';

const BACKUP_KEY = 'estatemanager_backup_v2';
const MIGRATION_STATUS_KEY = 'migration_status_v3';

export interface MigrationStatus {
  isComplete: boolean;
  timestamp?: string;
  backupCreated?: boolean;
  propertiesMigrated?: number;
  errors?: string[];
}

/**
 * Step 1: Backup existing data
 */
export function backupExistingData(): boolean {
  try {
    const backup: any = {};
    
    // Backup all localStorage data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('estate')) {
        backup[key] = localStorage.getItem(key);
      }
    }

    // Save backup
    localStorage.setItem(BACKUP_KEY, JSON.stringify({
      timestamp: new Date().toISOString(),
      data: backup,
    }));

    console.log('✅ Backup created successfully');
    return true;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return false;
  }
}

/**
 * Step 2: Restore from backup if needed
 */
export function restoreFromBackup(): boolean {
  try {
    const backupStr = localStorage.getItem(BACKUP_KEY);
    if (!backupStr) {
      console.error('No backup found');
      return false;
    }

    const backup = JSON.parse(backupStr);
    
    // Restore all data
    Object.keys(backup.data).forEach(key => {
      localStorage.setItem(key, backup.data[key]);
    });

    console.log('✅ Restored from backup:', backup.timestamp);
    return true;
  } catch (error) {
    console.error('❌ Restore failed:', error);
    return false;
  }
}

/**
 * Step 3: Check migration status
 */
export function getMigrationStatus(): MigrationStatus {
  try {
    const statusStr = localStorage.getItem(MIGRATION_STATUS_KEY);
    if (!statusStr) {
      return { isComplete: false };
    }
    return JSON.parse(statusStr);
  } catch (error) {
    return { isComplete: false };
  }
}

/**
 * Step 4: Save migration status
 */
function saveMigrationStatus(status: MigrationStatus): void {
  localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(status));
}

/**
 * Step 5: Migrate a single property from V2 to V3
 */
export function migratePropertyV2toV3(oldProperty: PropertyV2): Property {
  const newProperty: Property = {
    id: oldProperty.id,
    agentId: oldProperty.agentId,
    agentName: oldProperty.agentName,
    
    // Owner information
    currentOwnerId: oldProperty.ownerId || '',
    currentOwnerName: oldProperty.ownerName || 'Unknown',
    ownershipHistory: [],
    
    // Physical details (preserved)
    address: oldProperty.address,
    propertyType: oldProperty.propertyType,
    bedrooms: oldProperty.bedrooms,
    bathrooms: oldProperty.bathrooms,
    area: oldProperty.area,
    features: oldProperty.features || [],
    description: oldProperty.description,
    images: oldProperty.images || [],
    
    // Cycle tracking (NEW in V3)
    activeSellCycleIds: [],
    activePurchaseCycleIds: [],
    activeRentCycleIds: [],
    
    cycleHistory: {
      sellCycles: [],
      purchaseCycles: [],
      rentCycles: [],
    },
    
    // Internal listing flag
    isInternalListing: false,
    
    // Metadata
    createdAt: oldProperty.createdAt,
    updatedAt: new Date().toISOString(),
    lastModifiedBy: oldProperty.agentId,
  };

  // If property had ownership history in V2, preserve it
  if ((oldProperty as any).ownershipHistory) {
    newProperty.ownershipHistory = (oldProperty as any).ownershipHistory;
  }

  return newProperty;
}

/**
 * Step 6: Convert V2 listing to appropriate cycle
 */
export function convertListingToCycle(oldProperty: PropertyV2): {
  sellCycle?: SellCycle;
  rentCycle?: RentCycle;
} {
  const result: any = {};

  // If property was for-sale, create sell cycle
  if (oldProperty.listingType === 'for-sale' && oldProperty.price) {
    result.sellCycle = {
      id: `sell_${oldProperty.id}_migrated_${Date.now()}`,
      propertyId: oldProperty.id,
      propertyAddress: oldProperty.address,
      
      agentId: oldProperty.agentId,
      agentName: oldProperty.agentName,
      
      // Seller info (assume owner is seller)
      sellerId: oldProperty.ownerId || oldProperty.agentId,
      sellerName: oldProperty.ownerName || 'Unknown',
      sellerType: 'owner',
      sellerContact: '',
      
      // Pricing from V2
      askingPrice: oldProperty.price,
      minAcceptablePrice: oldProperty.price * 0.9, // Assume 10% negotiation room
      
      // Commission (assume 2% default)
      commissionType: 'percentage',
      commissionRate: 2,
      
      // Status
      status: oldProperty.status === 'sold' ? 'sold' : 'active',
      
      // Offers
      offers: [],
      
      // Timestamps
      createdAt: oldProperty.createdAt,
      updatedAt: new Date().toISOString(),
    };
  }

  // If property was for-rent, create rent cycle
  if (oldProperty.listingType === 'for-rent' && oldProperty.price) {
    result.rentCycle = {
      id: `rent_${oldProperty.id}_migrated_${Date.now()}`,
      propertyId: oldProperty.id,
      propertyAddress: oldProperty.address,
      
      agentId: oldProperty.agentId,
      agentName: oldProperty.agentName,
      
      // Landlord info (assume owner is landlord)
      landlordId: oldProperty.ownerId || oldProperty.agentId,
      landlordName: oldProperty.ownerName || 'Unknown',
      landlordType: 'owner',
      landlordContact: '',
      
      // Rent details from V2
      monthlyRent: oldProperty.price,
      securityDeposit: oldProperty.price * 2, // Assume 2 months deposit
      advanceRent: oldProperty.price, // Assume 1 month advance
      
      // Lease terms (defaults)
      leaseDuration: 12,
      minLeaseDuration: 12,
      availableFrom: oldProperty.createdAt,
      
      // Features
      petsAllowed: false,
      furnishingStatus: 'unfurnished',
      
      // Commission (assume 1 month default)
      commissionType: 'fixed',
      commissionRate: oldProperty.price,
      
      // Status
      status: oldProperty.status === 'rented' ? 'leased' : 'available',
      
      // Applications and leases
      applications: [],
      currentLease: null,
      leaseHistory: [],
      
      // Timestamps
      createdAt: oldProperty.createdAt,
      updatedAt: new Date().toISOString(),
    };
  }

  return result;
}

/**
 * Step 7: Main migration function
 */
export function migrateAllData(): MigrationStatus {
  const status: MigrationStatus = {
    isComplete: false,
    timestamp: new Date().toISOString(),
    backupCreated: false,
    propertiesMigrated: 0,
    errors: [],
  };

  try {
    // Step 1: Create backup
    console.log('📦 Creating backup...');
    status.backupCreated = backupExistingData();
    
    if (!status.backupCreated) {
      status.errors!.push('Failed to create backup');
      saveMigrationStatus(status);
      return status;
    }

    // Step 2: Load V2 properties
    console.log('📂 Loading V2 properties...');
    const v2PropertiesStr = localStorage.getItem('properties');
    
    if (!v2PropertiesStr) {
      console.log('ℹ️ No V2 properties found - this might be a fresh install');
      status.isComplete = true;
      saveMigrationStatus(status);
      return status;
    }

    const v2Properties: PropertyV2[] = JSON.parse(v2PropertiesStr);
    console.log(`📊 Found ${v2Properties.length} V2 properties`);

    // Step 3: Migrate properties
    const v3Properties: Property[] = [];
    const sellCycles: SellCycle[] = [];
    const rentCycles: RentCycle[] = [];

    for (const oldProp of v2Properties) {
      try {
        // Convert property structure
        const newProp = migratePropertyV2toV3(oldProp);
        
        // Convert listing to cycle
        const cycles = convertListingToCycle(oldProp);
        
        // If sell cycle created, link it
        if (cycles.sellCycle) {
          sellCycles.push(cycles.sellCycle);
          newProp.activeSellCycleIds.push(cycles.sellCycle.id);
          newProp.cycleHistory.sellCycles.push({
            cycleId: cycles.sellCycle.id,
            startDate: cycles.sellCycle.createdAt,
            status: cycles.sellCycle.status,
          });
        }
        
        // If rent cycle created, link it
        if (cycles.rentCycle) {
          rentCycles.push(cycles.rentCycle);
          newProp.activeRentCycleIds.push(cycles.rentCycle.id);
          newProp.cycleHistory.rentCycles.push({
            cycleId: cycles.rentCycle.id,
            startDate: cycles.rentCycle.createdAt,
            status: cycles.rentCycle.status,
          });
        }
        
        v3Properties.push(newProp);
        status.propertiesMigrated!++;
      } catch (error) {
        const errorMsg = `Failed to migrate property ${oldProp.id}: ${error}`;
        console.error(errorMsg);
        status.errors!.push(errorMsg);
      }
    }

    // Step 4: Save migrated data
    console.log('💾 Saving migrated data...');
    
    // Save V3 properties (replace old)
    localStorage.setItem('properties', JSON.stringify(v3Properties));
    
    // Save cycles
    if (sellCycles.length > 0) {
      localStorage.setItem('sell_cycles_v3', JSON.stringify(sellCycles));
      console.log(`✅ Migrated ${sellCycles.length} sell cycles`);
    }
    
    if (rentCycles.length > 0) {
      localStorage.setItem('rent_cycles_v3', JSON.stringify(rentCycles));
      console.log(`✅ Migrated ${rentCycles.length} rent cycles`);
    }

    // Initialize empty purchase cycles if not exists
    if (!localStorage.getItem('purchase_cycles_v3')) {
      localStorage.setItem('purchase_cycles_v3', JSON.stringify([]));
    }

    // Initialize empty buyer requirements if not exists
    if (!localStorage.getItem('buyer_requirements_v3')) {
      localStorage.setItem('buyer_requirements_v3', JSON.stringify([]));
    }

    // Step 5: Mark migration complete
    status.isComplete = true;
    saveMigrationStatus(status);

    console.log('✅ Migration complete!');
    console.log(`📊 Migrated ${status.propertiesMigrated} properties`);
    console.log(`📊 Created ${sellCycles.length} sell cycles`);
    console.log(`📊 Created ${rentCycles.length} rent cycles`);

    return status;
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error(errorMsg);
    status.errors!.push(errorMsg);
    saveMigrationStatus(status);
    return status;
  }
}

/**
 * Step 8: Reset migration (for testing)
 */
export function resetMigration(): void {
  localStorage.removeItem(MIGRATION_STATUS_KEY);
  console.log('Migration status reset');
}

/**
 * Step 9: Get backup info
 */
export function getBackupInfo(): { exists: boolean; timestamp?: string } {
  try {
    const backupStr = localStorage.getItem(BACKUP_KEY);
    if (!backupStr) {
      return { exists: false };
    }

    const backup = JSON.parse(backupStr);
    return {
      exists: true,
      timestamp: backup.timestamp,
    };
  } catch (error) {
    return { exists: false };
  }
}

/**
 * Step 10: Validate migrated data
 */
export function validateMigration(): {
  isValid: boolean;
  issues: string[];
  summary: {
    v3Properties: number;
    sellCycles: number;
    purchaseCycles: number;
    rentCycles: number;
    buyerRequirements: number;
  };
} {
  const issues: string[] = [];
  const summary = {
    v3Properties: 0,
    sellCycles: 0,
    purchaseCycles: 0,
    rentCycles: 0,
    buyerRequirements: 0,
  };

  try {
    // Check properties
    const propertiesStr = localStorage.getItem('properties');
    if (propertiesStr) {
      const properties: Property[] = JSON.parse(propertiesStr);
      summary.v3Properties = properties.length;

      // Validate each property has required V3 fields
      properties.forEach(prop => {
        if (!prop.activeSellCycleIds) {
          issues.push(`Property ${prop.id} missing activeSellCycleIds`);
        }
        if (!prop.activePurchaseCycleIds) {
          issues.push(`Property ${prop.id} missing activePurchaseCycleIds`);
        }
        if (!prop.activeRentCycleIds) {
          issues.push(`Property ${prop.id} missing activeRentCycleIds`);
        }
        if (!prop.cycleHistory) {
          issues.push(`Property ${prop.id} missing cycleHistory`);
        }
      });
    }

    // Check sell cycles
    const sellCyclesStr = localStorage.getItem('sell_cycles_v3');
    if (sellCyclesStr) {
      const sellCycles = JSON.parse(sellCyclesStr);
      summary.sellCycles = sellCycles.length;
    }

    // Check purchase cycles
    const purchaseCyclesStr = localStorage.getItem('purchase_cycles_v3');
    if (purchaseCyclesStr) {
      const purchaseCycles = JSON.parse(purchaseCyclesStr);
      summary.purchaseCycles = purchaseCycles.length;
    }

    // Check rent cycles
    const rentCyclesStr = localStorage.getItem('rent_cycles_v3');
    if (rentCyclesStr) {
      const rentCycles = JSON.parse(rentCyclesStr);
      summary.rentCycles = rentCycles.length;
    }

    // Check buyer requirements
    const buyerReqStr = localStorage.getItem('buyer_requirements_v3');
    if (buyerReqStr) {
      const buyerReqs = JSON.parse(buyerReqStr);
      summary.buyerRequirements = buyerReqs.length;
    }

    return {
      isValid: issues.length === 0,
      issues,
      summary,
    };
  } catch (error) {
    issues.push(`Validation error: ${error}`);
    return {
      isValid: false,
      issues,
      summary,
    };
  }
}

/**
 * Step 11: Export data for external backup
 */
export function exportAllData(): string {
  const exportData: any = {
    timestamp: new Date().toISOString(),
    version: 'v3.0',
    data: {},
  };

  // Export all estate manager data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('estate') || key === 'properties' || key.includes('_v3'))) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          exportData.data[key] = JSON.parse(value);
        }
      } catch (error) {
        exportData.data[key] = localStorage.getItem(key);
      }
    }
  }

  return JSON.stringify(exportData, null, 2);
}

/**
 * Step 12: Import data from external backup
 */
export function importData(jsonString: string): boolean {
  try {
    const importData = JSON.parse(jsonString);
    
    if (!importData.data) {
      console.error('Invalid import format');
      return false;
    }

    // Import each key
    Object.keys(importData.data).forEach(key => {
      const value = typeof importData.data[key] === 'string'
        ? importData.data[key]
        : JSON.stringify(importData.data[key]);
      localStorage.setItem(key, value);
    });

    console.log('✅ Data imported successfully');
    return true;
  } catch (error) {
    console.error('❌ Import failed:', error);
    return false;
  }
}
