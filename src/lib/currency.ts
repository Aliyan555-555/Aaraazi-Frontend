// Currency utilities for Pakistani Rupees (PKR)

export const formatCurrency = (amount: number | null | undefined): string => {
  // Handle edge cases
  if (amount === null || amount === undefined) {
    return 'Rs. 0';
  }
  
  if (typeof amount !== 'number') {
    const parsed = parseFloat(String(amount));
    if (isNaN(parsed)) {
      return 'Rs. 0';
    }
    amount = parsed;
  }
  
  // Handle negative amounts
  if (amount < 0) {
    return `-Rs. ${Math.abs(amount).toLocaleString('en-PK')}`;
  }
  
  // Handle very large numbers (avoid overflow)
  if (amount > Number.MAX_SAFE_INTEGER) {
    return 'Rs. ∞';
  }
  
  // Format in Pakistani style with commas and "Rs." prefix
  return `Rs. ${amount.toLocaleString('en-PK')}`;
};

// PKR formatting function for SaaS components
export const formatPKR = (amount: number | null | undefined): string => {
  try {
    // Handle edge cases
    if (amount === null || amount === undefined) {
      return 'PKR 0';
    }
    
    if (typeof amount !== 'number') {
      const parsed = parseFloat(String(amount));
      if (isNaN(parsed)) {
        return 'PKR 0';
      }
      amount = parsed;
    }
    
    // Handle negative amounts
    if (amount < 0) {
      return `-PKR ${Math.abs(amount).toLocaleString('en-PK')}`;
    }
    
    // Handle very large numbers (avoid overflow)
    if (amount > Number.MAX_SAFE_INTEGER) {
      return 'PKR ∞';
    }
    
    // Format with PKR prefix for SaaS components
    const formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    return formatter.format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `PKR ${amount?.toLocaleString() || '0'}`;
  }
};

export const formatCurrencyShort = (amount: number | null | undefined): string => {
  // Handle edge cases
  if (amount === null || amount === undefined) {
    return 'Rs. 0';
  }
  
  if (typeof amount !== 'number') {
    const parsed = parseFloat(String(amount));
    if (isNaN(parsed)) {
      return 'Rs. 0';
    }
    amount = parsed;
  }
  
  // Handle negative amounts
  const isNegative = amount < 0;
  amount = Math.abs(amount);
  
  // Handle very large numbers
  if (amount > Number.MAX_SAFE_INTEGER) {
    return `${isNegative ? '-' : ''}Rs. ∞`;
  }
  
  let result = '';
  
  // Format large amounts in Crores and Lakhs (Pakistani style)
  if (amount >= 10000000) { // 1 Crore or more
    const crores = amount / 10000000;
    result = `Rs. ${crores.toFixed(1)} Cr`;
  } else if (amount >= 100000) { // 1 Lakh or more
    const lakhs = amount / 100000;
    result = `Rs. ${lakhs.toFixed(1)} L`;
  } else {
    result = formatCurrency(amount);
  }
  
  return isNegative ? `-${result.replace('Rs. ', '')}` : result;
};

export const formatArea = (area: number | null | undefined, type: 'yards' | 'sqft'): string => {
  // Handle edge cases
  if (area === null || area === undefined) {
    return `0 ${type === 'yards' ? 'sq yards' : 'sq ft'}`;
  }
  
  if (typeof area !== 'number') {
    const parsed = parseFloat(String(area));
    if (isNaN(parsed)) {
      return `0 ${type === 'yards' ? 'sq yards' : 'sq ft'}`;
    }
    area = parsed;
  }
  
  // Handle negative areas
  if (area < 0) {
    area = 0;
  }
  
  // Handle very large numbers
  if (area > Number.MAX_SAFE_INTEGER) {
    return `∞ ${type === 'yards' ? 'sq yards' : 'sq ft'}`;
  }
  
  return `${area.toLocaleString()} ${type === 'yards' ? 'sq yards' : 'sq ft'}`;
};

// Commission rate formatting
export const formatCommissionRate = (rate: number): string => {
  return `${rate}%`;
};