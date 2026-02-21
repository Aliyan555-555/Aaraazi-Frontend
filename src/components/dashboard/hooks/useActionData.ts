import { useState, useEffect, useMemo } from "react";
import { User, SellCycle, Property } from "../../../types";
import { DashboardLead } from "../../../types/leads";
import { Task } from "../../../types/tasks";
import { getAllTasks } from "../../../lib/tasks";
// import { getDashboardLeads } from "../../../lib/leadsV4";
// import { getProperties } from "../../../lib/data";
// import { getSellCycles } from "../../../lib/sellCycle";

export interface ActionData {
  tasks: Task[];
  leads: DashboardLead[];
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [sellCycles, setSellCycles] = useState<SellCycle[]>([]);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      // Determine user filtering
      const userId = user.id;
      const userRole = user.role;

      // Load Tasks
      const tasksData = getAllTasks(userId, userRole);
      setTasks(tasksData);

      // Load leads
      const leadsData = [];
      setLeads(leadsData);

      // Load properties
      const propertiesData = [];
      setProperties(propertiesData);

      // Load sell cycles
      const sellCyclesData = [];
      setSellCycles(sellCyclesData);

      setLoading(false);
    } catch (err) {
      console.error("Error loading action data:", err);
      setError("Failed to load action data");
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
