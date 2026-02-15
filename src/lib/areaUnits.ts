
import { AreaUnit } from "../types/properties";

const CONVERSION_TO_SQ_FEET: Record<AreaUnit, number> = {
  "sq-feet": 1,
  sqft: 1, // Alias
  "sq-yards": 9, // 1 sq yard = 9 sq feet
  sqyards: 9, // Alias
  marla: 272.25, // 1 Marla = 272.25 sq feet (30.25 sq yards)
  kanal: 5445, // 1 Kanal = 20 Marlas = 5,445 sq feet
  acres: 43560, // 1 Acre = 43,560 sq feet
  // Uppercase Enum Values
  SQFT: 1,
  SQMETER: 10.7639,
  SQYARDS: 9,
  MARLA: 272.25,
  KANAL: 5445,
  ACRE: 43560,
  HECTARE: 107639,
};

/**
 * Convert area from one unit to another
 *
 * @param value - The area value to convert
 * @param from - Source unit
 * @param to - Target unit
 * @returns Converted area value
 *
 * @example
 * convertArea(5, 'marla', 'sq-feet') // Returns 1361.25
 * convertArea(1, 'kanal', 'marla') // Returns 20
 */
export function convertArea(
  value: number,
  from: AreaUnit,
  to: AreaUnit,
): number {
  // Convert to square feet first
  const sqFeet = value * CONVERSION_TO_SQ_FEET[from];

  // Convert from square feet to target unit
  const result = sqFeet / CONVERSION_TO_SQ_FEET[to];

  // Round to 2 decimal places
  return Math.round(result * 100) / 100;
}

/**
 * Format area value with unit for display
 *
 * @param value - Area value
 * @param unit - Area unit
 * @param showUnit - Whether to show the unit label (default: true)
 * @returns Formatted string
 *
 * @example
 * formatArea(5, 'marla') // Returns "5 Marla"
 * formatArea(1200, 'sq-feet') // Returns "1,200 sq ft"
 */
export function formatArea(
  value: number | undefined | null,
  unit: AreaUnit | string | undefined | null,
  showUnit: boolean = true,
): string {
  // Handle undefined/null values
  if (!value || value <= 0 || !unit) {
    return "N/A";
  }

  // Format number with Pakistani locale
  const formatted = value.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (!showUnit) return formatted;

  // Handle both old format (sqft, sqyards) and new format (sq-feet, sq-yards)
  const normalizedUnit = (unit as string)
    .replace("sqft", "sq-feet")
    .replace("sqyards", "sq-yards") as AreaUnit;

  const unitLabels: Record<AreaUnit | string, string> = {
    "sq-feet": "sq ft",
    sqft: "sq ft",
    "sq-yards": "sq yards",
    sqyards: "sq yards",
    marla: "Marla",
    kanal: "Kanal",
    acres: "Acres",
  };

  return `${formatted} ${unitLabels[normalizedUnit] || unit}`;
}

/**
 * Get area unit options for dropdowns/selects
 *
 * @returns Array of unit options with labels
 */
export function getAreaUnitOptions(): Array<{
  value: AreaUnit;
  label: string;
  description?: string;
}> {
  return [
    {
      value: "marla",
      label: "Marla",
      description: "272.25 sq ft (30.25 sq yards)",
    },
    {
      value: "kanal",
      label: "Kanal",
      description: "20 Marla (5,445 sq ft)",
    },
    {
      value: "sq-yards",
      label: "Square Yards",
      description: "Common for residential",
    },
    {
      value: "sq-feet",
      label: "Square Feet",
      description: "Common for apartments",
    },
    {
      value: "acres",
      label: "Acres",
      description: "For large land parcels",
    },
  ];
}

/**
 * Get default area unit based on property type
 *
 * @param propertyType - Type of property
 * @returns Recommended default unit
 */
export function getDefaultAreaUnit(propertyType: string): AreaUnit {
  switch (propertyType) {
    case "house":
      return "marla"; // Houses commonly measured in Marla
    case "apartment":
      return "sq-feet"; // Apartments in sq feet
    case "commercial":
      return "sq-feet"; // Commercial in sq feet
    case "land":
      return "kanal"; // Land in Kanal or Acres
    default:
      return "sq-yards"; // Default fallback
  }
}

/**
 * Validate area value for a given unit
 *
 * @param value - Area value to validate
 * @param unit - Area unit
 * @returns Validation result with error message if invalid
 */
export function validateArea(
  value: number,
  unit: AreaUnit,
): { valid: boolean; error?: string } {
  if (!value || value <= 0) {
    return { valid: false, error: "Area must be greater than 0" };
  }

  // Set reasonable maximum limits per unit
  const maxLimits: Record<AreaUnit, number> = {
    "sq-feet": 1000000, // Max 1 million sq ft
    sqft: 1000000, // Alias
    "sq-yards": 100000, // Max 100,000 sq yards
    sqyards: 100000, // Alias
    marla: 5000, // Max 5,000 Marla
    kanal: 250, // Max 250 Kanal
    acres: 1000, // Max 1,000 acres
    // Uppercase Enum Values
    SQFT: 1000000,
    SQMETER: 100000,
    SQYARDS: 100000,
    MARLA: 5000,
    KANAL: 250,
    ACRE: 1000,
    HECTARE: 400,
  };

  if (value > maxLimits[unit]) {
    return {
      valid: false,
      error: `Area cannot exceed ${maxLimits[unit].toLocaleString()} ${unit}`,
    };
  }

  return { valid: true };
}

/**
 * Convert and format area for comparison display
 * Shows original value + converted value in parentheses
 *
 * @param value - Area value
 * @param unit - Current unit
 * @param compareUnit - Unit to compare against (optional)
 * @returns Formatted comparison string
 *
 * @example
 * formatAreaWithConversion(5, 'marla', 'sq-yards')
 * // Returns "5 Marla (151.25 sq yards)"
 */
export function formatAreaWithConversion(
  value: number,
  unit: AreaUnit,
  compareUnit?: AreaUnit,
): string {
  const primaryFormat = formatArea(value, unit);

  if (!compareUnit || unit === compareUnit) {
    return primaryFormat;
  }

  const converted = convertArea(value, unit, compareUnit);
  const convertedFormat = formatArea(converted, compareUnit);

  return `${primaryFormat} (${convertedFormat})`;
}

/**
 * Get area range suggestions for property type
 * Helps users understand typical area ranges
 *
 * @param propertyType - Type of property
 * @returns Suggested min and max area with unit
 */
export function getAreaRangeSuggestions(propertyType: string): {
  min: number;
  max: number;
  unit: AreaUnit;
  description: string;
} {
  switch (propertyType) {
    case "house":
      return {
        min: 3,
        max: 20,
        unit: "marla",
        description: "Typical house: 3-20 Marla",
      };
    case "apartment":
      return {
        min: 800,
        max: 3000,
        unit: "sq-feet",
        description: "Typical apartment: 800-3,000 sq ft",
      };
    case "commercial":
      return {
        min: 500,
        max: 10000,
        unit: "sq-feet",
        description: "Typical commercial: 500-10,000 sq ft",
      };
    case "land":
      return {
        min: 1,
        max: 10,
        unit: "kanal",
        description: "Typical plot: 1-10 Kanal",
      };
    default:
      return {
        min: 100,
        max: 500,
        unit: "sq-yards",
        description: "Typical property: 100-500 sq yards",
      };
  }
}

/**
 * Alias for formatArea for display purposes
 * Formats area value with unit for display in UI components
 */
export const formatAreaDisplay = formatArea;
