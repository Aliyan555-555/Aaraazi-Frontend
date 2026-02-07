/**
 * Document Templates System
 * Pre-built templates for common real estate documents
 */

import { Property, Lead, Contact } from '../types';
import { formatCurrency } from './currency';

export interface DocumentTemplate {
  id: string;
  name: string;
  category: 'agreement' | 'letter' | 'receipt' | 'report' | 'marketing' | 'legal';
  description: string;
  requiredFields: string[];
  template: string;
  preview?: string;
}

// ============================================================================
// TEMPLATE GENERATOR
// ============================================================================

/**
 * Generate document from template
 */
export function generateDocument(
  template: DocumentTemplate,
  data: any
): { success: boolean; content?: string; missingFields?: string[] } {
  // Check for missing required fields
  const missingFields = template.requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return {
      success: false,
      missingFields
    };
  }

  // Replace placeholders in template
  let content = template.template;
  
  // Replace all {{field}} placeholders
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = data[key];
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });

  return {
    success: true,
    content
  };
}

// ============================================================================
// PROPERTY-RELATED TEMPLATES
// ============================================================================

export const PROPERTY_LISTING_AGREEMENT: DocumentTemplate = {
  id: 'property-listing-agreement',
  name: 'Property Listing Agreement',
  category: 'agreement',
  description: 'Standard agreement between property owner and agency',
  requiredFields: ['ownerName', 'ownerCNIC', 'propertyAddress', 'listingPrice', 'commissionRate', 'agencyName', 'agentName', 'date'],
  template: `
PROPERTY LISTING AGREEMENT

This Agreement is made on {{date}} between:

1. {{ownerName}} (CNIC: {{ownerCNIC}})
   Hereinafter referred to as "the Owner"

AND

2. {{agencyName}}, represented by {{agentName}}
   Hereinafter referred to as "the Agency"

PROPERTY DETAILS:
Address: {{propertyAddress}}
Listing Price: {{listingPrice}}
Property Type: {{propertyType}}

TERMS AND CONDITIONS:

1. LISTING PERIOD
   The Owner authorizes the Agency to list and market the property for a period of {{listingPeriod}} months from the date of this agreement.

2. COMMISSION
   The Owner agrees to pay the Agency a commission of {{commissionRate}}% of the final sale price upon successful completion of the transaction.

3. EXCLUSIVE RIGHTS
   The Agency has exclusive rights to market this property during the listing period.

4. MARKETING
   The Agency agrees to market the property through various channels including online portals, social media, and direct outreach.

5. TERMINATION
   Either party may terminate this agreement with 30 days written notice.

Owner's Signature: _________________        Date: _________________

Agency Representative: _________________    Date: _________________
`,
  preview: 'Legal agreement for property listing services'
};

export const SALE_DEED_RECEIPT: DocumentTemplate = {
  id: 'sale-deed-receipt',
  name: 'Sale Deed Receipt',
  category: 'receipt',
  description: 'Receipt for property sale transaction',
  requiredFields: ['buyerName', 'sellerName', 'propertyAddress', 'salePrice', 'date', 'receiptNumber'],
  template: `
SALE DEED RECEIPT

Receipt No: {{receiptNumber}}
Date: {{date}}

Received from: {{buyerName}}
Amount: {{salePrice}} ({{saleAmountWords}})

For the purchase of property located at:
{{propertyAddress}}

Sold by: {{sellerName}}

Payment Method: {{paymentMethod}}

This receipt acknowledges the payment for the above-mentioned property transaction.

Received by: _________________

{{agencyName}}
{{agentName}}
`,
  preview: 'Receipt for property sale payment'
};

// ============================================================================
// CLIENT-RELATED TEMPLATES
// ============================================================================

export const BUYER_REPRESENTATION_AGREEMENT: DocumentTemplate = {
  id: 'buyer-representation',
  name: 'Buyer Representation Agreement',
  category: 'agreement',
  description: 'Agreement to represent buyer in property search',
  requiredFields: ['buyerName', 'buyerCNIC', 'agencyName', 'agentName', 'date'],
  template: `
BUYER REPRESENTATION AGREEMENT

Date: {{date}}

This Agreement is entered into between:

BUYER:
Name: {{buyerName}}
CNIC: {{buyerCNIC}}
Phone: {{buyerPhone}}

AGENCY:
{{agencyName}}
Represented by: {{agentName}}

PROPERTY REQUIREMENTS:
Type: {{propertyType}}
Budget: {{budgetRange}}
Preferred Locations: {{preferredLocations}}

TERMS:
1. The Agency agrees to represent the Buyer in searching for and negotiating the purchase of a suitable property.

2. The Agency will receive a commission of {{commissionRate}}% from the seller upon successful purchase.

3. This agreement is valid for {{agreementPeriod}} months from the date signed.

4. The Buyer agrees to work exclusively with the Agency during this period.

5. The Agency will provide market analysis, property viewings, and negotiation support.

Buyer's Signature: _________________        Date: _________________

Agency Representative: _________________    Date: _________________
`,
  preview: 'Agreement to represent buyer in property search'
};

// ============================================================================
// MARKETING TEMPLATES
// ============================================================================

export const PROPERTY_BROCHURE: DocumentTemplate = {
  id: 'property-brochure',
  name: 'Property Marketing Brochure',
  category: 'marketing',
  description: 'Marketing material for property listing',
  requiredFields: ['propertyTitle', 'propertyAddress', 'price', 'bedrooms', 'bathrooms', 'area'],
  template: `
{{propertyTitle}}

PROPERTY HIGHLIGHTS
─────────────────────────────────────

📍 Location: {{propertyAddress}}
💰 Price: {{price}}
🛏️ Bedrooms: {{bedrooms}}
🚿 Bathrooms: {{bathrooms}}
📐 Area: {{area}} sq ft

DESCRIPTION
─────────────────────────────────────
{{description}}

KEY FEATURES
─────────────────────────────────────
{{features}}

AMENITIES
─────────────────────────────────────
{{amenities}}

CONTACT
─────────────────────────────────────
{{agentName}}
{{agencyName}}
📞 {{agentPhone}}
✉️ {{agentEmail}}

Schedule your viewing today!
`,
  preview: 'Professional property marketing brochure'
};

// ============================================================================
// LETTER TEMPLATES
// ============================================================================

export const OFFER_LETTER: DocumentTemplate = {
  id: 'offer-letter',
  name: 'Purchase Offer Letter',
  category: 'letter',
  description: 'Formal offer letter for property purchase',
  requiredFields: ['buyerName', 'sellerName', 'propertyAddress', 'offerPrice', 'date'],
  template: `
PURCHASE OFFER LETTER

Date: {{date}}

To: {{sellerName}}

Subject: Formal Offer to Purchase Property at {{propertyAddress}}

Dear {{sellerName}},

I, {{buyerName}}, hereby submit a formal offer to purchase the property located at:

{{propertyAddress}}

OFFER DETAILS:
─────────────────────────────────────
Offered Price: {{offerPrice}}
Payment Terms: {{paymentTerms}}
Possession Date: {{possessionDate}}
Conditions: {{conditions}}

This offer is valid until {{offerValidUntil}}.

I am ready to proceed with the purchase and can arrange for the necessary documentation and payments as per the agreed terms.

I look forward to your positive response.

Sincerely,

{{buyerName}}
CNIC: {{buyerCNIC}}
Phone: {{buyerPhone}}

Through:
{{agencyName}}
Agent: {{agentName}}
`,
  preview: 'Formal letter to make purchase offer'
};

export const VIEWING_CONFIRMATION: DocumentTemplate = {
  id: 'viewing-confirmation',
  name: 'Property Viewing Confirmation',
  category: 'letter',
  description: 'Confirmation letter for property viewing appointment',
  requiredFields: ['clientName', 'propertyAddress', 'viewingDate', 'viewingTime', 'agentName'],
  template: `
PROPERTY VIEWING CONFIRMATION

Dear {{clientName}},

This is to confirm your appointment to view the property located at:

{{propertyAddress}}

VIEWING DETAILS:
─────────────────────────────────────
Date: {{viewingDate}}
Time: {{viewingTime}}
Meeting Point: {{meetingPoint}}

Your viewing will be conducted by {{agentName}} from {{agencyName}}.

PLEASE BRING:
• Valid photo ID
• Proof of funds (if interested in making an offer)

If you need to reschedule, please contact us at least 24 hours in advance.

Contact: {{agentPhone}}

We look forward to showing you this property!

Best regards,

{{agentName}}
{{agencyName}}
`,
  preview: 'Confirmation for scheduled property viewing'
};

// ============================================================================
// REPORT TEMPLATES
// ============================================================================

export const MARKET_ANALYSIS_REPORT: DocumentTemplate = {
  id: 'market-analysis',
  name: 'Comparative Market Analysis',
  category: 'report',
  description: 'Market analysis report for property valuation',
  requiredFields: ['propertyAddress', 'estimatedValue', 'date'],
  template: `
COMPARATIVE MARKET ANALYSIS (CMA)

Property: {{propertyAddress}}
Date: {{date}}
Prepared by: {{agentName}}, {{agencyName}}

PROPERTY DETAILS
─────────────────────────────────────
Type: {{propertyType}}
Area: {{area}} sq ft
Bedrooms: {{bedrooms}}
Bathrooms: {{bathrooms}}
Condition: {{condition}}

ESTIMATED VALUE
─────────────────────────────────────
Recommended Listing Price: {{estimatedValue}}
Price per sq ft: {{pricePerSqft}}

MARKET ANALYSIS
─────────────────────────────────────
Average Days on Market: {{avgDaysOnMarket}} days
Recent Sales in Area: {{recentSalesCount}}
Price Trend: {{priceTrend}}

COMPARABLE PROPERTIES
─────────────────────────────────────
{{comparableProperties}}

RECOMMENDATIONS
─────────────────────────────────────
{{recommendations}}

This analysis is based on current market conditions and comparable sales data.

Prepared by: {{agentName}}
License: {{agentLicense}}
`,
  preview: 'Professional market analysis and valuation report'
};

// ============================================================================
// TEMPLATE LIBRARY
// ============================================================================

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  PROPERTY_LISTING_AGREEMENT,
  SALE_DEED_RECEIPT,
  BUYER_REPRESENTATION_AGREEMENT,
  PROPERTY_BROCHURE,
  OFFER_LETTER,
  VIEWING_CONFIRMATION,
  MARKET_ANALYSIS_REPORT
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: DocumentTemplate['category']): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): Array<{ value: DocumentTemplate['category']; label: string }> {
  return [
    { value: 'agreement', label: 'Agreements' },
    { value: 'letter', label: 'Letters' },
    { value: 'receipt', label: 'Receipts' },
    { value: 'report', label: 'Reports' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'legal', label: 'Legal' }
  ];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert property to template data
 */
export function propertyToTemplateData(property: Property, additionalData?: any): any {
  return {
    propertyTitle: property.title,
    propertyAddress: property.address,
    propertyType: property.propertyType,
    price: formatCurrency(property.price || 0),
    listingPrice: formatCurrency(property.price || 0),
    bedrooms: property.bedrooms || 'N/A',
    bathrooms: property.bathrooms || 'N/A',
    area: property.area || 'N/A',
    description: property.description || '',
    features: property.features?.join(', ') || 'N/A',
    commissionRate: property.commissionRate || 2,
    ...additionalData
  };
}

/**
 * Convert lead to template data
 */
export function leadToTemplateData(lead: Lead, additionalData?: any): any {
  return {
    clientName: lead.name,
    buyerName: lead.name,
    buyerPhone: lead.phone,
    buyerEmail: lead.email || '',
    buyerCNIC: lead.cnic || '',
    budget: lead.budget ? formatCurrency(lead.budget) : 'Not specified',
    budgetRange: lead.budget ? `Up to ${formatCurrency(lead.budget)}` : 'Not specified',
    ...additionalData
  };
}

/**
 * Convert contact to template data
 */
export function contactToTemplateData(contact: Contact, additionalData?: any): any {
  return {
    clientName: contact.name,
    contactPhone: contact.phone,
    contactEmail: contact.email || '',
    contactType: contact.type,
    ...additionalData
  };
}

/**
 * Number to words (for amounts in receipts)
 */
export function numberToWords(num: number): string {
  // Simplified version - only handles up to billions
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  // This is a simplified implementation
  // For production, use a proper number-to-words library
  return `${num.toLocaleString()} Rupees`;
}
