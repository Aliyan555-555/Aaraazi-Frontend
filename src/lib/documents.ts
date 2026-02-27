/**
 * Document Generation Library
 * Handles document creation, storage, and retrieval (Zustand – useGeneratedDocumentsStore)
 */

import { GeneratedDocument, DocumentType, DocumentDetails, DocumentClause, DEFAULT_CLAUSES } from '../types/documents';
import { Property } from '../types';
import { logger } from './logger';
import { useGeneratedDocumentsStore } from '@/store/useGeneratedDocumentsStore';

/**
 * Get all generated documents (from Zustand store; returns [] during SSR)
 */
export function getGeneratedDocuments(): GeneratedDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    return useGeneratedDocumentsStore.getState().documents ?? [];
  } catch (error) {
    logger.error('Error loading generated documents:', error);
    return [];
  }
}

/**
 * Save generated document
 */
export function saveGeneratedDocument(document: GeneratedDocument): void {
  try {
    useGeneratedDocumentsStore.getState().addDocument(document);
  } catch (error) {
    logger.error('Error saving document:', error);
    throw error;
  }
}

/**
 * Get documents for a specific property
 */
export function getDocumentsByProperty(propertyId: string): GeneratedDocument[] {
  const allDocuments = getGeneratedDocuments();
  return allDocuments.filter(doc => doc.propertyId === propertyId);
}

/**
 * Get documents for a specific transaction
 */
export function getDocumentsByTransaction(transactionId: string): GeneratedDocument[] {
  const allDocuments = getGeneratedDocuments();
  return allDocuments.filter(doc => doc.transactionId === transactionId);
}

/**
 * Delete a generated document
 */
export function deleteGeneratedDocument(documentId: string): void {
  try {
    useGeneratedDocumentsStore.getState().removeDocument(documentId);
  } catch (error) {
    logger.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Get default clauses for a document type
 */
export function getDefaultClauses(documentType: DocumentType): DocumentClause[] {
  return JSON.parse(JSON.stringify(DEFAULT_CLAUSES[documentType] || []));
}

/**
 * Auto-fill document details from property and transaction
 */
export function autoFillFromDeal(
  property: Property,
  transaction: any,
  contacts: any[]
): Partial<DocumentDetails> {
  // Find buyer and seller from transaction
  const buyer = contacts.find(c => c.id === transaction?.buyerId);
  const seller = contacts.find(c => c.id === property?.currentOwnerId);
  
  return {
    // Seller Information
    sellerName: seller?.name || property?.agentName || '',
    sellerFatherName: seller?.fatherName || '',
    sellerCNIC: seller?.cnic || '',
    sellerAddress: seller?.address || '',
    
    // Buyer Information
    buyerName: buyer?.name || transaction?.buyerName || '',
    buyerFatherName: buyer?.fatherName || '',
    buyerCNIC: buyer?.cnic || '',
    buyerAddress: buyer?.address || '',
    
    // Property Information
    propertyAddress: property?.address || '',
    propertyType: property?.propertyType || '',
    propertySize: property?.area?.toString() || '',
    propertySizeUnit: property?.areaUnit || 'Sq. Yards',
    
    // Financial Details
    salePrice: transaction?.agreedPrice || property?.price || 0,
    tokenMoney: transaction?.tokenMoney || 0,
    remainingAmount: (transaction?.agreedPrice || property?.price || 0) - (transaction?.tokenMoney || 0),
    
    // Rental specific
    monthlyRent: property?.rentAmount || 0,
    securityDeposit: property?.securityDeposit || 0,
  };
}

/** Convert financial field (number | string) to number for formatting/API */
function toNum(v: number | string | undefined): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'number') return Number.isNaN(v) ? undefined : v;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return Number.isNaN(n) ? undefined : n;
}

/** Normalize details for API: ensure financial fields are numbers (handles partial strings like "0.") */
export function normalizeDetailsForApi(details: DocumentDetails): DocumentDetails {
  const out = { ...details };
  if (out.salePrice !== undefined) out.salePrice = toNum(out.salePrice) ?? 0;
  if (out.tokenMoney !== undefined) out.tokenMoney = toNum(out.tokenMoney) ?? 0;
  if (out.monthlyRent !== undefined) out.monthlyRent = toNum(out.monthlyRent) ?? 0;
  if (out.securityDeposit !== undefined) out.securityDeposit = toNum(out.securityDeposit) ?? 0;
  if (out.paymentAmount !== undefined) out.paymentAmount = toNum(out.paymentAmount) ?? 0;
  return out;
}

/**
 * Replace placeholders in clause content with actual data
 */
export function replacePlaceholders(content: string, details: DocumentDetails): string {
  let result = content;
  
  const replacements: Record<string, string> = {
    // Sales - Seller & Buyer
    '[SELLER_NAME]': details.sellerName || details.landlordName || details.ownerName || details.payeeName || '[SELLER_NAME]',
    '[SELLER_FATHER_NAME]': details.sellerFatherName || details.landlordFatherName || '[SELLER_FATHER_NAME]',
    '[SELLER_CNIC]': details.sellerCNIC || details.landlordCNIC || details.ownerCNIC || '[SELLER_CNIC]',
    '[SELLER_ADDRESS]': details.sellerAddress || details.landlordAddress || details.ownerAddress || '[SELLER_ADDRESS]',
    
    '[BUYER_NAME]': details.buyerName || details.tenantName || details.payerName || '[BUYER_NAME]',
    '[BUYER_FATHER_NAME]': details.buyerFatherName || details.tenantFatherName || '[BUYER_FATHER_NAME]',
    '[BUYER_CNIC]': details.buyerCNIC || details.tenantCNIC || '[BUYER_CNIC]',
    '[BUYER_ADDRESS]': details.buyerAddress || details.tenantAddress || '[BUYER_ADDRESS]',
    
    // Property Information
    '[PROPERTY_ADDRESS]': details.propertyAddress || '[PROPERTY_ADDRESS]',
    '[PROPERTY_TYPE]': details.propertyType || '[PROPERTY_TYPE]',
    '[PROPERTY_SIZE]': details.propertySize || '[PROPERTY_SIZE]',
    '[PROPERTY_UNIT]': details.propertySizeUnit || 'Sq. Yards',
    
    // Sales Financial (details may have string during typing, e.g. "0.")
    '[SALE_PRICE]': toNum(details.salePrice) != null ? formatPKR(toNum(details.salePrice)!) : '[SALE_PRICE]',
    '[TOKEN_MONEY]': toNum(details.tokenMoney) != null ? formatPKR(toNum(details.tokenMoney)!) : '[TOKEN_MONEY]',
    '[REMAINING_AMOUNT]': details.remainingAmount != null ? formatPKR(details.remainingAmount) : '[REMAINING_AMOUNT]',
    
    // Rental
    '[MONTHLY_RENT]': toNum(details.monthlyRent) != null ? formatPKR(toNum(details.monthlyRent)!) : '[MONTHLY_RENT]',
    '[SECURITY_DEPOSIT]': toNum(details.securityDeposit) != null ? formatPKR(toNum(details.securityDeposit)!) : '[SECURITY_DEPOSIT]',
    '[LEASE_PERIOD]': details.leasePeriod || '[LEASE_PERIOD]',
    
    // Payment Receipt
    '[PAYMENT_AMOUNT]': toNum(details.paymentAmount) != null ? formatPKR(toNum(details.paymentAmount)!) : '[PAYMENT_AMOUNT]',
    '[PAYMENT_DATE]': details.paymentDate || '[PAYMENT_DATE]',
    '[RECEIPT_NUMBER]': details.receiptNumber || '[RECEIPT_NUMBER]',
    '[PAYMENT_METHOD]': details.paymentMethod || '[PAYMENT_METHOD]',
    '[PAYMENT_PURPOSE]': details.paymentPurpose || '[PAYMENT_PURPOSE]',

    // Property Disclosure
    '[OWNERSHIP_STATUS]': details.ownershipStatus || '[OWNERSHIP_STATUS]',
    '[LEGAL_STATUS]': details.legalStatus || '[LEGAL_STATUS]',
    
    // Common
    '[DATE]': new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    '[START_DATE]': new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    '[NOTICE_PERIOD]': '30',
    '[SALE_PRICE_WORDS]': toNum(details.salePrice) != null ? numberToWords(toNum(details.salePrice)!) : '[SALE_PRICE_WORDS]',
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });
  
  return result;
}

/**
 * Format number as PKR
 */
function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('PKR', 'PKR ');
}

/**
 * Convert number to words (for legal documents)
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  }
  
  if (num < 1000) return convertLessThanThousand(num);
  if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convertLessThanThousand(thousands) + ' Thousand' + 
           (remainder !== 0 ? ' ' + convertLessThanThousand(remainder) : '');
  }
  if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return convertLessThanThousand(lakhs) + ' Lakh' + 
           (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
  }
  
  const crores = Math.floor(num / 10000000);
  const remainder = num % 10000000;
  return convertLessThanThousand(crores) + ' Crore' + 
         (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
}

/**
 * Generate document name from type and property
 */
export function generateDocumentName(
  documentType: DocumentType, 
  propertyAddress?: string, 
  buyerName?: string
): string {
  const typeNames: Record<DocumentType, string> = {
    'sales-agreement': 'Sales Agreement',
    'final-sale-deed': 'Sale Deed',
    'rental-agreement': 'Rental Agreement',
    'property-disclosure': 'Property Disclosure',
    'payment-receipt': 'Payment Receipt'
  };
  
  const parts = [typeNames[documentType]];
  
  if (propertyAddress) {
    // Extract short address (first part before comma)
    const shortAddress = propertyAddress.split(',')[0].trim();
    parts.push(shortAddress);
  }
  
  if (buyerName) {
    parts.push(buyerName);
  }
  
  parts.push(new Date().toLocaleDateString('en-GB').replace(/\//g, '-'));
  
  return parts.join(' - ');
}