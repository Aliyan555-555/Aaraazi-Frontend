/**
 * Commission Utils – Pure domain logic only.
 * No API calls, no auth store, no side effects.
 * Used by commission.service and CommissionTab for validation/mutations.
 */

import type { Deal, CommissionAgent } from '@/types/deals';

/**
 * Calculate commission amount from total and percentage.
 */
export function calculateCommissionAmount(
  totalCommission: number,
  percentage: number
): number {
  return (totalCommission * percentage) / 100;
}

/**
 * Validate that agent + agency splits total 100%.
 */
export function validateCommissionSplits(
  agents: CommissionAgent[],
  agencyPercentage: number
): { valid: boolean; message: string } {
  const agentTotal = agents.reduce((sum, a) => sum + a.percentage, 0);
  const total = agentTotal + agencyPercentage;

  if (Math.abs(total - 100) > 0.01) {
    return {
      valid: false,
      message: `Commission splits must total 100% (currently ${total.toFixed(1)}%)`,
    };
  }

  if (agencyPercentage < 0 || agencyPercentage > 100) {
    return {
      valid: false,
      message: 'Agency percentage must be between 0% and 100%',
    };
  }

  return { valid: true, message: '' };
}

/**
 * Add an agent to the deal's commission. Pure: returns new deal.
 * Parent must persist via onUpdate / PATCH when backend supports it.
 */
export function addAgentToCommission(
  deal: Deal,
  agent: Omit<CommissionAgent, 'amount'> & { status?: CommissionAgent['status'] },
  totalCommission: number
): Deal {
  const amount = calculateCommissionAmount(totalCommission, agent.percentage);
  const newAgent: CommissionAgent = {
    ...agent,
    amount,
    status: agent.status ?? 'pending',
  };

  const agents = deal.financial.commission.agents ?? [];
  if (agents.some((a) => a.id === newAgent.id)) {
    throw new Error('Agent is already added to commission');
  }

  const updatedAgents = [...agents, newAgent];
  return {
    ...deal,
    financial: {
      ...deal.financial,
      commission: {
        ...deal.financial.commission,
        agents: updatedAgents,
      },
    },
  };
}

/**
 * Remove an agent from the deal's commission. Pure: returns new deal.
 */
export function removeAgentFromCommission(deal: Deal, agentId: string): Deal {
  const agents = deal.financial.commission.agents ?? [];
  if (agents.length === 0) {
    throw new Error('No agents found in commission');
  }

  const updatedAgents = agents.filter((a) => a.id !== agentId);
  return {
    ...deal,
    financial: {
      ...deal.financial,
      commission: {
        ...deal.financial.commission,
        agents: updatedAgents,
      },
    },
  };
}

/**
 * Migrate legacy commission (primaryAgent/secondaryAgent split) to agents[].
 * Idempotent: if agents already present, returns deal unchanged.
 */
export function migrateLegacyCommission(deal: Deal): Deal {
  if (
    deal.financial.commission.agents &&
    deal.financial.commission.agents.length > 0
  ) {
    return deal;
  }

  const agents: CommissionAgent[] = [];
  const split = deal.financial.commission.split;

  if (split?.primaryAgent && deal.agents?.primary) {
    agents.push({
      id: deal.agents.primary.id,
      type: 'internal',
      entityType: 'user',
      name: deal.agents.primary.name,
      percentage: split.primaryAgent.percentage,
      amount: split.primaryAgent.amount,
      status: (split.primaryAgent.status as CommissionAgent['status']) ?? 'pending',
    });
  }

  if (split?.secondaryAgent && deal.agents?.secondary) {
    agents.push({
      id: deal.agents.secondary.id,
      type: 'internal',
      entityType: 'user',
      name: deal.agents.secondary.name,
      percentage: split.secondaryAgent.percentage,
      amount: split.secondaryAgent.amount,
      status: (split.secondaryAgent.status as CommissionAgent['status']) ?? 'pending',
    });
  }

  return {
    ...deal,
    financial: {
      ...deal.financial,
      commission: {
        ...deal.financial.commission,
        agents,
      },
    },
  };
}
