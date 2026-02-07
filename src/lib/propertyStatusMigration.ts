/**
 * Property Status Migration Utility
 * 
 * One-time utility to fix any existing properties with inconsistent status.
 * Run this after deploying the property status sync fix.
 */

import { batchSyncAllPropertyStatuses, getPropertyStatusReason, determinePropertyStatus } from './propertyStatusSync';
import { getProperties, getPropertyById } from './data';

/**
 * Run migration to fix all property statuses
 * Call this once after deploying the status sync fix
 */
export function runPropertyStatusMigration(): {
  success: boolean;
  totalProperties: number;
  changedProperties: number;
  report: Array<{
    propertyId: string;
    title: string;
    oldStatus: string;
    newStatus: string;
    reason: string;
  }>;
} {
  console.log('🔄 Starting Property Status Migration...');
  console.log('='.repeat(60));
  
  const properties = getProperties();
  const report: Array<{
    propertyId: string;
    title: string;
    oldStatus: string;
    newStatus: string;
    reason: string;
  }> = [];
  
  // Store original statuses
  const originalStatuses = new Map(
    properties.map(p => [p.id, p.status])
  );
  
  // Run batch sync
  batchSyncAllPropertyStatuses();
  
  // Get updated properties and build report
  const updatedProperties = getProperties();
  let changedCount = 0;
  
  updatedProperties.forEach(property => {
    const oldStatus = originalStatuses.get(property.id) || 'unknown';
    const newStatus = property.status;
    
    if (oldStatus !== newStatus) {
      changedCount++;
      const reason = getPropertyStatusReason(property.id);
      
      report.push({
        propertyId: property.id,
        title: property.title,
        oldStatus,
        newStatus,
        reason
      });
      
      console.log(`✏️  Property: ${property.title}`);
      console.log(`   ID: ${property.id}`);
      console.log(`   Old Status: ${oldStatus}`);
      console.log(`   New Status: ${newStatus}`);
      console.log(`   Reason: ${reason}`);
      console.log('-'.repeat(60));
    }
  });
  
  console.log('='.repeat(60));
  console.log(`✅ Migration Complete!`);
  console.log(`   Total Properties: ${properties.length}`);
  console.log(`   Changed: ${changedCount}`);
  console.log(`   Unchanged: ${properties.length - changedCount}`);
  console.log('='.repeat(60));
  
  return {
    success: true,
    totalProperties: properties.length,
    changedProperties: changedCount,
    report
  };
}

/**
 * Generate a migration report without making changes
 * Use this to preview what would change
 */
export function previewPropertyStatusMigration(): {
  totalProperties: number;
  willChange: number;
  preview: Array<{
    propertyId: string;
    title: string;
    currentStatus: string;
    shouldBeStatus: string;
    reason: string;
  }>;
} {
  console.log('🔍 Previewing Property Status Migration...');
  console.log('='.repeat(60));
  
  const properties = getProperties();
  
  const preview: Array<{
    propertyId: string;
    title: string;
    currentStatus: string;
    shouldBeStatus: string;
    reason: string;
  }> = [];
  
  let willChangeCount = 0;
  
  properties.forEach(property => {
    const currentStatus = property.status;
    const shouldBeStatus = determinePropertyStatus(property.id);
    
    if (currentStatus !== shouldBeStatus) {
      willChangeCount++;
      const reason = getPropertyStatusReason(property.id);
      
      preview.push({
        propertyId: property.id,
        title: property.title,
        currentStatus,
        shouldBeStatus,
        reason
      });
      
      console.log(`📋 Property: ${property.title}`);
      console.log(`   ID: ${property.id}`);
      console.log(`   Current: ${currentStatus}`);
      console.log(`   Should Be: ${shouldBeStatus}`);
      console.log(`   Reason: ${reason}`);
      console.log('-'.repeat(60));
    }
  });
  
  console.log('='.repeat(60));
  console.log(`Preview Results:`);
  console.log(`   Total Properties: ${properties.length}`);
  console.log(`   Will Change: ${willChangeCount}`);
  console.log(`   Will Remain: ${properties.length - willChangeCount}`);
  console.log('='.repeat(60));
  
  return {
    totalProperties: properties.length,
    willChange: willChangeCount,
    preview
  };
}

/**
 * Export migration report as JSON
 */
export function exportMigrationReport(): string {
  const report = previewPropertyStatusMigration();
  return JSON.stringify(report, null, 2);
}

/**
 * Add to DevTools for easy access
 * Usage: Open browser console and run: window.aaraazi.runPropertyStatusMigration()
 */
if (typeof window !== 'undefined') {
  (window as any).aaraazi = {
    ...(window as any).aaraazi,
    runPropertyStatusMigration,
    previewPropertyStatusMigration,
    exportMigrationReport,
  };
  
  console.log('🔧 Property Status Migration tools loaded!');
  console.log('   Run: window.aaraazi.previewPropertyStatusMigration()');
  console.log('   Run: window.aaraazi.runPropertyStatusMigration()');
}
