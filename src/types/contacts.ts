import { ContactLeadTracking } from "./leadsIntegration";

/**
 * Contact/Client Management Types
 */

export type ContactType =
  | "client"
  | "prospect"
  | "investor"
  | "vendor"
  | "agent";
export type ContactCategory =
  | "buyer"
  | "seller"
  | "tenant"
  | "landlord"
  | "external-broker"
  | "both";
export type ContactStatus = "active" | "inactive" | "archived";

export interface Contact extends Partial<ContactLeadTracking> {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  cnic?: string;
  type: ContactType;
  category?: ContactCategory;
  status: ContactStatus;
  source?: string;
  notes?: string;
  tags?: string[];
  agentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Tracking
  lastContactDate?: string;
  nextFollowUp?: string;
  recentInquiryDate?: string;
  interestedProperties?: string[];
  totalTransactions?: number;
  totalDeals?: number;
  totalVolume?: number;
  totalCommissionEarned?: number;
}
