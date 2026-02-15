/**
 * usePerformanceData Hook
 * 
 * Loads and calculates performance metrics for the dashboard.
 * 
 * FEATURES:
 * - Loads all required data
 * - Calculates 8 performance metrics
 * - Role-based filtering
 * - Returns loading state
 */

import { useState, useEffect } from 'react';
import { User, Property } from '../../../types';
import { LeadV4 } from '../../../types/leads';
import { CRMTask, CRMInteraction } from '../../../types';
import { PerformanceMetric } from '../components/PerformanceCard';
import { calculatePerformanceMetrics } from '../utils/calculatePerformanceMetrics';
// [STUBBED] import { getProperties } from '../../../lib/data';
// [STUBBED] import { getLeadsV4 } from '../../../lib/leadsV4';
// [STUBBED] import { getAllTasks, getAllInteractions } from '../../../lib/data';
import { getAllAgents } from '../../../lib/auth';

// ===== STUBS for removed prototype functions =====
const getProperties = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getLeadsV4 = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getAllTasks = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getAllInteractions = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


export interface PerformanceData {
  metrics: PerformanceMetric[];
  loading: boolean;
  error: string | null;
}

/**
 * usePerformanceData hook
 */
export function usePerformanceData(user: User): PerformanceData {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      const userId = user.role === 'admin' ? undefined : user.id;
      const userRole = user.role;

      // Load all required data
      const properties = getProperties(userId, userRole);
      const leads = getLeadsV4(userId, userRole);
      const tasks = getAllTasks(userId, userRole);
      const interactions = getAllInteractions(userId, userRole);
      const users = getAllAgents();

      // Calculate performance metrics
      const calculatedMetrics = calculatePerformanceMetrics({
        properties,
        leads,
        tasks,
        interactions,
        users,
      });

      setMetrics(calculatedMetrics);
      setLoading(false);
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError('Failed to load performance data');
      setLoading(false);
    }
  }, [user.id, user.role]);

  return {
    metrics,
    loading,
    error,
  };
}