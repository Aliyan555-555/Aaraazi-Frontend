/**
 * Property Form Validation - Professional-grade Zod schemas
 * Multi-step validation aligned with PropertyForm wizard.
 * User-friendly error messages for Pakistani real estate context.
 */

import { z } from 'zod';

// ============================================================================
// Error message constants
// ============================================================================

export const PROPERTY_ERROR_MESSAGES = {
  propertyType: {
    required: 'Please select a property type',
  },
  owner: {
    required: 'Please select or add the property owner',
  },
  city: {
    required: 'Please select a city',
  },
  area: {
    required: 'Please select an area/locality',
    plotRequired: 'Plot number is required for this property type',
    buildingRequired: 'Building name is required for apartments and commercial properties',
    floorRequired: 'Floor number is required for this property type',
    unitRequired: 'Unit/apartment number is required for this property type',
  },
  propertyDetails: {
    areaRequired: 'Property area is required',
    areaPositive: 'Area must be greater than 0',
    areaInvalid: 'Please enter a valid area (numbers only)',
    unitRequired: 'Please select an area unit',
    bedroomsInvalid: 'Bedrooms must be 0 or a positive whole number',
    bathroomsInvalid: 'Bathrooms must be 0 or a positive whole number',
    floorInvalid: 'Floor number must be 0 or a positive whole number',
    yearInvalid: 'Please enter a valid construction year (1900–2030)',
    yearRange: 'Construction year must be between 1900 and current year',
  },
} as const;

// ============================================================================
// Enums & shared schemas
// ============================================================================

export const PropertyTypeSchema = z.enum(
  ['house', 'apartment', 'plot', 'commercial', 'land', 'industrial'],
  {
    error: () => PROPERTY_ERROR_MESSAGES.propertyType.required,
  }
);

export const AreaUnitSchema = z.enum(
  ['sqft', 'sqyards', 'marla', 'kanal'],
  {
    error: () => PROPERTY_ERROR_MESSAGES.propertyDetails.unitRequired,
  }
);

/** Required string (non-empty after trim) */
const requiredString = (message: string) =>
  z.string().trim().min(1, message);

// ============================================================================
// Step 1: Property Type
// ============================================================================

export const PropertyStep1Schema = z.object({
  propertyType: PropertyTypeSchema,
});

export type PropertyStep1Values = z.infer<typeof PropertyStep1Schema>;

// ============================================================================
// Step 2: Owner & Location (with conditional address fields)
// ============================================================================

const Step2BaseSchema = z.object({
  propertyType: z.string().optional(), // Needed for conditional validation
  currentOwnerId: z.string().optional(),
  currentOwnerName: z.string().optional(),
  cityId: requiredString(PROPERTY_ERROR_MESSAGES.city.required),
  areaId: requiredString(PROPERTY_ERROR_MESSAGES.area.required),
  blockId: z.string().optional(),
  buildingId: z.string().optional(),
  plotNumber: z.string().optional(),
  floorNumber: z.string().optional(),
  unitNumber: z.string().optional(),
});

export const PropertyStep2Schema = Step2BaseSchema.superRefine((data, ctx) => {
  // Owner: require either ID (linked contact) or name (e.g. from API on edit)
  const hasOwner =
    (data.currentOwnerId && data.currentOwnerId.trim() !== '') ||
    (data.currentOwnerName && data.currentOwnerName.trim() !== '');
  if (!hasOwner) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: PROPERTY_ERROR_MESSAGES.owner.required,
      path: ['currentOwnerId'],
    });
  }

  // Skip conditional address checks if propertyType not yet selected
  if (!data.propertyType) return;
  const type = data.propertyType ?? '';
  const needsPlot = ['plot', 'land', 'house'].includes(type);
  const needsBuilding = ['apartment', 'commercial'].includes(type);

  if (needsPlot && (!data.plotNumber || data.plotNumber.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: PROPERTY_ERROR_MESSAGES.area.plotRequired,
      path: ['plotNumber'],
    });
  }

  if (needsBuilding) {
    if (!data.buildingId || data.buildingId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PROPERTY_ERROR_MESSAGES.area.buildingRequired,
        path: ['buildingId'],
      });
    }
    if (!data.floorNumber || data.floorNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PROPERTY_ERROR_MESSAGES.area.floorRequired,
        path: ['floorNumber'],
      });
    }
    if (!data.unitNumber || data.unitNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PROPERTY_ERROR_MESSAGES.area.unitRequired,
        path: ['unitNumber'],
      });
    }
  }
});

export type PropertyStep2Values = z.infer<typeof PropertyStep2Schema>;

// ============================================================================
// Step 3: Property Details
// ============================================================================

const currentYear = new Date().getFullYear();

/** Optional non-negative integer (bedrooms, bathrooms, floor) */
const optionalNonNegativeInt = z
  .string()
  .optional()
  .refine(
    (v) => {
      if (!v || v.trim() === '') return true;
      const n = parseInt(v, 10);
      return !isNaN(n) && Number.isInteger(n) && n >= 0;
    },
    { message: 'Must be 0 or a positive whole number' }
  );

/** Optional construction year (1900–current year) */
const optionalConstructionYear = z
  .string()
  .optional()
  .refine(
    (v) => {
      if (!v || v.trim() === '') return true;
      const n = parseInt(v, 10);
      return (
        !isNaN(n) &&
        Number.isInteger(n) &&
        n >= 1900 &&
        n <= currentYear
      );
    },
    {
      message: PROPERTY_ERROR_MESSAGES.propertyDetails.yearRange,
    }
  );

export const PropertyStep3Schema = z.object({
  area: z
    .string()
    .min(1, PROPERTY_ERROR_MESSAGES.propertyDetails.areaRequired)
    .refine(
      (v) => {
        const n = parseFloat(v);
        return !isNaN(n) && n > 0;
      },
      { message: PROPERTY_ERROR_MESSAGES.propertyDetails.areaPositive }
    ),
  areaUnit: AreaUnitSchema,
  bedrooms: optionalNonNegativeInt,
  bathrooms: optionalNonNegativeInt,
  floor: optionalNonNegativeInt,
  constructionYear: optionalConstructionYear,
});

export type PropertyStep3Values = z.infer<typeof PropertyStep3Schema>;

// ============================================================================
// Full form schema (all steps combined, for type inference)
// ============================================================================

export const PropertyFormSchema = PropertyStep1Schema.merge(Step2BaseSchema)
  .merge(PropertyStep3Schema)
  .extend({
    features: z.array(z.string()).optional(),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
  });

export type PropertyFormValues = z.infer<typeof PropertyFormSchema>;

// ============================================================================
// Default values (matches PropertyFormData shape)
// ============================================================================

export const propertyFormDefaultValues = {
  propertyType: '',
  currentOwnerId: '',
  currentOwnerName: '',
  cityId: '',
  areaId: '',
  blockId: '',
  buildingId: '',
  plotNumber: '',
  floorNumber: '',
  unitNumber: '',
  area: '',
  areaUnit: 'sqft' as const,
  bedrooms: '',
  bathrooms: '',
  floor: '',
  constructionYear: '',
  features: [] as string[],
  description: '',
  images: [] as string[],
};

// ============================================================================
// Step validation helpers
// ============================================================================

export function validatePropertyStep(
  step: 1 | 2 | 3,
  data: Record<string, unknown>
): { success: true; data: unknown } | { success: false; errors: Record<string, string> } {
  const schema =
    step === 1 ? PropertyStep1Schema : step === 2 ? PropertyStep2Schema : PropertyStep3Schema;
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  });
  return { success: false, errors };
}
