/**
 * Fix Agency Ownership - Migration Utility
 * 
 * This utility fixes properties that were purchased for the agency but don't have
 * the correct currentOwnerType set to 'agency', which prevents them from showing
 * in the Agency Portfolio.
 * 
 * ISSUE: Properties purchased via agency purchase cycles before the ownership fix
 * may have currentOwnerType set to undefined or incorrect values.
 * 
 * SOLUTION: Scan all purchase cycles where purchaserType === 'agency' and status === 'acquired',
 * then ensure the corresponding properties have currentOwnerType === 'agency'.
 */

import { getProperties, updateProperty } from './data';
import { getPurchaseCycles } from './purchaseCycle';
import { formatPropertyAddress } from './utils';

// Helper to safely format address
const safeFormatAddress = (address: any): string => {
  if (!address) return 'Unknown Address';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    try {
      return formatPropertyAddress(address);
    } catch {
      return 'Invalid Address Format';
    }
  }
  return String(address);
};

export interface FixResult {
  totalScanned: number;
  totalFixed: number;
  fixedProperties: Array<{
    propertyId: string;
    address: string;
    oldOwnerType: string | undefined;
    newOwnerType: string;
  }>;
  errors: Array<{
    propertyId: string;
    error: string;
  }>;
}

/**
 * Fix all agency-owned properties that have incorrect currentOwnerType
 */
export function fixAgencyOwnedProperties(): FixResult {
  console.log('🔧 Starting Agency Ownership Fix...');
  
  const result: FixResult = {
    totalScanned: 0,
    totalFixed: 0,
    fixedProperties: [],
    errors: [],
  };
  
  try {
    // Get all purchase cycles where agency acquired properties
    const allPurchaseCycles = getPurchaseCycles();
    const agencyAcquiredCycles = allPurchaseCycles.filter(
      cycle => cycle.purchaserType === 'agency' && cycle.status === 'acquired'
    );
    
    console.log(`   Found ${agencyAcquiredCycles.length} agency acquisition cycles`);
    
    // Get all properties
    const allProperties = getProperties();
    
    // Check each agency-acquired property
    for (const cycle of agencyAcquiredCycles) {
      result.totalScanned++;
      
      const property = allProperties.find(p => p.id === cycle.propertyId);
      
      if (!property) {
        result.errors.push({
          propertyId: cycle.propertyId,
          error: 'Property not found',
        });
        console.warn(`   ⚠️  Property ${cycle.propertyId} not found for cycle ${cycle.id}`);
        continue;
      }
      
      // Check if currentOwnerType is already correct
      if (property.currentOwnerType === 'agency') {
        console.log(`   ✓ Property ${property.address} already has correct owner type`);
        continue;
      }
      
      // Fix the property
      console.log(`   🔧 Fixing property: ${property.address}`);
      console.log(`      - Current Owner Type: ${property.currentOwnerType || 'undefined'}`);
      console.log(`      - Current Owner ID: ${property.currentOwnerId}`);
      console.log(`      - Purchaser ID: ${cycle.purchaserId}`);
      
      try {
        const oldOwnerType = property.currentOwnerType;
        
        // Update property to have correct owner type
        updateProperty(property.id, {
          currentOwnerType: 'agency',
          // Also ensure currentOwnerId matches the agency purchaser
          currentOwnerId: cycle.purchaserId,
          currentOwnerName: cycle.purchaserName,
        });
        
        result.totalFixed++;
        result.fixedProperties.push({
          propertyId: property.id,
          address: property.address,
          oldOwnerType,
          newOwnerType: 'agency',
        });
        
        console.log(`   ✅ Fixed: ${property.address}`);
        
      } catch (error) {
        result.errors.push({
          propertyId: property.id,
          error: String(error),
        });
        console.error(`   ❌ Error fixing property ${property.id}:`, error);
      }
    }
    
    console.log('\n📊 Fix Summary:');
    console.log(`   - Total Scanned: ${result.totalScanned}`);
    console.log(`   - Total Fixed: ${result.totalFixed}`);
    console.log(`   - Errors: ${result.errors.length}`);
    
    if (result.fixedProperties.length > 0) {
      console.log('\n✅ Fixed Properties:');
      result.fixedProperties.forEach(fp => {
        console.log(`   - ${fp.address}`);
        console.log(`     Old Type: ${fp.oldOwnerType || 'undefined'} → New Type: ${fp.newOwnerType}`);
      });
    }
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(err => {
        console.log(`   - Property ${err.propertyId}: ${err.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Critical error during fix:', error);
    result.errors.push({
      propertyId: 'SYSTEM',
      error: String(error),
    });
  }
  
  return result;
}

/**
 * Fix a single property's owner type based on its purchase cycle
 */
export function fixSinglePropertyOwnership(propertyId: string): {
  success: boolean;
  message: string;
  oldOwnerType?: string;
  newOwnerType?: string;
} {
  try {
    const allProperties = getProperties();
    const property = allProperties.find(p => p.id === propertyId);
    
    if (!property) {
      return {
        success: false,
        message: 'Property not found',
      };
    }
    
    // Find the most recent acquisition purchase cycle for this property
    const allPurchaseCycles = getPurchaseCycles();
    const acquisitionCycle = allPurchaseCycles
      .filter(cycle => cycle.propertyId === propertyId && cycle.status === 'acquired')
      .sort((a, b) => {
        const dateA = new Date(a.actualCloseDate || a.createdAt).getTime();
        const dateB = new Date(b.actualCloseDate || b.createdAt).getTime();
        return dateB - dateA; // Most recent first
      })[0];
    
    if (!acquisitionCycle) {
      return {
        success: false,
        message: 'No acquisition purchase cycle found for this property',
      };
    }
    
    // Determine correct owner type based on purchaser type
    let correctOwnerType: 'client' | 'agency' | 'investor' | 'external';
    
    switch (acquisitionCycle.purchaserType) {
      case 'agency':
        correctOwnerType = 'agency';
        break;
      case 'investor':
        correctOwnerType = 'investor';
        break;
      case 'client':
        correctOwnerType = 'client';
        break;
      default:
        return {
          success: false,
          message: `Unknown purchaser type: ${acquisitionCycle.purchaserType}`,
        };
    }
    
    const oldOwnerType = property.currentOwnerType;
    
    // Update if needed
    if (property.currentOwnerType !== correctOwnerType) {
      updateProperty(propertyId, {
        currentOwnerType: correctOwnerType,
        currentOwnerId: acquisitionCycle.purchaserId,
        currentOwnerName: acquisitionCycle.purchaserName,
      });
      
      return {
        success: true,
        message: `Updated owner type from ${oldOwnerType || 'undefined'} to ${correctOwnerType}`,
        oldOwnerType,
        newOwnerType: correctOwnerType,
      };
    }
    
    return {
      success: true,
      message: 'Owner type is already correct',
      oldOwnerType,
      newOwnerType: correctOwnerType,
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error}`,
    };
  }
}

/**
 * Check if any properties need fixing
 */
export function checkForOwnershipIssues(): {
  hasIssues: boolean;
  issueCount: number;
  issues: Array<{
    propertyId: string;
    address: string;
    currentOwnerType: string | undefined;
    expectedOwnerType: string;
    purchaserType: string;
  }>;
} {
  const issues: Array<{
    propertyId: string;
    address: string;
    currentOwnerType: string | undefined;
    expectedOwnerType: string;
    purchaserType: string;
  }> = [];
  
  try {
    const allPurchaseCycles = getPurchaseCycles();
    const allProperties = getProperties();
    
    const acquiredCycles = allPurchaseCycles.filter(cycle => cycle.status === 'acquired');
    
    for (const cycle of acquiredCycles) {
      const property = allProperties.find(p => p.id === cycle.propertyId);
      
      if (!property) continue;
      
      let expectedOwnerType: string;
      switch (cycle.purchaserType) {
        case 'agency':
          expectedOwnerType = 'agency';
          break;
        case 'investor':
          expectedOwnerType = 'investor';
          break;
        case 'client':
          expectedOwnerType = 'client';
          break;
        default:
          continue;
      }
      
      if (property.currentOwnerType !== expectedOwnerType) {
        issues.push({
          propertyId: property.id,
          address: safeFormatAddress(property.address),
          currentOwnerType: property.currentOwnerType,
          expectedOwnerType,
          purchaserType: cycle.purchaserType,
        });
      }
    }
  } catch (error) {
    console.error('Error checking for ownership issues:', error);
  }
  
  return {
    hasIssues: issues.length > 0,
    issueCount: issues.length,
    issues,
  };
}