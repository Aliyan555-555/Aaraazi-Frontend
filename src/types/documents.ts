/**
 * Document Generation Types
 * For creating legal documents with smart templates
 */

export type DocumentType = 
  | 'sales-agreement' 
  | 'final-sale-deed' 
  | 'rental-agreement' 
  | 'property-disclosure' 
  | 'payment-receipt';

export interface DocumentTemplate {
  id: DocumentType;
  name: string;
  description: string;
  icon: string;
  category: 'sale' | 'rental' | 'legal' | 'receipt';
}

export interface DocumentClause {
  id: string;
  title: string;
  content: string;
  isCustom: boolean;
  order: number;
}

export interface DocumentDetails {
  // Sales Agreement / Final Sale Deed - Seller
  sellerName?: string;
  sellerFatherName?: string;
  sellerCNIC?: string;
  sellerAddress?: string;
  
  // Sales Agreement / Final Sale Deed - Buyer
  buyerName?: string;
  buyerFatherName?: string;
  buyerCNIC?: string;
  buyerAddress?: string;
  
  // Rental Agreement - Landlord
  landlordName?: string;
  landlordFatherName?: string;
  landlordCNIC?: string;
  landlordAddress?: string;
  
  // Rental Agreement - Tenant
  tenantName?: string;
  tenantFatherName?: string;
  tenantCNIC?: string;
  tenantAddress?: string;
  
  // Property Disclosure - Owner
  ownerName?: string;
  ownerCNIC?: string;
  ownerAddress?: string;
  
  // Payment Receipt - Payer/Payee
  payerName?: string;
  payeeName?: string;
  
  // Property Information (Common)
  propertyAddress?: string;
  propertyType?: string;
  propertySize?: string;
  propertySizeUnit?: string;
  
  // Sales Financial Details
  salePrice?: number;
  tokenMoney?: number;
  remainingAmount?: number;
  
  // Rental Details
  monthlyRent?: number;
  securityDeposit?: number;
  leasePeriod?: string;
  
  // Property Disclosure
  ownershipStatus?: string;
  legalStatus?: string;
  structuralCondition?: string;
  
  // Payment Receipt
  paymentAmount?: number;
  paymentDate?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  paymentPurpose?: string;
}

export interface GeneratedDocument {
  id: string;
  documentType: DocumentType;
  documentName: string;
  propertyId?: string;
  propertyTitle?: string;
  transactionId?: string;
  details: DocumentDetails;
  clauses: DocumentClause[];
  createdAt: string;
  createdBy: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'sales-agreement',
    name: 'Sales Agreement',
    description: 'Agreement between buyer and seller for property purchase',
    icon: 'FileText',
    category: 'sale'
  },
  {
    id: 'final-sale-deed',
    name: 'Final Sale Deed',
    description: 'Official deed transferring property ownership',
    icon: 'FileCheck',
    category: 'sale'
  },
  {
    id: 'rental-agreement',
    name: 'Rental Agreement',
    description: 'Lease agreement for property rental',
    icon: 'Home',
    category: 'rental'
  },
  {
    id: 'property-disclosure',
    name: 'Property Disclosure',
    description: 'Property condition and legal status disclosure',
    icon: 'AlertCircle',
    category: 'legal'
  },
  {
    id: 'payment-receipt',
    name: 'Payment Receipt',
    description: 'Official receipt for payments received',
    icon: 'Receipt',
    category: 'receipt'
  }
];

export const DEFAULT_CLAUSES: Record<DocumentType, DocumentClause[]> = {
  'sales-agreement': [
    {
      id: '1',
      title: '1. Parties to the Agreement',
      content: 'This Sales Agreement is made on [DATE] between [SELLER_NAME] son/daughter of [SELLER_FATHER_NAME], holder of CNIC No. [SELLER_CNIC], residing at [SELLER_ADDRESS] (hereinafter referred to as the "Seller") AND [BUYER_NAME] son/daughter of [BUYER_FATHER_NAME], holder of CNIC No. [BUYER_CNIC], residing at [BUYER_ADDRESS] (hereinafter referred to as the "Buyer").',
      isCustom: false,
      order: 1
    },
    {
      id: '2',
      title: '2. Property Description',
      content: 'The Seller hereby agrees to sell and the Buyer agrees to purchase the property located at [PROPERTY_ADDRESS], measuring approximately [PROPERTY_SIZE] [PROPERTY_UNIT], classified as [PROPERTY_TYPE].',
      isCustom: false,
      order: 2
    },
    {
      id: '3',
      title: '3. Consideration',
      content: 'The total sale price for the above-mentioned property is PKR [SALE_PRICE] (Pakistani Rupees [SALE_PRICE_WORDS]). The Buyer has paid PKR [TOKEN_MONEY] as token money/bayana, and the remaining amount of PKR [REMAINING_AMOUNT] shall be paid on or before the date of final sale deed execution.',
      isCustom: false,
      order: 3
    },
    {
      id: '4',
      title: '4. Seller\'s Assurances',
      content: 'The Seller hereby confirms and guarantees that: (a) The Seller is the lawful and absolute owner of the property; (b) The property is free from all encumbrances, liens, mortgages, charges, and disputes; (c) The Seller has full right, power, and authority to sell the property; (d) All taxes, utility bills, and other dues have been paid up to date.',
      isCustom: false,
      order: 4
    },
    {
      id: '5',
      title: '5. Possession',
      content: 'The Seller shall deliver vacant and peaceful possession of the property to the Buyer immediately upon execution of the final sale deed and payment of the full consideration amount.',
      isCustom: false,
      order: 5
    },
    {
      id: '6',
      title: '6. Default Clause',
      content: 'In the event of default by either party, the non-defaulting party shall have the right to terminate this agreement and claim damages. If the Buyer defaults, the token money paid shall be forfeited. If the Seller defaults, the Seller shall refund double the token money received.',
      isCustom: false,
      order: 6
    },
    {
      id: '7',
      title: '7. Indemnity',
      content: 'The Seller shall indemnify and keep the Buyer harmless from all claims, demands, actions, proceedings, costs, and expenses arising out of any defect in title or any third-party claims on the property.',
      isCustom: false,
      order: 7
    },
    {
      id: '8',
      title: '8. Governing Law',
      content: 'This agreement shall be governed by and construed in accordance with the laws of Pakistan. Any dispute arising from this agreement shall be subject to the exclusive jurisdiction of courts in Karachi, Pakistan.',
      isCustom: false,
      order: 8
    }
  ],
  'final-sale-deed': [
    {
      id: '1',
      title: '1. Parties',
      content: 'THIS SALE DEED is executed on [DATE] by and between [SELLER_NAME] son/daughter of [SELLER_FATHER_NAME], CNIC No. [SELLER_CNIC], resident of [SELLER_ADDRESS] (hereinafter called the "SELLER") AND [BUYER_NAME] son/daughter of [BUYER_FATHER_NAME], CNIC No. [BUYER_CNIC], resident of [BUYER_ADDRESS] (hereinafter called the "PURCHASER").',
      isCustom: false,
      order: 1
    },
    {
      id: '2',
      title: '2. Property Details',
      content: 'The Seller is the absolute owner of the property situated at [PROPERTY_ADDRESS], measuring [PROPERTY_SIZE] [PROPERTY_UNIT], type: [PROPERTY_TYPE], free from all encumbrances.',
      isCustom: false,
      order: 2
    },
    {
      id: '3',
      title: '3. Sale Consideration',
      content: 'The Seller sells and the Purchaser purchases the above property for a total consideration of PKR [SALE_PRICE]. The Purchaser has paid the full amount to the Seller, receipt whereof is hereby acknowledged by the Seller.',
      isCustom: false,
      order: 3
    },
    {
      id: '4',
      title: '4. Transfer of Ownership',
      content: 'The Seller hereby transfers all rights, title, and interest in the property to the Purchaser. The Purchaser shall henceforth be the absolute owner of the property with full right to use, possess, sell, transfer, or otherwise deal with the property.',
      isCustom: false,
      order: 4
    },
    {
      id: '5',
      title: '5. Vacant Possession',
      content: 'The Seller has handed over vacant and peaceful possession of the property to the Purchaser, and the Purchaser has taken actual physical possession of the same.',
      isCustom: false,
      order: 5
    },
    {
      id: '6',
      title: '6. Warranties',
      content: 'The Seller warrants that the property is free from all encumbrances, liens, charges, mortgages, and litigation, and that no person has any right, claim, or interest in the property.',
      isCustom: false,
      order: 6
    }
  ],
  'rental-agreement': [
    {
      id: '1',
      title: '1. Parties',
      content: 'This Rental Agreement is entered into on [DATE] between [SELLER_NAME] (Landlord/Owner), CNIC No. [SELLER_CNIC], address: [SELLER_ADDRESS] AND [BUYER_NAME] (Tenant), CNIC No. [BUYER_CNIC], address: [BUYER_ADDRESS].',
      isCustom: false,
      order: 1
    },
    {
      id: '2',
      title: '2. Property Description',
      content: 'The Landlord agrees to rent the property located at [PROPERTY_ADDRESS], measuring [PROPERTY_SIZE] [PROPERTY_UNIT], type: [PROPERTY_TYPE] to the Tenant.',
      isCustom: false,
      order: 2
    },
    {
      id: '3',
      title: '3. Lease Period',
      content: 'The lease period shall be for [LEASE_PERIOD] commencing from [START_DATE].',
      isCustom: false,
      order: 3
    },
    {
      id: '4',
      title: '4. Rent and Security Deposit',
      content: 'The monthly rent is PKR [MONTHLY_RENT]. The Tenant has paid a security deposit of PKR [SECURITY_DEPOSIT], which shall be refunded at the end of tenancy subject to property condition.',
      isCustom: false,
      order: 4
    },
    {
      id: '5',
      title: '5. Utilities and Maintenance',
      content: 'The Tenant shall pay all utility bills including electricity, gas, and water. Routine maintenance shall be the Tenant\'s responsibility, while major repairs remain the Landlord\'s obligation.',
      isCustom: false,
      order: 5
    },
    {
      id: '6',
      title: '6. Termination',
      content: 'Either party may terminate this agreement by providing [NOTICE_PERIOD] days written notice to the other party.',
      isCustom: false,
      order: 6
    }
  ],
  'property-disclosure': [
    {
      id: '1',
      title: '1. Property Information',
      content: 'Property Address: [PROPERTY_ADDRESS]\nSize: [PROPERTY_SIZE] [PROPERTY_UNIT]\nType: [PROPERTY_TYPE]',
      isCustom: false,
      order: 1
    },
    {
      id: '2',
      title: '2. Ownership Status',
      content: 'The property is owned by [SELLER_NAME], CNIC: [SELLER_CNIC]. All documentation and title deeds are clear and in order.',
      isCustom: false,
      order: 2
    },
    {
      id: '3',
      title: '3. Legal Status',
      content: 'The property is free from all legal disputes, litigation, encumbrances, and third-party claims. There are no pending court cases or legal issues.',
      isCustom: false,
      order: 3
    },
    {
      id: '4',
      title: '4. Structural Condition',
      content: 'The property structure is in good condition. Any known defects or issues have been disclosed to potential buyers.',
      isCustom: false,
      order: 4
    }
  ],
  'payment-receipt': [
    {
      id: '1',
      title: 'Receipt Details',
      content: 'Receipt No: [RECEIPT_NUMBER]\nDate: [PAYMENT_DATE]\n\nReceived from: [BUYER_NAME]\nCNIC: [BUYER_CNIC]\nAddress: [BUYER_ADDRESS]',
      isCustom: false,
      order: 1
    },
    {
      id: '2',
      title: 'Payment Information',
      content: 'Amount Received: PKR [PAYMENT_AMOUNT]\n\nPayment for: Property located at [PROPERTY_ADDRESS]\n\nPayment Method: [PAYMENT_METHOD]',
      isCustom: false,
      order: 2
    },
    {
      id: '3',
      title: 'Acknowledgment',
      content: 'Received by: [SELLER_NAME]\nCNIC: [SELLER_CNIC]\n\nSignature: ___________________\n\nThis receipt serves as proof of payment received.',
      isCustom: false,
      order: 3
    }
  ]
};
