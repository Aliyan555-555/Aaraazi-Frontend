/**
 * Portfolio Management Service (stub)
 * UI-only: no localStorage, return []/zeros.
 */

import type { Property } from '../types';
import type { PaymentSchedule } from '../types/paymentSchedule';

export function getAgencyOwnedProperties(
  _userId?: string,
  _userRole?: string
): Property[] {
  return [];
}

export function getInvestorOwnedProperties(
  _userId?: string,
  _userRole?: string
): Property[] {
  return [];
}

export function getClientProperties(
  _userId?: string,
  _userRole?: string
): Property[] {
  return [];
}

export function getPropertiesByOwnerType(
  _ownerType: 'client' | 'agency' | 'investor' | 'external',
  _status?: string,
  _userId?: string,
  _userRole?: string
): Property[] {
  return [];
}

export function getAgencyAcquisitionCosts(
  _userId?: string,
  _userRole?: string
): number {
  return 0;
}

export function calculateAgencyPortfolioValue(
  _userId?: string,
  _userRole?: string
): number {
  return 0;
}

export function getAgencyUnrealizedGains(
  _userId?: string,
  _userRole?: string
): number {
  return 0;
}

export function getAgencyPortfolioSummary(
  _userId?: string,
  _userRole?: string
): {
  totalProperties: number;
  totalAcquisitionCost: number;
  currentValue: number;
  unrealizedGains: number;
  realizedGains: number;
} {
  return {
    totalProperties: 0,
    totalAcquisitionCost: 0,
    currentValue: 0,
    unrealizedGains: 0,
    realizedGains: 0,
  };
}

export function getAgencyAcquisitionPayments(): PaymentSchedule[] {
  return [];
}

export function getUpcomingAgencyPayments(
  _daysAhead: number = 30
): {
  payments: Array<{
    schedule: PaymentSchedule;
    nextInstalment: { dueDate: string; amount: number };
  }>;
  totalAmount: number;
} {
  return { payments: [], totalAmount: 0 };
}

export function getOverdueAgencyPayments(): {
  payments: Array<{
    schedule: PaymentSchedule;
    overdueInstalments: Array<{ dueDate: string; amount: number }>;
  }>;
  totalOverdue: number;
} {
  return { payments: [], totalOverdue: 0 };
}

export function getTotalPendingAgencyPayments(): number {
  return 0;
}

export function getInvestorPortfolioSummary(
  _userId?: string,
  _userRole?: string
): {
  totalInvestors: number;
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
} {
  return {
    totalInvestors: 0,
    totalInvested: 0,
    currentValue: 0,
    totalReturns: 0,
  };
}

export function isAgencyOwned(_propertyId: string): boolean {
  return false;
}

export function isInvestorOwned(_propertyId: string): boolean {
  return false;
}

export function getPropertyOwnerType(
  _propertyId: string
): 'client' | 'agency' | 'investor' | 'external' | null {
  return null;
}

export function getAgencyProperties(
  _userId?: string,
  _userRole?: string
): Property[] {
  return [];
}

export function getRelistableProperties(
  _userId?: string,
  _userRole?: string
): Property[] {
  return [];
}
