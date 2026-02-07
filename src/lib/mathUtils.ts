/**
 * Mathematical Utilities
 * Safe math operations with edge case handling
 */

/**
 * Safe division that handles division by zero
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  defaultValue: number = 0
): number {
  if (denominator === 0 || !isFinite(denominator)) {
    return defaultValue;
  }
  
  const result = numerator / denominator;
  return isFinite(result) ? result : defaultValue;
}

/**
 * Safe percentage calculation
 */
export function safePercentage(
  part: number,
  whole: number,
  defaultValue: number = 0
): number {
  return safeDivide(part, whole, defaultValue) * 100;
}

/**
 * Safe ROI calculation
 */
export function safeROI(
  profit: number,
  investment: number,
  defaultValue: number = 0
): number {
  return safePercentage(profit, investment, defaultValue);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (!isFinite(value)) {
    return '0';
  }
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Safe sum of array
 */
export function safeSum(values: number[]): number {
  return values.reduce((sum, val) => {
    const num = Number(val);
    return sum + (isFinite(num) ? num : 0);
  }, 0);
}

/**
 * Safe average
 */
export function safeAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  
  const sum = safeSum(values);
  return safeDivide(sum, values.length);
}

/**
 * Check if number is valid (not NaN, null, undefined, or Infinity)
 */
export function isValidNumber(value: any): boolean {
  return (
    typeof value === 'number' &&
    isFinite(value) &&
    !isNaN(value)
  );
}

/**
 * Ensure number is valid, return default if not
 */
export function ensureNumber(value: any, defaultValue: number = 0): number {
  if (isValidNumber(value)) {
    return value;
  }
  return defaultValue;
}
