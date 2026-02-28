/**
 * Document form validation – professional-grade rules for document creation forms.
 * - CNIC: format XXXXX-XXXXXXX-X (Pakistani CNIC)
 * - Names: letters and spaces only, no numbers or symbols
 * - Financial: positive numbers only, no letters
 */

import type { DocumentDetails } from '@/types/documents';
import type { DocumentType } from '@/types/documents';

// ---------------------------------------------------------------------------
// Error messages (consistent, user-facing)
// ---------------------------------------------------------------------------

export const DOC_FORM_MESSAGES = {
  required: (label: string) => `${label} is required`,
  invalidFormat: (label: string, hint?: string) =>
    hint ? `Invalid ${label}. ${hint}` : `Invalid ${label} format`,
  cnicFormat: 'CNIC must be in format XXXXX-XXXXXXX-X (e.g. 12345-1234567-1)',
  nameNoNumbersOrSymbols: 'Name can only contain letters and spaces',
  positiveNumberOnly: 'Enter a valid positive number only (no letters or symbols)',
  minValue: (label: string, min: number) => `${label} must be at least ${min}`,
  invalidDate: 'Please select a valid date',
} as const;

// ---------------------------------------------------------------------------
// CNIC – Pakistani format XXXXX-XXXXXXX-X
// ---------------------------------------------------------------------------

const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

/**
 * Format raw digits as user types into XXXXX-XXXXXXX-X.
 * Accepts digits only; inserts hyphens automatically.
 */
export function formatCNICInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

/**
 * Validate CNIC. Empty is valid (optional field).
 * When non-empty, must match XXXXX-XXXXXXX-X.
 */
export function validateCNIC(value: string | undefined, required: boolean): string | null {
  const v = (value ?? '').trim();
  if (!v) return required ? DOC_FORM_MESSAGES.required('CNIC') : null;
  if (!CNIC_REGEX.test(v)) return DOC_FORM_MESSAGES.cnicFormat;
  return null;
}

// ---------------------------------------------------------------------------
// Name – letters and spaces only (optional: allow hyphen/apostrophe for names)
// ---------------------------------------------------------------------------

/** Allow letters (any language), spaces, hyphen, apostrophe for names like O'Brien, Mary-Jane */
const NAME_REGEX = /^[\p{L}\s\-']+$/u;

/**
 * Sanitize name input: keep only letters, spaces, hyphen, apostrophe.
 * Use in onChange to prevent numbers/symbols.
 */
export function sanitizeNameInput(value: string): string {
  return value.replace(/[^\p{L}\s\-']/gu, '');
}

/**
 * Validate name field. Empty is invalid if required.
 */
export function validateName(
  value: string | undefined,
  required: boolean,
  fieldLabel: string = 'Name'
): string | null {
  const v = (value ?? '').trim();
  if (!v) return required ? DOC_FORM_MESSAGES.required(fieldLabel) : null;
  if (!NAME_REGEX.test(v)) return DOC_FORM_MESSAGES.nameNoNumbersOrSymbols;
  return null;
}

// ---------------------------------------------------------------------------
// Financial – positive numbers only
// ---------------------------------------------------------------------------

/**
 * Parse and sanitize financial input: only positive numbers.
 * Returns undefined for empty, number for valid, or keeps previous value on invalid.
 */
export function parsePositiveNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') {
    if (Number.isNaN(value) || value < 0) return undefined;
    return value;
  }
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  const num = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(num) || num < 0) return undefined;
  return num;
}

/**
 * Validate positive number. For required fields, 0 is valid.
 */
export function validatePositiveNumber(
  value: string | number | undefined,
  required: boolean,
  fieldLabel: string = 'Amount',
  min: number = 0
): string | null {
  if (value === undefined || value === null || value === '') {
    return required ? DOC_FORM_MESSAGES.required(fieldLabel) : null;
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(num)) return DOC_FORM_MESSAGES.positiveNumberOnly;
  if (num < 0) return DOC_FORM_MESSAGES.positiveNumberOnly;
  if (min > 0 && num < min) return DOC_FORM_MESSAGES.minValue(fieldLabel, min);
  return null;
}

/**
 * Restrict input to digits and one decimal point (for financial fields).
 * Use in onChange so user cannot type letters/symbols.
 */
export function sanitizeFinancialInput(value: string): string {
  const hasDecimal = value.includes('.');
  const allowed = value.replace(/[^0-9.]/g, '');
  if (!hasDecimal) return allowed;
  const [whole, frac] = allowed.split('.');
  return frac !== undefined ? `${whole}.${frac.slice(0, 2)}` : whole;
}

/**
 * Get the value to store for a financial field from user input.
 * Does not accept 0 as the first character (e.g. "0", "0.5" rejected; "05" normalized to "5").
 * Preserves partial input like "123." so user can type "123.45".
 */
export function getFinancialFieldValue(
  sanitized: string,
  previousValue: number | string | undefined
): number | string | undefined {
  if (sanitized === '') return undefined;
  // Reject "0" or "0." / "0.xx" – do not accept 0 as first character
  if (sanitized === '0' || sanitized.startsWith('0.')) return undefined;
  // Strip leading zeros from integer part: "05" -> "5", "0123" -> "123"
  let normalized = sanitized;
  if (sanitized.startsWith('0') && sanitized.length > 1 && sanitized[1] !== '.') {
    normalized = sanitized.replace(/^0+/, '') || '';
    if (normalized === '' || normalized.startsWith('.')) return undefined;
  }
  // Preserve partial input ending with "." so user can type "123.45"
  if (normalized.endsWith('.')) return normalized;
  const num = parsePositiveNumber(normalized);
  return num !== undefined ? num : (previousValue ?? undefined);
}

// ---------------------------------------------------------------------------
// Address / text (required only, no format)
// ---------------------------------------------------------------------------

export function validateRequired(value: string | undefined, fieldLabel: string): string | null {
  const v = (value ?? '').trim();
  return v ? null : DOC_FORM_MESSAGES.required(fieldLabel);
}

// ---------------------------------------------------------------------------
// Date (required, valid date)
// ---------------------------------------------------------------------------

export function validateDate(value: string | undefined, required: boolean): string | null {
  const v = (value ?? '').trim();
  if (!v) return required ? DOC_FORM_MESSAGES.required('Date') : null;
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return DOC_FORM_MESSAGES.invalidDate;
  return null;
}

// ---------------------------------------------------------------------------
// Full form validation per document type
// ---------------------------------------------------------------------------

export type DocumentDetailsErrors = Partial<Record<keyof DocumentDetails, string>>;

export function validateDocumentDetails(
  documentType: DocumentType,
  details: DocumentDetails
): DocumentDetailsErrors {
  const errors: DocumentDetailsErrors = {};

  switch (documentType) {
    case 'sales-agreement':
    case 'final-sale-deed': {
      const sellerNameErr = validateName(details.sellerName, true, "Seller's name");
      if (sellerNameErr) errors.sellerName = sellerNameErr;
      const sellerFatherErr = validateName(details.sellerFatherName, false, "Seller's father name");
      if (sellerFatherErr) errors.sellerFatherName = sellerFatherErr;
      const sellerCnicErr = validateCNIC(details.sellerCNIC, false);
      if (sellerCnicErr) errors.sellerCNIC = sellerCnicErr;

      const buyerNameErr = validateName(details.buyerName, true, "Buyer's name");
      if (buyerNameErr) errors.buyerName = buyerNameErr;
      const buyerFatherErr = validateName(details.buyerFatherName, false, "Buyer's father name");
      if (buyerFatherErr) errors.buyerFatherName = buyerFatherErr;
      const buyerCnicErr = validateCNIC(details.buyerCNIC, false);
      if (buyerCnicErr) errors.buyerCNIC = buyerCnicErr;

      const addrErr = validateRequired(details.propertyAddress, 'Property address');
      if (addrErr) errors.propertyAddress = addrErr;

      const salePriceErr = validatePositiveNumber(
        details.salePrice,
        true,
        'Sale price (PKR)',
        0
      );
      if (salePriceErr) errors.salePrice = salePriceErr;
      const tokenErr = validatePositiveNumber(details.tokenMoney, false, 'Token money (PKR)', 0);
      if (tokenErr) errors.tokenMoney = tokenErr;
      break;
    }

    case 'rental-agreement': {
      const landlordNameErr = validateName(details.landlordName, true, "Landlord's name");
      if (landlordNameErr) errors.landlordName = landlordNameErr;
      const landlordFatherErr = validateName(details.landlordFatherName, false, "Landlord's father name");
      if (landlordFatherErr) errors.landlordFatherName = landlordFatherErr;
      const landlordCnicErr = validateCNIC(details.landlordCNIC, false);
      if (landlordCnicErr) errors.landlordCNIC = landlordCnicErr;

      const tenantNameErr = validateName(details.tenantName, true, "Tenant's name");
      if (tenantNameErr) errors.tenantName = tenantNameErr;
      const tenantFatherErr = validateName(details.tenantFatherName, false, "Tenant's father name");
      if (tenantFatherErr) errors.tenantFatherName = tenantFatherErr;
      const tenantCnicErr = validateCNIC(details.tenantCNIC, false);
      if (tenantCnicErr) errors.tenantCNIC = tenantCnicErr;

      const addrErr = validateRequired(details.propertyAddress, 'Property address');
      if (addrErr) errors.propertyAddress = addrErr;

      const rentErr = validatePositiveNumber(details.monthlyRent, true, 'Monthly rent (PKR)', 0);
      if (rentErr) errors.monthlyRent = rentErr;
      const depositErr = validatePositiveNumber(details.securityDeposit, false, 'Security deposit (PKR)', 0);
      if (depositErr) errors.securityDeposit = depositErr;
      break;
    }

    case 'property-disclosure': {
      const ownerNameErr = validateName(details.ownerName, true, 'Owner name');
      if (ownerNameErr) errors.ownerName = ownerNameErr;
      const ownerCnicErr = validateCNIC(details.ownerCNIC, false);
      if (ownerCnicErr) errors.ownerCNIC = ownerCnicErr;
      const addrErr = validateRequired(details.propertyAddress, 'Property address');
      if (addrErr) errors.propertyAddress = addrErr;
      break;
    }

    case 'payment-receipt': {
      const receiptErr = validateRequired(details.receiptNumber, 'Receipt number');
      if (receiptErr) errors.receiptNumber = receiptErr;
      const dateErr = validateDate(details.paymentDate, true);
      if (dateErr) errors.paymentDate = dateErr;
      const amountErr = validatePositiveNumber(details.paymentAmount, true, 'Payment amount (PKR)', 0);
      if (amountErr) errors.paymentAmount = amountErr;

      const payerErr = validateName(details.payerName, true, 'Payer name');
      if (payerErr) errors.payerName = payerErr;
      const payeeErr = validateName(details.payeeName, true, 'Payee name');
      if (payeeErr) errors.payeeName = payeeErr;
      break;
    }

    default:
      break;
  }

  return errors;
}

/** Return first error message for toast / summary */
export function getFirstValidationError(errors: DocumentDetailsErrors): string | null {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? (errors[firstKey as keyof DocumentDetails] ?? null) : null;
}
