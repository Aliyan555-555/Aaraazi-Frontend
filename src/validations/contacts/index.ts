/**
 * Contact validations - Zod schemas for contact forms.
 */

export {
  ContactFormSchema,
  ContactFormTypeSchema,
  contactFormDefaultValues,
  PK_PHONE_REGEX,
  CNIC_REGEX,
} from './contact-form.validation';

export type { ContactFormValues } from './contact-form.validation';
