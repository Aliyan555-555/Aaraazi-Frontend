import { Property, PriceHistory } from '../types';
import { getProperties } from './data';

/**
 * Market Trends Analysis Library
 * Provides comprehensive market intelligence and pricing analytics
 */

// ============================================================================
// PRICE HISTORY MANAGEMENT
// ============================================================================

/**
 * Add a price change to property history
 */
export function addPriceHistory(
  property: Property,
  newPrice: number,
  reason?: string,
  changedBy?: string
): PriceHistory {
  const now = new Date().toISOString();
  const oldPrice = property.price || 0;
  const changeAmount = newPrice - oldPrice;
  const changePercentage = oldPrice > 0 ? ((changeAmount / oldPrice) * 100) : 0;

  const priceHistoryEntry: PriceHistory = {
    price: newPrice,
    date: now,
    changeAmount,
    changePercentage,
    reason,
    changedBy
  };

  return priceHistoryEntry;
}

/**
 * Get price change summary for a property
 */
export function getPriceChangeSummary(property: Property): {
  currentPrice: number;
  originalPrice: number;
  totalChange: number;
  totalChangePercentage: number;
  numberOfChanges: number;
  lastChangeDate: string | null;
  priceIncreases: number;
  priceDecreases: number;
} {
  if (!property.priceHistory || property.priceHistory.length === 0) {
    return {
      currentPrice: property.price || 0,
      originalPrice: property.price || 0,
      totalChange: 0,
      totalChangePercentage: 0,
      numberOfChanges: 0,
      lastChangeDate: null,
      priceIncreases: 0,
      priceDecreases: 0
    };
  }

  const currentPrice = property.price || 0;
  const originalPrice = property.priceHistory[0].price;
  const totalChange = currentPrice - originalPrice;
  const totalChangePercentage = originalPrice > 0 ? ((totalChange / originalPrice) * 100) : 0;

  const priceIncreases = property.priceHistory.filter(h => h.changeAmount > 0).length;
  const priceDecreases = property.priceHistory.filter(h => h.changeAmount < 0).length;

  return {
    currentPrice,
    originalPrice,
    totalChange,
    totalChangePercentage,
    numberOfChanges: property.priceHistory.length - 1, // Exclude initial price
    lastChangeDate: property.priceHistory[property.priceHistory.length - 1]?.date || null,
    priceIncreases,
    priceDecreases
  };
}

// ============================================================================
// MARKET TRENDS ANALYSIS
// ============================================================================

/**
 * Calculate average price per square foot/yard for property type
 */
export function getAveragePricePerUnit(
  propertyType?: 'house' | 'apartment' | 'commercial' | 'land',
  city?: string,
  areaUnit?: string
): {
  averagePricePerUnit: number;
  medianPricePerUnit: number;
  sampleSize: number;
  unit: string;
} {
  const allProperties = getProperties();
  
  let filteredProperties = allProperties.filter((p: Property) => 
    p.status === 'sold' || p.status === 'available'
  );

  if (propertyType) {
    filteredProperties = filteredProperties.filter((p: Property) => p.propertyType === propertyType);
  }

  if (city) {
    filteredProperties = filteredProperties.filter((p: Property) => 
      p.city?.toLowerCase() === city.toLowerCase()
    );
  }

  if (areaUnit) {
    filteredProperties = filteredProperties.filter((p: Property) => p.areaUnit === areaUnit);
  }

  if (filteredProperties.length === 0) {
    return {
      averagePricePerUnit: 0,
      medianPricePerUnit: 0,
      sampleSize: 0,
      unit: areaUnit || 'sq-yards'
    };
  }

  // Calculate price per unit for each property
  const pricesPerUnit = filteredProperties
    .filter((p: Property) => p.area > 0 && (p.price || 0) > 0)
    .map((p: Property) => (p.price || 0) / p.area);

  if (pricesPerUnit.length === 0) {
    return {
      averagePricePerUnit: 0,
      medianPricePerUnit: 0,
      sampleSize: 0,
      unit: areaUnit || 'sq-yards'
    };
  }

  const average = pricesPerUnit.reduce((sum, price) => sum + price, 0) / pricesPerUnit.length;
  
  // Calculate median
  const sorted = [...pricesPerUnit].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  return {
    averagePricePerUnit: Math.round(average),
    medianPricePerUnit: Math.round(median),
    sampleSize: pricesPerUnit.length,
    unit: areaUnit || 'sq-yards'
  };
}

/**
 * Get price trends over time (monthly)
 */
export function getPriceTrends(
  months: number = 12,
  propertyType?: 'house' | 'apartment' | 'commercial' | 'land',
  city?: string
): Array<{
  month: string;
  averagePrice: number;
  medianPrice: number;
  count: number;
  averagePricePerUnit: number;
}> {
  const allProperties = getProperties();
  const today = new Date();
  const cutoffDate = new Date();
  cutoffDate.setMonth(today.getMonth() - months);

  let filteredProperties = allProperties.filter((p: Property) => {
    const createdDate = new Date(p.createdAt);
    return createdDate >= cutoffDate && (p.status === 'sold' || p.status === 'available');
  });

  if (propertyType) {
    filteredProperties = filteredProperties.filter((p: Property) => p.propertyType === propertyType);
  }

  if (city) {
    filteredProperties = filteredProperties.filter((p: Property) => 
      p.city?.toLowerCase() === city.toLowerCase()
    );
  }

  // Group by month
  const monthlyData: { [key: string]: Property[] } = {};
  
  filteredProperties.forEach((p: Property) => {
    const month = new Date(p.createdAt).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = [];
    }
    monthlyData[month].push(p);
  });

  // Calculate statistics for each month
  const trends = Object.entries(monthlyData)
    .map(([month, properties]) => {
      const prices = properties.map((p: Property) => p.price || 0).filter(p => p > 0);
      const pricesPerUnit = properties
        .filter((p: Property) => p.area > 0 && (p.price || 0) > 0)
        .map((p: Property) => (p.price || 0) / p.area);

      const averagePrice = prices.length > 0
        ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
        : 0;

      const sortedPrices = [...prices].sort((a, b) => a - b);
      const medianPrice = sortedPrices.length > 0
        ? sortedPrices.length % 2 === 0
          ? Math.round((sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2)
          : sortedPrices[Math.floor(sortedPrices.length / 2)]
        : 0;

      const averagePricePerUnit = pricesPerUnit.length > 0
        ? Math.round(pricesPerUnit.reduce((sum, p) => sum + p, 0) / pricesPerUnit.length)
        : 0;

      return {
        month,
        averagePrice,
        medianPrice,
        count: properties.length,
        averagePricePerUnit
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  return trends;
}

/**
 * Get market velocity metrics
 * How fast are properties selling?
 */
export function getMarketVelocity(
  propertyType?: 'house' | 'apartment' | 'commercial' | 'land',
  city?: string
): {
  averageDaysToSell: number;
  medianDaysToSell: number;
  inventoryTurnover: number; // Properties sold / total properties
  absorptionRate: number; // Properties sold per month
  sampleSize: number;
} {
  const allProperties = getProperties();
  
  let soldProperties = allProperties.filter((p: Property) => p.status === 'sold' && p.soldDate);

  if (propertyType) {
    soldProperties = soldProperties.filter((p: Property) => p.propertyType === propertyType);
  }

  if (city) {
    soldProperties = soldProperties.filter((p: Property) => 
      p.city?.toLowerCase() === city.toLowerCase()
    );
  }

  if (soldProperties.length === 0) {
    return {
      averageDaysToSell: 0,
      medianDaysToSell: 0,
      inventoryTurnover: 0,
      absorptionRate: 0,
      sampleSize: 0
    };
  }

  // Calculate days to sell for each property
  const daysToSell = soldProperties.map((p: Property) => {
    const listedDate = new Date(p.listedDate || p.createdAt);
    const soldDate = new Date(p.soldDate!);
    const diffTime = Math.abs(soldDate.getTime() - listedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  const averageDaysToSell = Math.round(
    daysToSell.reduce((sum, days) => sum + days, 0) / daysToSell.length
  );

  const sortedDays = [...daysToSell].sort((a, b) => a - b);
  const medianDaysToSell = sortedDays.length % 2 === 0
    ? Math.round((sortedDays[sortedDays.length / 2 - 1] + sortedDays[sortedDays.length / 2]) / 2)
    : sortedDays[Math.floor(sortedDays.length / 2)];

  // Calculate inventory turnover
  let totalProperties = allProperties.length;
  if (propertyType) {
    totalProperties = allProperties.filter((p: Property) => p.propertyType === propertyType).length;
  }
  if (city) {
    totalProperties = allProperties.filter((p: Property) => 
      p.city?.toLowerCase() === city.toLowerCase()
    ).length;
  }

  const inventoryTurnover = totalProperties > 0 ? soldProperties.length / totalProperties : 0;

  // Calculate absorption rate (properties sold per month in last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  const recentSales = soldProperties.filter((p: Property) => {
    const soldDate = new Date(p.soldDate!);
    return soldDate >= twelveMonthsAgo;
  });

  const absorptionRate = recentSales.length / 12; // Properties per month

  return {
    averageDaysToSell,
    medianDaysToSell,
    inventoryTurnover: parseFloat((inventoryTurnover * 100).toFixed(2)),
    absorptionRate: parseFloat(absorptionRate.toFixed(2)),
    sampleSize: soldProperties.length
  };
}

/**
 * Get price distribution for a property type
 */
export function getPriceDistribution(
  propertyType?: 'house' | 'apartment' | 'commercial' | 'land',
  city?: string
): Array<{
  range: string;
  count: number;
  percentage: number;
  minPrice: number;
  maxPrice: number;
}> {
  const allProperties = getProperties();
  
  let filteredProperties = allProperties.filter((p: Property) => 
    (p.status === 'sold' || p.status === 'available') && (p.price || 0) > 0
  );

  if (propertyType) {
    filteredProperties = filteredProperties.filter((p: Property) => p.propertyType === propertyType);
  }

  if (city) {
    filteredProperties = filteredProperties.filter((p: Property) => 
      p.city?.toLowerCase() === city.toLowerCase()
    );
  }

  if (filteredProperties.length === 0) {
    return [];
  }

  // Define price ranges (in PKR)
  const ranges = [
    { label: 'Under 5M', min: 0, max: 5000000 },
    { label: '5M - 10M', min: 5000000, max: 10000000 },
    { label: '10M - 20M', min: 10000000, max: 20000000 },
    { label: '20M - 50M', min: 20000000, max: 50000000 },
    { label: '50M - 100M', min: 50000000, max: 100000000 },
    { label: 'Over 100M', min: 100000000, max: Infinity }
  ];

  const distribution = ranges.map(range => {
    const count = filteredProperties.filter((p: Property) => {
      const price = p.price || 0;
      return price >= range.min && price < range.max;
    }).length;

    const percentage = (count / filteredProperties.length) * 100;

    return {
      range: range.label,
      count,
      percentage: parseFloat(percentage.toFixed(2)),
      minPrice: range.min,
      maxPrice: range.max === Infinity ? range.max : range.max
    };
  });

  return distribution.filter(d => d.count > 0);
}

/**
 * Get market statistics summary
 */
export function getMarketStatistics(
  propertyType?: 'house' | 'apartment' | 'commercial' | 'land',
  city?: string
): {
  totalListings: number;
  activeListings: number;
  soldProperties: number;
  averagePrice: number;
  medianPrice: number;
  highestPrice: number;
  lowestPrice: number;
  averagePricePerUnit: number;
  marketVelocity: ReturnType<typeof getMarketVelocity>;
  priceRange: {
    min: number;
    max: number;
    spread: number;
  };
} {
  const allProperties = getProperties();
  
  let filteredProperties = allProperties;

  if (propertyType) {
    filteredProperties = filteredProperties.filter((p: Property) => p.propertyType === propertyType);
  }

  if (city) {
    filteredProperties = filteredProperties.filter((p: Property) => 
      p.city?.toLowerCase() === city.toLowerCase()
    );
  }

  const activeListings = filteredProperties.filter((p: Property) => 
    p.status === 'available' && p.isPublished
  ).length;

  const soldProperties = filteredProperties.filter((p: Property) => p.status === 'sold').length;

  const prices = filteredProperties
    .map((p: Property) => p.price || 0)
    .filter(p => p > 0);

  const averagePrice = prices.length > 0
    ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
    : 0;

  const sortedPrices = [...prices].sort((a, b) => a - b);
  const medianPrice = sortedPrices.length > 0
    ? sortedPrices.length % 2 === 0
      ? Math.round((sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2)
      : sortedPrices[Math.floor(sortedPrices.length / 2)]
    : 0;

  const highestPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : 0;
  const lowestPrice = sortedPrices.length > 0 ? sortedPrices[0] : 0;

  const pricePerUnitData = getAveragePricePerUnit(propertyType, city);
  const velocity = getMarketVelocity(propertyType, city);

  return {
    totalListings: filteredProperties.length,
    activeListings,
    soldProperties,
    averagePrice,
    medianPrice,
    highestPrice,
    lowestPrice,
    averagePricePerUnit: pricePerUnitData.averagePricePerUnit,
    marketVelocity: velocity,
    priceRange: {
      min: lowestPrice,
      max: highestPrice,
      spread: highestPrice - lowestPrice
    }
  };
}

/**
 * Compare property price to market average
 */
export function compareToMarket(property: Property): {
  marketAverage: number;
  priceDifference: number;
  percentageDifference: number;
  status: 'above-market' | 'at-market' | 'below-market';
  recommendation: string;
} {
  const marketStats = getMarketStatistics(property.propertyType, property.city);
  const propertyPrice = property.price || 0;
  const marketAverage = marketStats.averagePrice;
  
  const priceDifference = propertyPrice - marketAverage;
  const percentageDifference = marketAverage > 0 
    ? ((priceDifference / marketAverage) * 100)
    : 0;

  let status: 'above-market' | 'at-market' | 'below-market';
  let recommendation: string;

  if (percentageDifference > 10) {
    status = 'above-market';
    recommendation = 'Property is priced above market average. Consider price reduction to increase interest.';
  } else if (percentageDifference < -10) {
    status = 'below-market';
    recommendation = 'Property is priced below market average. You may be leaving money on the table.';
  } else {
    status = 'at-market';
    recommendation = 'Property is competitively priced at market average.';
  }

  return {
    marketAverage,
    priceDifference,
    percentageDifference: parseFloat(percentageDifference.toFixed(2)),
    status,
    recommendation
  };
}

/**
 * Get pricing recommendations based on market trends
 */
export function getPricingRecommendation(property: Property): {
  suggestedPrice: number;
  confidence: 'high' | 'medium' | 'low';
  factors: string[];
  priceRange: {
    min: number;
    max: number;
  };
} {
  const marketStats = getMarketStatistics(property.propertyType, property.city);
  const pricePerUnitData = getAveragePricePerUnit(property.propertyType, property.city, property.areaUnit);
  const velocity = getMarketVelocity(property.propertyType, property.city);
  
  const factors: string[] = [];
  
  // Calculate suggested price based on market average price per unit
  let suggestedPrice = pricePerUnitData.averagePricePerUnit * property.area;
  
  // Adjust based on property condition
  if (property.propertyCondition === 'excellent') {
    suggestedPrice *= 1.1; // 10% premium
    factors.push('Excellent condition (+10%)');
  } else if (property.propertyCondition === 'needs-work') {
    suggestedPrice *= 0.9; // 10% discount
    factors.push('Needs work (-10%)');
  }
  
  // Adjust based on market velocity
  if (velocity.averageDaysToSell < 30) {
    suggestedPrice *= 1.05; // Hot market, 5% premium
    factors.push('Hot market - fast sales (+5%)');
  } else if (velocity.averageDaysToSell > 180) {
    suggestedPrice *= 0.95; // Slow market, 5% discount
    factors.push('Slow market - price competitively (-5%)');
  }
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';
  if (pricePerUnitData.sampleSize >= 20) {
    confidence = 'high';
  } else if (pricePerUnitData.sampleSize >= 10) {
    confidence = 'medium';
  } else {
    confidence = 'low';
    factors.push('Limited market data - use with caution');
  }
  
  // Calculate price range (±10% of suggested price)
  const priceRange = {
    min: Math.round(suggestedPrice * 0.9),
    max: Math.round(suggestedPrice * 1.1)
  };
  
  return {
    suggestedPrice: Math.round(suggestedPrice),
    confidence,
    factors,
    priceRange
  };
}

/**
 * Get market trend direction
 */
export function getMarketTrendDirection(
  months: number = 6,
  propertyType?: 'house' | 'apartment' | 'commercial' | 'land',
  city?: string
): {
  trend: 'rising' | 'falling' | 'stable';
  changePercentage: number;
  strength: 'strong' | 'moderate' | 'weak';
} {
  const trends = getPriceTrends(months, propertyType, city);
  
  if (trends.length < 2) {
    return {
      trend: 'stable',
      changePercentage: 0,
      strength: 'weak'
    };
  }
  
  const firstMonthAvg = trends[0].averagePrice;
  const lastMonthAvg = trends[trends.length - 1].averagePrice;
  
  const changePercentage = firstMonthAvg > 0
    ? ((lastMonthAvg - firstMonthAvg) / firstMonthAvg) * 100
    : 0;
  
  let trend: 'rising' | 'falling' | 'stable';
  let strength: 'strong' | 'moderate' | 'weak';
  
  const absChange = Math.abs(changePercentage);
  
  if (changePercentage > 5) {
    trend = 'rising';
  } else if (changePercentage < -5) {
    trend = 'falling';
  } else {
    trend = 'stable';
  }
  
  if (absChange > 15) {
    strength = 'strong';
  } else if (absChange > 5) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }
  
  return {
    trend,
    changePercentage: parseFloat(changePercentage.toFixed(2)),
    strength
  };
}
