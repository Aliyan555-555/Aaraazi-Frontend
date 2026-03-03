/**
 * Property validations - Zod schemas for property forms.
 */

export {
  PropertyFormSchema,
  PropertyStep1Schema,
  PropertyStep2Schema,
  PropertyStep3Schema,
  propertyFormDefaultValues,
  validatePropertyStep,
} from './property-form.validation';

export type {
  PropertyFormValues,
  PropertyStep1Values,
  PropertyStep2Values,
  PropertyStep3Values,
} from './property-form.validation';
