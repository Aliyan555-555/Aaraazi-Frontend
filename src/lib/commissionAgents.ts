/**
 * Commission Agents - Multi-Agent Commission Support
 *
 * Manages commission splits across multiple agents (internal and external)
 */

import { Deal, CommissionAgent, CommissionStatus } from "../types/deals";
import { User } from "../types";
import { updateDeal } from "./deals";
import { getContactById } from "./data";
import { getAllAgents } from "./data";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all available internal agents (users)
 */
export const getAvailableInternalAgents = (): User[] => {
  const agents = getAllAgents();

  console.log("🔍 Internal Agents Debug:", {
    totalAgents: agents.length,
    agents: agents.map((a: any) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      email: a.email,
    })),
  });

  return agents;
};

/**
 * Get all available external brokers (contacts)
 * NOTE: Contacts use 'category' field (not 'type') with value 'external-broker'
 */
export const getAvailableExternalBrokers = () => {
  // IMPORTANT: Use correct localStorage key (matches /lib/data.ts)
  const CRM_CONTACTS_KEY = "crm_contacts";
  const contacts = JSON.parse(localStorage.getItem(CRM_CONTACTS_KEY) || "[]");

  // Filter contacts with category 'external-broker'
  // Also support legacy 'type' field for backward compatibility
  const brokers = contacts.filter(
    (c: any) =>
      c.category === "external-broker" || c.type === "external-broker",
  );

  console.log("🔍 External Brokers Debug:", {
    totalContacts: contacts.length,
    externalBrokers: brokers.length,
    brokers: brokers.map((b: any) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      type: b.type,
    })),
  });

  return brokers;
};

/**
 * Calculate commission amount for a percentage
 */
export const calculateCommissionAmount = (
  totalCommission: number,
  percentage: number,
): number => {
  return (totalCommission * percentage) / 100;
};

/**
 * Validate commission splits total to 100%
 */
export const validateCommissionSplits = (
  agents: CommissionAgent[],
  agencyPercentage: number,
): { valid: boolean; message: string } => {
  const agentTotal = agents.reduce((sum, agent) => sum + agent.percentage, 0);
  const total = agentTotal + agencyPercentage;

  if (Math.abs(total - 100) > 0.01) {
    return {
      valid: false,
      message: `Commission splits must total 100% (currently ${total.toFixed(1)}%)`,
    };
  }

  // Allow zero agents (agency can take 100% if needed)
  // Removed: if (agents.length === 0) check

  if (agencyPercentage < 0 || agencyPercentage > 100) {
    return {
      valid: false,
      message: "Agency percentage must be between 0% and 100%",
    };
  }

  return { valid: true, message: "" };
};

/**
 * Add agent to deal commission
 * FIXED: Properly handles deep merge to preserve agent additions
 */
export const addAgentToCommission = (
  dealId: string,
  agent: Omit<CommissionAgent, "amount">,
  totalCommission: number,
): Deal => {
  console.log("📝 addAgentToCommission called:", {
    dealId,
    agent,
    totalCommission,
  });

  // Calculate amount
  const amount = calculateCommissionAmount(totalCommission, agent.percentage);

  const newAgent: CommissionAgent = {
    ...agent,
    amount,
    status: agent.status || "pending",
  };

  console.log("📝 New agent with amount:", newAgent);

  // Get current deal using the proper getter
  const deals = JSON.parse(localStorage.getItem("estate_deals") || "[]");
  const dealIndex = deals.findIndex((d: Deal) => d.id === dealId);

  if (dealIndex === -1) {
    throw new Error(`Deal ${dealId} not found`);
  }

  const deal = deals[dealIndex];

  // Initialize agents array if it doesn't exist
  if (!deal.financial.commission.agents) {
    deal.financial.commission.agents = [];
  }

  console.log(
    "📝 Current agents before adding:",
    deal.financial.commission.agents,
  );

  // Check for duplicate
  const exists = deal.financial.commission.agents.some(
    (a: CommissionAgent) => a.id === newAgent.id,
  );

  if (exists) {
    throw new Error("Agent is already added to commission");
  }

  // CRITICAL FIX: Create new agents array with the new agent
  const updatedAgents = [...deal.financial.commission.agents, newAgent];

  console.log("📝 Updated agents array:", updatedAgents);

  // CRITICAL FIX: Create complete commission object with updated agents
  const updatedCommission = {
    ...deal.financial.commission,
    agents: updatedAgents,
  };

  console.log("📝 Updated commission object:", updatedCommission);

  // CRITICAL FIX: Call updateDeal with the complete updated commission
  const updatedDeal = updateDeal(dealId, {
    financial: {
      ...deal.financial,
      commission: updatedCommission,
    },
  });

  console.log(
    "✅ Deal updated successfully. New agent count:",
    updatedDeal.financial.commission.agents?.length,
  );

  return updatedDeal;
};

/**
 * Remove agent from deal commission
 */
export const removeAgentFromCommission = (
  dealId: string,
  agentId: string,
): Deal => {
  const deals = JSON.parse(localStorage.getItem("estate_deals") || "[]");
  const dealIndex = deals.findIndex((d: Deal) => d.id === dealId);

  if (dealIndex === -1) {
    throw new Error(`Deal ${dealId} not found`);
  }

  const deal = deals[dealIndex];

  if (!deal.financial.commission.agents) {
    throw new Error("No agents found in commission");
  }

  // Remove agent
  deal.financial.commission.agents = deal.financial.commission.agents.filter(
    (a: CommissionAgent) => a.id !== agentId,
  );

  // Update deal
  return updateDeal(dealId, {
    financial: {
      ...deal.financial,
      commission: deal.financial.commission,
    },
  });
};

/**
 * Update agent commission percentage
 */
export const updateAgentCommissionPercentage = (
  dealId: string,
  agentId: string,
  percentage: number,
  totalCommission: number,
): Deal => {
  const deals = JSON.parse(localStorage.getItem("estate_deals") || "[]");
  const dealIndex = deals.findIndex((d: Deal) => d.id === dealId);

  if (dealIndex === -1) {
    throw new Error(`Deal ${dealId} not found`);
  }

  const deal = deals[dealIndex];

  if (!deal.financial.commission.agents) {
    throw new Error("No agents found in commission");
  }

  // Find and update agent
  const agent = deal.financial.commission.agents.find(
    (a: CommissionAgent) => a.id === agentId,
  );

  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  agent.percentage = percentage;
  agent.amount = calculateCommissionAmount(totalCommission, percentage);

  // Update deal
  return updateDeal(dealId, {
    financial: {
      ...deal.financial,
      commission: deal.financial.commission,
    },
  });
};

/**
 * Recalculate all agent commission amounts after rate change
 */
export const recalculateCommissionAmounts = (deal: Deal): Deal => {
  const totalCommission = deal.financial.commission.total;

  if (!deal.financial.commission.agents) {
    return deal;
  }

  // Recalculate each agent amount
  deal.financial.commission.agents.forEach((agent: CommissionAgent) => {
    agent.amount = calculateCommissionAmount(totalCommission, agent.percentage);
  });

  // Recalculate agency amount
  if (deal.financial.commission.split.agency) {
    deal.financial.commission.split.agency.amount = calculateCommissionAmount(
      totalCommission,
      deal.financial.commission.split.agency.percentage,
    );
  }

  return updateDeal(deal.id, {
    financial: {
      ...deal.financial,
      commission: deal.financial.commission,
    },
  });
};

/**
 * Mark agent commission as paid
 */
export const markAgentCommissionPaid = (
  dealId: string,
  agentId: string,
  paidBy: string,
): Deal => {
  const deals = JSON.parse(localStorage.getItem("estate_deals") || "[]");
  const dealIndex = deals.findIndex((d: Deal) => d.id === dealId);

  if (dealIndex === -1) {
    throw new Error(`Deal ${dealId} not found`);
  }

  const deal = deals[dealIndex];

  if (!deal.financial.commission.agents) {
    throw new Error("No agents found in commission");
  }

  // Find and update agent
  const agent = deal.financial.commission.agents.find(
    (a: CommissionAgent) => a.id === agentId,
  );

  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  agent.status = "paid";
  agent.paidDate = new Date().toISOString();

  // Update deal
  return updateDeal(dealId, {
    financial: {
      ...deal.financial,
      commission: deal.financial.commission,
    },
  });
};

/**
 * Get agent details (from User or Contact)
 */
export const getAgentDetails = (
  agentId: string,
  entityType: "user" | "contact",
) => {
  if (entityType === "user") {
    const users = getAllAgents();
    return users.find((u) => u.id === agentId);
  } else {
    return getContactById(agentId);
  }
};

/**
 * Migrate legacy commission structure to new multi-agent structure
 */
export const migrateLegacyCommission = (deal: Deal): Deal => {
  // Skip if already migrated
  if (
    deal.financial.commission.agents &&
    deal.financial.commission.agents.length > 0
  ) {
    return deal;
  }

  const agents: CommissionAgent[] = [];

  // Migrate primary agent
  if (deal.financial.commission.split?.primaryAgent) {
    agents.push({
      id: deal.agents.primary.id,
      type: "internal",
      entityType: "user",
      name: deal.agents.primary.name,
      percentage: deal.financial.commission.split.primaryAgent.percentage,
      amount: deal.financial.commission.split.primaryAgent.amount,
      status:
        (deal.financial.commission.split.primaryAgent
          .status as CommissionStatus) || "pending",
      paidDate: deal.financial.commission.split.primaryAgent.paidDate,
      approvedBy: deal.financial.commission.split.primaryAgent.approvedBy,
      approvedAt: deal.financial.commission.split.primaryAgent.approvedAt,
    });
  }

  // Migrate secondary agent
  if (
    deal.financial.commission.split?.secondaryAgent &&
    deal.agents.secondary
  ) {
    agents.push({
      id: deal.agents.secondary.id,
      type: "internal",
      entityType: "user",
      name: deal.agents.secondary.name,
      percentage: deal.financial.commission.split.secondaryAgent.percentage,
      amount: deal.financial.commission.split.secondaryAgent.amount,
      status:
        (deal.financial.commission.split.secondaryAgent
          .status as CommissionStatus) || "pending",
      paidDate: deal.financial.commission.split.secondaryAgent.paidDate,
      approvedBy: deal.financial.commission.split.secondaryAgent.approvedBy,
      approvedAt: deal.financial.commission.split.secondaryAgent.approvedAt,
    });
  }

  return updateDeal(deal.id, {
    financial: {
      ...deal.financial,
      commission: {
        ...deal.financial.commission,
        agents,
        _legacy: {
          primaryAgent: deal.financial.commission.split?.primaryAgent,
          secondaryAgent: deal.financial.commission.split?.secondaryAgent,
        },
      },
    },
  });
};
