/**
 * Smart Matching Test Utility
 * Generates test data and validates matching algorithm
 */

import { runMatchingForAllSharedCycles, calculateMatchScore, getMatchDetails, clearMatches } from './smartMatching';
import { toggleSellCycleSharing } from './sellCycle';
import { toggleRentCycleSharing } from './rentCycle';
import { logger } from './logger';

/**
 * Test the matching algorithm with sample data
 * Run this in browser console: testSmartMatching()
 */
export function testSmartMatching(): void {
  logger.info('🧪 Testing Smart Matching System...');
  
  try {
    // Clear existing matches
    clearMatches();
    logger.info('✅ Cleared existing matches');
    
    // Get user info (assuming current user)
    const userStr = localStorage.getItem('current_user');
    if (!userStr) {
      logger.error('❌ No user logged in');
      return;
    }
    
    const user = JSON.parse(userStr);
    logger.info(`👤 Testing as: ${user.name} (${user.role})`);
    
    // Share all sell cycles
    const sellCyclesStr = localStorage.getItem('sell_cycles_v3');
    if (sellCyclesStr) {
      const sellCycles = JSON.parse(sellCyclesStr);
      logger.info(`📋 Found ${sellCycles.length} sell cycles`);
      
      let sharedCount = 0;
      sellCycles.forEach((cycle: any) => {
        if (!cycle.sharing?.isShared && cycle.status === 'listed') {
          toggleSellCycleSharing(cycle.id, true, user.id, user.name);
          sharedCount++;
        }
      });
      logger.info(`✅ Shared ${sharedCount} sell cycles`);
    }
    
    // Share all rent cycles
    const rentCyclesStr = localStorage.getItem('rent_cycles_v3');
    if (rentCyclesStr) {
      const rentCycles = JSON.parse(rentCyclesStr);
      logger.info(`📋 Found ${rentCycles.length} rent cycles`);
      
      let sharedCount = 0;
      rentCycles.forEach((cycle: any) => {
        if (!cycle.sharing?.isShared && cycle.status === 'available') {
          toggleRentCycleSharing(cycle.id, true, user.id, user.name);
          sharedCount++;
        }
      });
      logger.info(`✅ Shared ${sharedCount} rent cycles`);
    }
    
    // Run matching
    logger.info('🔄 Running matching algorithm...');
    const matches = runMatchingForAllSharedCycles(user.id, user.role);
    
    // Display results
    logger.info(`\n🎯 MATCHING RESULTS`);
    logger.info(`==================`);
    logger.info(`Total Matches: ${matches.length}`);
    
    if (matches.length > 0) {
      // Group by score
      const excellent = matches.filter(m => m.matchScore >= 90);
      const good = matches.filter(m => m.matchScore >= 80 && m.matchScore < 90);
      const fair = matches.filter(m => m.matchScore >= 70 && m.matchScore < 80);
      
      logger.info(`\n📊 Score Distribution:`);
      logger.info(`  Excellent (90-100%): ${excellent.length}`);
      logger.info(`  Good (80-89%): ${good.length}`);
      logger.info(`  Fair (70-79%): ${fair.length}`);
      
      // Show top 5 matches
      logger.info(`\n🏆 Top 5 Matches:`);
      const topMatches = [...matches]
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
      
      topMatches.forEach((match, idx) => {
        logger.info(`\n${idx + 1}. ${match.matchScore}% Match`);
        logger.info(`   Type: ${match.cycleType} cycle ↔ ${match.requirementType} requirement`);
        logger.info(`   Listing Agent: ${match.listingAgentName}`);
        logger.info(`   ${match.requirementType === 'buyer' ? 'Buyer' : 'Renter'} Agent: ${match.buyerAgentName || match.renterAgentName}`);
        logger.info(`   Matched:`);
        if (match.matchDetails.propertyTypeMatch) logger.info(`     ✓ Property Type`);
        if (match.matchDetails.locationMatch) logger.info(`     ✓ Location`);
        if (match.matchDetails.priceMatch) logger.info(`     ✓ Price Range`);
        if (match.matchDetails.areaMatch) logger.info(`     ✓ Area/Size`);
        if (match.matchDetails.bedroomsMatch) logger.info(`     ✓ Bedrooms`);
        if (match.matchDetails.bathroomsMatch) logger.info(`     ✓ Bathrooms`);
        if (match.matchDetails.featuresMatch.length > 0) {
          logger.info(`     ✓ Features: ${match.matchDetails.featuresMatch.join(', ')}`);
        }
      });
    } else {
      logger.warn('⚠️ No matches found');
      logger.info('Possible reasons:');
      logger.info('  1. No shared cycles available');
      logger.info('  2. No active requirements');
      logger.info('  3. Requirements don\'t match available properties');
    }
    
    logger.info(`\n✅ Test complete!`);
    
  } catch (error) {
    logger.error('❌ Test failed:', error);
  }
}

/**
 * Test individual match scoring
 */
export function testMatchScoring(): void {
  logger.info('🧪 Testing Match Scoring...');
  
  // Create test property
  const testProperty: any = {
    id: 'test-prop-1',
    propertyType: 'house',
    address: {
      cityName: 'Karachi',
      areaName: 'DHA Phase 8',
    },
    price: 50000000, // 5 Crore
    area: 500, // 500 sq yd
    bedrooms: 4,
    bathrooms: 4,
    features: ['parking', 'garden', 'security'],
  };
  
  // Create test requirement
  const testRequirement: any = {
    propertyTypes: ['house', 'villa'],
    preferredLocations: ['DHA Phase 8', 'DHA Phase 7'],
    minBudget: 45000000,
    maxBudget: 55000000,
    minArea: 400,
    maxArea: 600,
    minBedrooms: 3,
    maxBedrooms: 5,
    minBathrooms: 3,
    features: ['parking', 'garden'],
  };
  
  // Calculate score
  const score = calculateMatchScore(testProperty, testRequirement);
  const details = getMatchDetails(testProperty, testRequirement);
  
  logger.info(`\n📊 Test Results:`);
  logger.info(`Match Score: ${score}%`);
  logger.info(`\nDetails:`);
  logger.info(`  Property Type: ${details.propertyTypeMatch ? '✓' : '✗'}`);
  logger.info(`  Location: ${details.locationMatch ? '✓' : '✗'}`);
  logger.info(`  Price: ${details.priceMatch ? '✓' : '✗'}`);
  logger.info(`  Area: ${details.areaMatch ? '✓' : '✗'}`);
  logger.info(`  Bedrooms: ${details.bedroomsMatch ? '✓' : '✗'}`);
  logger.info(`  Bathrooms: ${details.bathroomsMatch ? '✓' : '✗'}`);
  logger.info(`  Matching Features: ${details.featuresMatch.join(', ') || 'None'}`);
  
  // Test edge cases
  logger.info(`\n🔍 Edge Case Tests:`);
  
  // 1. No property type match
  const noTypeMatch = calculateMatchScore(
    { ...testProperty, propertyType: 'apartment' },
    testRequirement
  );
  logger.info(`1. Different property type: ${noTypeMatch}% (should be < 100%)`);
  
  // 2. Price out of range
  const noPriceMatch = calculateMatchScore(
    { ...testProperty, price: 70000000 },
    testRequirement
  );
  logger.info(`2. Price out of range: ${noPriceMatch}% (should be < perfect match)`);
  
  // 3. Perfect match
  const perfectMatch = calculateMatchScore(testProperty, testRequirement);
  logger.info(`3. Perfect match: ${perfectMatch}% (should be 90-100%)`);
  
  logger.info(`\n✅ Scoring test complete!`);
}

/**
 * Display current matching statistics
 */
export function showMatchingStats(): void {
  logger.info('📊 Smart Matching Statistics');
  logger.info('============================\n');
  
  // Get matches
  const matchesStr = localStorage.getItem('property_matches');
  const matches = matchesStr ? JSON.parse(matchesStr) : [];
  
  logger.info(`Total Matches: ${matches.length}`);
  
  if (matches.length === 0) {
    logger.info('No matches found. Run testSmartMatching() to generate matches.');
    return;
  }
  
  // By status
  const byStatus = matches.reduce((acc: any, m: any) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});
  
  logger.info(`\nBy Status:`);
  Object.entries(byStatus).forEach(([status, count]) => {
    logger.info(`  ${status}: ${count}`);
  });
  
  // By cycle type
  const byCycleType = matches.reduce((acc: any, m: any) => {
    acc[m.cycleType] = (acc[m.cycleType] || 0) + 1;
    return acc;
  }, {});
  
  logger.info(`\nBy Cycle Type:`);
  Object.entries(byCycleType).forEach(([type, count]) => {
    logger.info(`  ${type}: ${count}`);
  });
  
  // Average score
  const avgScore = matches.reduce((sum: number, m: any) => sum + m.matchScore, 0) / matches.length;
  logger.info(`\nAverage Match Score: ${avgScore.toFixed(1)}%`);
  
  // Score distribution
  const scoreRanges = {
    '90-100%': matches.filter((m: any) => m.matchScore >= 90).length,
    '80-89%': matches.filter((m: any) => m.matchScore >= 80 && m.matchScore < 90).length,
    '70-79%': matches.filter((m: any) => m.matchScore >= 70 && m.matchScore < 80).length,
    'Below 70%': matches.filter((m: any) => m.matchScore < 70).length,
  };
  
  logger.info(`\nScore Distribution:`);
  Object.entries(scoreRanges).forEach(([range, count]) => {
    logger.info(`  ${range}: ${count}`);
  });
}

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testSmartMatching = testSmartMatching;
  (window as any).testMatchScoring = testMatchScoring;
  (window as any).showMatchingStats = showMatchingStats;
  
  logger.info('🧪 Smart Matching Test Functions Available:');
  logger.info('  - testSmartMatching() - Run full matching test');
  logger.info('  - testMatchScoring() - Test scoring algorithm');
  logger.info('  - showMatchingStats() - View current statistics');
}
