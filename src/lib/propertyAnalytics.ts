import { Property } from '../types';
import { getPropertyById, updateProperty, getProperties, addProperty } from './data';

/**
 * Calculate days on market for a property
 * Returns the number of days since the property was listed
 */
export function calculateDaysOnMarket(property: Property): number {
  if (!property.listedDate) {
    // If no listed date, use createdAt as fallback
    const listedDate = new Date(property.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - listedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  const listedDate = new Date(property.listedDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - listedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get days on market status badge color
 * Fresh: 0-30 days (green)
 * Active: 31-90 days (blue)
 * Aging: 91-180 days (yellow)
 * Stale: 180+ days (red)
 */
export function getDaysOnMarketStatus(days: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (days <= 30) {
    return {
      label: 'Fresh Listing',
      color: 'text-green-700',
      bgColor: 'bg-green-100'
    };
  } else if (days <= 90) {
    return {
      label: 'Active Listing',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100'
    };
  } else if (days <= 180) {
    return {
      label: 'Aging Listing',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100'
    };
  } else {
    return {
      label: 'Stale Listing',
      color: 'text-red-700',
      bgColor: 'bg-red-100'
    };
  }
}

/**
 * Track property view count
 * Increments the view count for a property
 */
export function trackPropertyView(propertyId: string): boolean {
  try {
    const property = getPropertyById(propertyId);
    if (!property) return false;
    
    const currentViews = property.viewCount || 0;
    const lastViewed = new Date().toISOString();
    
    updateProperty(propertyId, {
      viewCount: currentViews + 1,
      lastViewed: lastViewed
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking property view:', error);
    return false;
  }
}

/**
 * Get property view statistics
 */
export function getPropertyViewStats(propertyId: string): {
  viewCount: number;
  lastViewed: string | null;
  averageViewsPerDay: number;
} {
  try {
    const property = getPropertyById(propertyId);
    if (!property) {
      return {
        viewCount: 0,
        lastViewed: null,
        averageViewsPerDay: 0
      };
    }
    
    const viewCount = property.viewCount || 0;
    const lastViewed = property.lastViewed || null;
    
    // Calculate average views per day
    const daysOnMarket = calculateDaysOnMarket(property);
    const averageViewsPerDay = daysOnMarket > 0 ? viewCount / daysOnMarket : 0;
    
    return {
      viewCount,
      lastViewed,
      averageViewsPerDay: parseFloat(averageViewsPerDay.toFixed(2))
    };
  } catch (error) {
    console.error('Error getting property view stats:', error);
    return {
      viewCount: 0,
      lastViewed: null,
      averageViewsPerDay: 0
    };
  }
}

/**
 * Duplicate a property (create a copy)
 * Useful for creating similar listings
 */
export function duplicateProperty(
  propertyId: string,
  userId: string,
  userName: string
): Property | null {
  try {
    const originalProperty = getPropertyById(propertyId);
    if (!originalProperty) return null;
    
    const now = new Date().toISOString();
    const newId = `prop-${Date.now()}`;
    
    // Create new property with copied data
    const duplicatedProperty: Property = {
      ...originalProperty,
      id: newId,
      title: `${originalProperty.title} (Copy)`,
      agentId: userId,
      agentName: userName,
      createdAt: now,
      updatedAt: now,
      listedDate: now,
      status: 'available',
      isPublished: false, // Start as draft
      viewCount: 0,
      lastViewed: undefined,
      soldDate: undefined,
      finalSalePrice: undefined,
      commissionEarned: undefined,
      // Reset ownership fields for new listing
      currentOwnerId: originalProperty.acquisitionType === 'agency-purchase' ? 'AGENCY' : undefined,
      ownershipHistory: undefined
    };
    
    // Save the duplicated property
    addProperty(duplicatedProperty);
    
    return duplicatedProperty;
  } catch (error) {
    console.error('Error duplicating property:', error);
    return null;
  }
}

/**
 * Mark property as featured
 */
export function toggleFeaturedProperty(propertyId: string): boolean {
  try {
    const property = getPropertyById(propertyId);
    if (!property) return false;
    
    updateProperty(propertyId, {
      isFeatured: !property.isFeatured
    });
    
    return true;
  } catch (error) {
    console.error('Error toggling featured status:', error);
    return false;
  }
}

/**
 * Check if property listing is expired
 */
export function isListingExpired(property: Property): boolean {
  if (!property.listingExpiryDate) return false;
  
  const expiryDate = new Date(property.listingExpiryDate);
  const today = new Date();
  
  return today > expiryDate;
}

/**
 * Get days until listing expires
 */
export function getDaysUntilExpiry(property: Property): number | null {
  if (!property.listingExpiryDate) return null;
  
  const expiryDate = new Date(property.listingExpiryDate);
  const today = new Date();
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get property performance score (0-100)
 * Based on views, days on market, and engagement
 */
export function getPropertyPerformanceScore(property: Property): number {
  let score = 100;
  
  // Deduct points for days on market
  const daysOnMarket = calculateDaysOnMarket(property);
  if (daysOnMarket > 180) {
    score -= 40;
  } else if (daysOnMarket > 90) {
    score -= 20;
  } else if (daysOnMarket > 30) {
    score -= 10;
  }
  
  // Deduct points for low view count
  const viewCount = property.viewCount || 0;
  const averageViewsPerDay = daysOnMarket > 0 ? viewCount / daysOnMarket : 0;
  
  if (averageViewsPerDay < 0.5) {
    score -= 30;
  } else if (averageViewsPerDay < 1) {
    score -= 15;
  } else if (averageViewsPerDay < 2) {
    score -= 5;
  }
  
  // Add points for featured status
  if (property.isFeatured) {
    score += 10;
  }
  
  // Add points for being published
  if (property.isPublished) {
    score += 5;
  }
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get property engagement metrics
 */
export function getPropertyEngagement(propertyId: string): {
  viewCount: number;
  daysOnMarket: number;
  viewsPerDay: number;
  performanceScore: number;
  status: string;
} {
  try {
    const property = getPropertyById(propertyId);
    if (!property) {
      return {
        viewCount: 0,
        daysOnMarket: 0,
        viewsPerDay: 0,
        performanceScore: 0,
        status: 'unknown'
      };
    }
    
    const viewStats = getPropertyViewStats(propertyId);
    const daysOnMarket = calculateDaysOnMarket(property);
    const performanceScore = getPropertyPerformanceScore(property);
    const daysStatus = getDaysOnMarketStatus(daysOnMarket);
    
    return {
      viewCount: viewStats.viewCount,
      daysOnMarket,
      viewsPerDay: viewStats.averageViewsPerDay,
      performanceScore,
      status: daysStatus.label
    };
  } catch (error) {
    console.error('Error getting property engagement:', error);
    return {
      viewCount: 0,
      daysOnMarket: 0,
      viewsPerDay: 0,
      performanceScore: 0,
      status: 'unknown'
    };
  }
}

/**
 * Get all properties sorted by performance
 */
export function getTopPerformingProperties(limit: number = 10): Property[] {
  try {
    const allProperties = getProperties();
    
    // Filter only active listings
    const activeProperties = allProperties.filter(
      (p: Property) => p.status === 'available' && p.isPublished
    );
    
    // Sort by performance score
    const sortedProperties = activeProperties.sort((a: Property, b: Property) => {
      const scoreA = getPropertyPerformanceScore(a);
      const scoreB = getPropertyPerformanceScore(b);
      return scoreB - scoreA;
    });
    
    return sortedProperties.slice(0, limit);
  } catch (error) {
    console.error('Error getting top performing properties:', error);
    return [];
  }
}

/**
 * Get properties that need attention (low performance, expiring, etc.)
 */
export function getPropertiesNeedingAttention(): {
  staleListing: Property[];
  lowViews: Property[];
  expiringSoon: Property[];
} {
  try {
    const allProperties = getProperties();
    
    const activeProperties = allProperties.filter(
      (p: Property) => p.status === 'available' && p.isPublished
    );
    
    const staleListing = activeProperties.filter((p: Property) => {
      const days = calculateDaysOnMarket(p);
      return days > 180;
    });
    
    const lowViews = activeProperties.filter((p: Property) => {
      const stats = getPropertyViewStats(p.id);
      const days = calculateDaysOnMarket(p);
      return days > 7 && stats.averageViewsPerDay < 0.5;
    });
    
    const expiringSoon = activeProperties.filter((p: Property) => {
      const daysUntilExpiry = getDaysUntilExpiry(p);
      return daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 0;
    });
    
    return {
      staleListing,
      lowViews,
      expiringSoon
    };
  } catch (error) {
    console.error('Error getting properties needing attention:', error);
    return {
      staleListing: [],
      lowViews: [],
      expiringSoon: []
    };
  }
}
