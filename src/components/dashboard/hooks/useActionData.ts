/**
 * useActionData Hook
 * 
 * Loads data needed for action detection.
 * 
 * FEATURES:
 * - Loads Tasks V4 from localStorage
 * - Loads leads V4
 * - Loads properties
 * - Loads sell cycles
 * - Role-based filtering
 * - Loading states
 */

import { useState, useEffect, useMemo } from 'react';
import { User, SellCycle, Property } from '../../../types';
import { LeadV4 } from '../../../types/leads';
import { TaskV4 } from '../../../types/tasks';
import { getAllTasksV4 } from '../../../lib/tasks';
import { getLeadsV4 } from '../../../lib/leadsV4';
import { getProperties } from '../../../lib/data';
import { getSellCycles } from '../../../lib/sellCycle';

export interface ActionData {
  tasks: TaskV4[];
  leads: LeadV4[];
  properties: Property[];
  sellCycles: SellCycle[];
  loading: boolean;
  error: string | null;
}

/**
 * useActionData hook
 */
export function useActionData(user: User): ActionData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for data
  const [tasks, setTasks] = useState<TaskV4[]>([]);
  const [leads, setLeads] = useState<LeadV4[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [sellCycles, setSellCycles] = useState<SellCycle[]>([]);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      // Determine user filtering
      const userId = user.id;
      const userRole = user.role;

      // Load Tasks V4
      const tasksData = getAllTasksV4(userId, userRole);
      setTasks(tasksData);

      // Load leads
      const leadsData = getLeadsV4(userId, userRole);
      setLeads(leadsData);

      // Load properties
      const propertiesData = getProperties(userId, userRole);
      setProperties(propertiesData);

      // Load sell cycles
      const sellCyclesData = getSellCycles(userId, userRole);
      setSellCycles(sellCyclesData);

      setLoading(false);
    } catch (err) {
      console.error('Error loading action data:', err);
      setError('Failed to load action data');
      setLoading(false);
    }
  }, [user.id, user.role]);

  return {
    tasks,
    leads,
    properties,
    sellCycles,
    loading,
    error,
  };
}