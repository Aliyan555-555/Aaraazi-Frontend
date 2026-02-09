/**
 * Investor Types
 *
 * Types for Investor Management and Syndication
 */

export interface Investor {
  id: string;
  contactId: string;

  // Basic info
  name: string;
  email?: string;
  phone: string;
  cnic?: string;
  address?: string;
  city?: string;

  // Investor-specific
  investorType:
    | "individual"
    | "corporate"
    | "institutional"
    | "company"
    | "partnership"
    | "trust";
  riskProfile: "conservative" | "moderate" | "aggressive";
  investmentGoals: string[];
  preferredPropertyTypes: string[];
  preferredLocations: string[];
  minimumROIExpectation?: number;

  // Investment capacity
  totalInvestmentCapacity?: number;
  minimumInvestmentAmount?: number;
  maximumInvestmentAmount?: number;
  investmentHorizon?: "short-term" | "medium-term" | "long-term" | string;

  // Banking information
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;

  // Previous experience
  previousInvestments?: string;

  // Portfolio summary
  totalInvested: number;
  currentPortfolioValue: number;
  realizedGains: number;
  unrealizedGains: number;
  totalROI: number;
  activeProperties: number;
  soldProperties: number;

  // Investment tracking
  investments: InvestorInvestment[];

  // Relationship
  managingAgentId: string;
  managingAgentName: string;
  agentId?: string;
  agentName?: string;
  relationshipStatus: "active" | "inactive" | "archived";

  // Preferences
  communicationPreference?: "email" | "phone" | "whatsapp";
  reportingFrequency?: "monthly" | "quarterly" | "yearly";

  // Metadata
  joinedDate: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
  status: "active" | "inactive" | "prospective" | "archived";
  kycStatus?: "verified" | "pending" | "rejected" | "expired";
  totalProfitReceived?: number;
  notes?: string;
  // Extended fields
  nationalId?: string;
  taxId?: string;
  sourceOfFunds?: string;

  secondaryContact?: {
    name: string;
    phone: string;
    email?: string;
    relationship?: string;
  };

  bankDetails?: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    branchName?: string;
    iban?: string;
    swiftCode?: string;
  };

  kycVerifiedDate?: string;
  kycExpiryDate?: string;
  kycNotes?: string;

  preferences?: {
    minInvestmentAmount?: number;
    maxInvestmentAmount?: number;
    preferredPropertyTypes?: string[];
    preferredLocations?: string[];
    riskTolerance?: "low" | "medium" | "high";
    investmentStrategy?: string;
  };

  relationshipManager?: string;
  tags?: string[];

  createdAt: string;
  updatedAt: string;
}

export interface InvestorInvestment {
  id: string;
  investorId: string;
  propertyId: string;
  propertyAddress: string;

  // Investment details
  sharePercentage: number;
  investmentAmount: number;
  investmentDate: string;
  acquisitionPrice: number;

  // Current status
  status: "active" | "sold";
  currentValue: number;

  // Returns
  rentalIncome: number;
  appreciationValue: number;
  unrealizedProfit: number;
  roi: number;

  // Links
  purchaseCycleId?: string;
  sellCycleId?: string;

  // Metadata
  agentId?: string;
  agentName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // From closeInvestment
  soldDate?: string;
  soldPrice?: number;
  saleProfit?: number;
  realizedProfit?: number;

  pendingDistribution?: number;
  exitValue?: number;
  totalExpenses?: number;
  exitDate?: string;
}

export interface InvestorShare {
  investorId: string;
  investorName?: string;
  sharePercentage: number;
  investmentAmount?: number;
  notes?: string;
}

export interface InvestorDistribution {
  id: string;
  investorId: string;
  propertyId: string;
  amount: number;
  date: string;
  type: "rental" | "sale" | "other";
  status: "pending" | "paid";
  description?: string;

  // Extended fields
  investmentId?: string;
  capitalGain?: number;
  rentalIncome?: number;
  totalExpenses?: number;
}
