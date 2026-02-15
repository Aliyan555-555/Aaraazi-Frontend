/**
 * useDashboardData Hook
 * 
 * Loads and calculates all dashboard data from localStorage.
 * Provides loading states and real-time data updates.
 * 
 * FEATURES:
 * - Loads data from localStorage
 * - Calculates all metrics
 * - Role-based filtering (admin vs agent)
 * - Loading states
 * - Error handling
 * - Memoized calculations
 * 
 * USAGE:
 * const { metrics, trends, loading } = useDashboardData(user);
 */

import { useState, useEffect, useMemo } from 'react';
import { User, SellCycle, Property, Contact } from '../../../types';
import { LeadV4 } from '../../../types/leads';
import { DashboardMetrics } from '../types/dashboard.types';
// [STUBBED] import { getSellCycles } from '../../../lib/sellCycle';
// [STUBBED] import { getProperties, getContacts } from '../../../lib/data';
// [STUBBED] import { getLeadsV4 } from '../../../lib/leadsV4';
import {
  calculateActivePipeline,
  calculateActiveDealCount,
  calculateMonthlyRevenue,
  calculateRevenueTrend,
  calculateAvailableInventory,
  calculateConversionRate,
  calculateConversionTrend,
  calculatePipelineTrend,
} from '../utils/calculateMetrics';
import { formatPKR } from '../../../lib/currency';

// ===== STUBS for removed prototype functions =====
const getSellCycles = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getProperties = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getContacts = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getLeadsV4 = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


export interface DashboardData {
  metrics: {
    activePipeline: {
      value: string;
      raw: number;
      count: number;
      trend: {
        direction: 'up' | 'down' | 'neutral';
        value: string;
      };
    };
    monthlyRevenue: {
      value: string;
      raw: number;
      trend: {
        direction: 'up' | 'down' | 'neutral';
        value: string;
      };
    };
    availableInventory: {
      value: string;
      raw: number;
    };
    conversionRate: {
      value: string;
      raw: number;
      trend: {
        direction: 'up' | 'down' | 'neutral';
        value: string;
      };
    };
  };
  loading: boolean;
  error: string | null;
}

/**
 * useDashboardData hook
 */
export function useDashboardData(user: User): DashboardData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage
  const [sellCycles, setSellCycles] = useState<SellCycle[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<LeadV4[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      // Load data based on user role
      const userId = user.role === 'admin' ? undefined : user.id;
      const userRole = user.role;

      // Load sell cycles
      const cyclesData = getSellCycles(userId, userRole);
      setSellCycles(cyclesData);

      // Load properties
      const propertiesData = getProperties(userId, userRole);
      setProperties(propertiesData);

      // Load leads
      const leadsData = getLeadsV4(userId, userRole);
      setLeads(leadsData);

      // Load contacts
      const contactsData = getContacts(userId, userRole);
      setContacts(contactsData);

      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  }, [user.id, user.role]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (loading) {
      return {
        activePipeline: {
          value: '...',
          raw: 0,
          count: 0,
          trend: { direction: 'neutral' as const, value: '0' },
        },
        monthlyRevenue: {
          value: '...',
          raw: 0,
          trend: { direction: 'neutral' as const, value: '0' },
        },
        availableInventory: {
          value: '...',
          raw: 0,
        },
        conversionRate: {
          value: '...',
          raw: 0,
          trend: { direction: 'neutral' as const, value: '0' },
        },
      };
    }

    // Active Pipeline
    const pipelineValue = calculateActivePipeline(sellCycles);
    const dealCount = calculateActiveDealCount(sellCycles);
    const pipelineTrend = calculatePipelineTrend(sellCycles);

    // Monthly Revenue
    const revenue = calculateMonthlyRevenue(sellCycles);
    const revenueTrend = calculateRevenueTrend(sellCycles);

    // Available Inventory
    const inventory = calculateAvailableInventory(properties);

    // Conversion Rate
    const conversionData = calculateConversionRate(leads, contacts);
    const conversionTrend = calculateConversionTrend(leads);

    return {
      activePipeline: {
        value: formatPKR(pipelineValue),
        raw: pipelineValue,
        count: dealCount,
        trend: {
          direction: pipelineTrend.direction,
          value: `${pipelineTrend.value}`,
        },
      },
      monthlyRevenue: {
        value: formatPKR(revenue),
        raw: revenue,
        trend: {
          direction: revenueTrend.direction,
          value: `${revenueTrend.value}`,
        },
      },
      availableInventory: {
        value: `${inventory}`,
        raw: inventory,
      },
      conversionRate: {
        value: `${conversionData.rate}%`,
        raw: conversionData.rate,
        trend: {
          direction: conversionTrend.direction,
          value: `${conversionTrend.value}`,
        },
      },
    };
  }, [sellCycles, properties, leads, contacts, loading]);

  return {
    metrics,
    loading,
    error,
  };
}
