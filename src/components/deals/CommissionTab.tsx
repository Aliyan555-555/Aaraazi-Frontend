/**
 * CommissionTab - Redesigned Simple & Intuitive Commission Management
 * 
 * REDESIGN GOALS:
 * - Single unified view (no confusing tabs)
 * - Inline editing (no edit mode toggle)
 * - Amount AND percentage support (toggle between input types)
 * - Real-time validation and visual feedback
 * - Support for manual adjustments to match real-world scenarios
 * 
 * FEATURES:
 * - Multi-agent support (internal + external)
 * - Agency split configuration
 * - Dual input mode: PKR amount ⇄ Percentage
 * - Visual allocation progress bar
 * - Inline status management (admin)
 * - Real-time calculation and validation
 * 
 * STRUCTURE:
 * 1. Header Card - Total commission configuration
 * 2. Allocation Progress - Visual breakdown
 * 3. Agent Rows - Inline editable agents
 * 4. Agency Row - Inline editable agency split
 * 5. Validation Footer - Real-time feedback
 */

import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../types';
import { Deal, CommissionAgent } from '../../types/deals';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CommissionStatusBadge, CommissionStatus } from './CommissionStatusBadge';
import { ChangeCommissionStatusModal } from './ChangeCommissionStatusModal';
import { AddAgentToCommissionModal } from './AddAgentToCommissionModal';
import { formatPKR } from '../../lib/currency';
import { updateDeal } from '../../lib/deals';
import {
  validateCommissionSplits,
  addAgentToCommission,
  removeAgentFromCommission,
  migrateLegacyCommission,
} from '../../lib/commissionAgents';
import { toast } from 'sonner';
import {
  DollarSign,
  Users,
  Building2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Info,
  Percent,
  Banknote,
  ArrowRightLeft,
  Home,
} from 'lucide-react';

interface CommissionTabProps {
  deal: Deal;
  user: User;
  isPrimary: boolean;
  onUpdate: (updatedDeal: Deal) => void;
}

type InputMode = 'percentage' | 'amount';

interface AgentEditState {
  mode: InputMode;
  value: string;
}

export function CommissionTab({ deal, user, isPrimary, onUpdate }: CommissionTabProps) {
  const isAdmin = user.role === 'admin';
  const canEdit = isAdmin || isPrimary;

  // Initialize and migrate legacy structure
  useEffect(() => {
    if (!deal.financial.commission.agents || deal.financial.commission.agents.length === 0) {
      const migratedDeal = migrateLegacyCommission(deal);
      onUpdate(migratedDeal);
    }
  }, [deal.id]);

  // State
  const [agents, setAgents] = useState<CommissionAgent[]>(
    deal.financial.commission.agents || []
  );
  const [commissionRate, setCommissionRate] = useState(
    deal.financial.commission.rate.toString()
  );
  const [payoutTrigger, setPayoutTrigger] = useState<string>(
    deal.financial.commission.payoutTrigger || 'full-payment'
  );

  // Agent edit states
  const [agentEditStates, setAgentEditStates] = useState<Record<string, AgentEditState>>({});

  // Agency edit state
  const [agencyMode, setAgencyMode] = useState<InputMode>('percentage');
  const [agencyValue, setAgencyValue] = useState(
    deal.financial.commission.split.agency.percentage.toString()
  );

  // Modals
  const [addAgentModalOpen, setAddAgentModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedAgentForStatus, setSelectedAgentForStatus] = useState<{
    agent: CommissionAgent;
    index: number;
  } | null>(null);

  // Sync state when deal changes
  useEffect(() => {
    setAgents(deal.financial.commission.agents || []);
    setCommissionRate(deal.financial.commission.rate.toString());
    setPayoutTrigger(deal.financial.commission.payoutTrigger || 'full-payment');
    setAgencyValue(deal.financial.commission.split.agency.percentage.toString());
  }, [deal.id]);

  // Calculations
  const totalCommission = useMemo(() => {
    const rate = parseFloat(commissionRate) || 0;
    return (deal.financial.agreedPrice * rate) / 100;
  }, [deal.financial.agreedPrice, commissionRate]);

  const agencyAmount = useMemo(() => {
    const pct = parseFloat(agencyValue) || 0;
    if (agencyMode === 'percentage') {
      return (totalCommission * pct) / 100;
    } else {
      return parseFloat(agencyValue) || 0;
    }
  }, [totalCommission, agencyValue, agencyMode]);

  const agencyPercentage = useMemo(() => {
    if (agencyMode === 'percentage') {
      return parseFloat(agencyValue) || 0;
    } else {
      const amt = parseFloat(agencyValue) || 0;
      return totalCommission > 0 ? (amt / totalCommission) * 100 : 0;
    }
  }, [totalCommission, agencyValue, agencyMode]);

  // Calculate agent amounts and percentages
  const processedAgents = useMemo(() => {
    return agents.map(agent => {
      const state = agentEditStates[agent.id];
      if (!state) {
        return {
          ...agent,
          displayPercentage: agent.percentage,
          displayAmount: agent.amount,
        };
      }

      const value = parseFloat(state.value) || 0;
      if (state.mode === 'percentage') {
        return {
          ...agent,
          displayPercentage: value,
          displayAmount: (totalCommission * value) / 100,
        };
      } else {
        return {
          ...agent,
          displayPercentage: totalCommission > 0 ? (value / totalCommission) * 100 : 0,
          displayAmount: value,
        };
      }
    });
  }, [agents, agentEditStates, totalCommission]);

  // Calculate totals
  const totalAllocatedPercentage = useMemo(() => {
    const agentTotal = processedAgents.reduce((sum, a) => sum + a.displayPercentage, 0);
    return agentTotal + agencyPercentage;
  }, [processedAgents, agencyPercentage]);

  const totalAllocatedAmount = useMemo(() => {
    const agentTotal = processedAgents.reduce((sum, a) => sum + a.displayAmount, 0);
    return agentTotal + agencyAmount;
  }, [processedAgents, agencyAmount]);

  const remainingAmount = totalCommission - totalAllocatedAmount;
  const remainingPercentage = 100 - totalAllocatedPercentage;

  const isValid = Math.abs(remainingPercentage) < 0.01 && remainingAmount >= -0.01;

  // Get agent input value
  const getAgentInputValue = (agentId: string, agent: CommissionAgent) => {
    const state = agentEditStates[agentId];
    if (state) return state.value;
    return agent.percentage.toString();
  };

  // Get agent mode
  const getAgentMode = (agentId: string): InputMode => {
    return agentEditStates[agentId]?.mode || 'percentage';
  };

  // Toggle agent input mode
  const toggleAgentMode = (agentId: string, currentMode: InputMode, agent: CommissionAgent) => {
    const newMode: InputMode = currentMode === 'percentage' ? 'amount' : 'percentage';
    const currentState = agentEditStates[agentId];

    let newValue: string;
    if (currentState) {
      const val = parseFloat(currentState.value) || 0;
      if (currentMode === 'percentage') {
        // Switching to amount
        newValue = ((totalCommission * val) / 100).toFixed(0);
      } else {
        // Switching to percentage
        newValue = (totalCommission > 0 ? (val / totalCommission) * 100 : 0).toFixed(2);
      }
    } else {
      // Initialize from agent data
      newValue = newMode === 'percentage'
        ? agent.percentage.toString()
        : agent.amount.toString();
    }

    setAgentEditStates(prev => ({
      ...prev,
      [agentId]: { mode: newMode, value: newValue },
    }));
  };

  // Update agent value
  const updateAgentValue = (agentId: string, value: string) => {
    const mode = getAgentMode(agentId);
    setAgentEditStates(prev => ({
      ...prev,
      [agentId]: { mode, value },
    }));
  };

  // Toggle agency mode
  const toggleAgencyMode = () => {
    const newMode: InputMode = agencyMode === 'percentage' ? 'amount' : 'percentage';

    let newValue: string;
    const val = parseFloat(agencyValue) || 0;
    if (agencyMode === 'percentage') {
      // Switching to amount
      newValue = ((totalCommission * val) / 100).toFixed(0);
    } else {
      // Switching to percentage
      newValue = (totalCommission > 0 ? (val / totalCommission) * 100 : 0).toFixed(2);
    }

    setAgencyMode(newMode);
    setAgencyValue(newValue);
  };

  // Save commission configuration
  const handleSaveConfiguration = () => {
    if (!canEdit) {
      toast.error('You do not have permission to edit commission');
      return;
    }

    if (!isValid) {
      toast.error('Commission splits must total 100%');
      return;
    }

    const rate = parseFloat(commissionRate);
    if (rate < 0.1 || rate > 100) {
      toast.error('Commission rate must be between 0.1% and 100%');
      return;
    }

    try {
      // Update agents with new values
      const updatedAgents = processedAgents.map(agent => ({
        ...agents.find(a => a.id === agent.id)!,
        percentage: agent.displayPercentage,
        amount: agent.displayAmount,
      }));

      const updatedDeal = updateDeal(deal.id, {
        financial: {
          ...deal.financial,
          commission: {
            ...deal.financial.commission,
            total: totalCommission,
            rate,
            payoutTrigger: payoutTrigger as any,
            agents: updatedAgents,
            split: {
              ...deal.financial.commission.split,
              agency: {
                ...deal.financial.commission.split.agency,
                percentage: agencyPercentage,
                amount: agencyAmount,
              },
            },
          },
        },
      });

      setAgents(updatedAgents);
      setAgentEditStates({});
      onUpdate(updatedDeal);
      toast.success('Commission configuration saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save commission');
    }
  };

  // Add agent
  const handleAddAgent = (newAgent: Omit<CommissionAgent, 'amount' | 'status'>) => {
    try {
      const updatedDeal = addAgentToCommission(deal.id, { ...newAgent, status: 'pending' }, totalCommission);
      setAgents(updatedDeal.financial.commission.agents || []);
      onUpdate(updatedDeal);
      setAddAgentModalOpen(false);
      toast.success(`${newAgent.name} added to commission`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add agent');
    }
  };

  // Remove agent
  const handleRemoveAgent = (agentId: string, agentName: string) => {
    if (!canEdit) {
      toast.error('You do not have permission to remove agents');
      return;
    }

    if (!confirm(`Remove ${agentName} from commission split?`)) return;

    try {
      const updatedDeal = removeAgentFromCommission(deal.id, agentId);
      setAgents(updatedDeal.financial.commission.agents || []);

      // Remove from edit states
      setAgentEditStates(prev => {
        const newState = { ...prev };
        delete newState[agentId];
        return newState;
      });

      onUpdate(updatedDeal);
      toast.success(`${agentName} removed from commission`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove agent');
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus: CommissionStatus, reason: string) => {
    if (!isAdmin) return;

    const now = new Date().toISOString();

    try {
      if (selectedAgentForStatus) {
        // Update agent status
        const updatedAgents = [...agents];
        const agent = updatedAgents[selectedAgentForStatus.index];

        agent.status = newStatus;

        if (newStatus === 'approved') {
          agent.approvedBy = user.name;
          agent.approvedAt = now;
        }

        if (newStatus === 'paid') {
          agent.paidDate = now;
        }

        if (reason) {
          agent.notes = reason;
        }

        const updatedDeal = updateDeal(deal.id, {
          financial: {
            ...deal.financial,
            commission: {
              ...deal.financial.commission,
              agents: updatedAgents,
            },
          },
        });

        setAgents(updatedAgents);
        onUpdate(updatedDeal);
        toast.success(`Commission status updated to ${newStatus}`);
      } else {
        // Update agency status
        const updatedDeal = updateDeal(deal.id, {
          financial: {
            ...deal.financial,
            commission: {
              ...deal.financial.commission,
              split: {
                ...deal.financial.commission.split,
                agency: {
                  ...deal.financial.commission.split.agency,
                  status: newStatus,
                  notes: reason || deal.financial.commission.split.agency.notes,
                },
              },
            },
          },
        });

        onUpdate(updatedDeal);
        toast.success(`Agency commission status updated to ${newStatus}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card - Total Commission Configuration */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Commission Management</h2>
            <p className="text-sm text-gray-600">
              Configure and track commission splits across agents and agency
            </p>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Commission */}
          <div>
            <Label htmlFor="commission-rate" className="mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              Commission Rate (%)
            </Label>
            <Input
              id="commission-rate"
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              min="0.1"
              max="100"
              step="0.1"
              disabled={!canEdit}
              className="mt-1"
            />
            <p className="text-sm text-gray-600 mt-2">
              Total: {formatPKR(totalCommission)}
            </p>
          </div>

          {/* Deal Price (Read-only) */}
          <div>
            <Label className="mb-2 flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-600" />
              Deal Price
            </Label>
            <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 mt-1">
              <p className="font-medium text-gray-900">{formatPKR(deal.financial.agreedPrice)}</p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Base amount for commission
            </p>
          </div>

          {/* Payout Trigger */}
          <div>
            <Label htmlFor="payout-trigger" className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-600" />
              Payout Trigger
            </Label>
            <Select
              value={payoutTrigger}
              onValueChange={setPayoutTrigger}
              disabled={!canEdit}
            >
              <SelectTrigger id="payout-trigger" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="booking">At Booking</SelectItem>
                <SelectItem value="50-percent">At 50% Payment</SelectItem>
                <SelectItem value="possession">At Possession</SelectItem>
                <SelectItem value="full-payment">At Full Payment</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-2">
              When commission is paid
            </p>
          </div>
        </div>

        {/* Save Button */}
        {canEdit && (
          <div className="flex justify-end">
            <Button
              onClick={handleSaveConfiguration}
              disabled={!isValid}
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        )}
      </Card>

      {/* Allocation Progress Bar */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Commission Allocation</h3>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Allocated</p>
                <p className={`font-semibold ${isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {totalAllocatedPercentage.toFixed(2)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`font-semibold ${Math.abs(remainingPercentage) < 0.01 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                  {remainingPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          <Progress
            value={Math.min(totalAllocatedPercentage, 100)}
            className={`h-3 ${isValid ? 'bg-green-100' : 'bg-red-100'
              }`}
          />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Allocated Amount</p>
              <p className="font-semibold text-gray-900">{formatPKR(totalAllocatedAmount)}</p>
            </div>
            <div>
              <p className="text-gray-600">Remaining Amount</p>
              <p className={`font-semibold ${Math.abs(remainingAmount) < 1 ? 'text-green-600' : 'text-orange-600'
                }`}>
                {formatPKR(remainingAmount)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Agents Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold mb-1">Agent Commissions</h3>
            <p className="text-sm text-gray-600">
              {agents.length} {agents.length === 1 ? 'agent' : 'agents'} • {' '}
              {agents.filter(a => a.type === 'internal').length} internal, {' '}
              {agents.filter(a => a.type === 'external').length} external
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setAddAgentModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          )}
        </div>

        {agents.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No agents added to commission yet</p>
            {canEdit && (
              <Button onClick={() => setAddAgentModalOpen(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add First Agent
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {processedAgents.map((agent, index) => {
              const mode = getAgentMode(agent.id);
              const value = getAgentInputValue(agent.id, agent);
              const originalAgent = agents[index];

              return (
                <div
                  key={agent.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <Badge
                          variant="secondary"
                          className={agent.type === 'external'
                            ? 'bg-orange-100 text-orange-800 border-orange-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                          }
                        >
                          {agent.type === 'internal' ? 'Internal' : 'External'}
                        </Badge>
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            if (isAdmin) {
                              setSelectedAgentForStatus({ agent: originalAgent, index });
                              setStatusModalOpen(true);
                            }
                          }}
                        >
                          <CommissionStatusBadge
                            status={originalAgent.status}
                          />
                        </div>
                      </div>
                      {agent.email && (
                        <p className="text-sm text-gray-600">{agent.email}</p>
                      )}
                    </div>
                    {canEdit && agents.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAgent(agent.id, agent.name)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>

                  {/* Input Row */}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7">
                      <Label htmlFor={`agent-${agent.id}`} className="text-xs mb-1">
                        {mode === 'percentage' ? 'Percentage' : 'Amount'}
                      </Label>
                      <div className="relative">
                        <Input
                          id={`agent-${agent.id}`}
                          type="number"
                          value={value}
                          onChange={(e) => updateAgentValue(agent.id, e.target.value)}
                          min="0"
                          step={mode === 'percentage' ? '0.1' : '1'}
                          disabled={!canEdit}
                          className="pr-12"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                          {mode === 'percentage' ? '%' : 'PKR'}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAgentMode(agent.id, mode, originalAgent)}
                        disabled={!canEdit}
                        className="w-full"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="col-span-2 text-right pb-2">
                      <p className="text-xs text-gray-600 mb-0.5">
                        {mode === 'percentage' ? 'Amount' : '%'}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {mode === 'percentage'
                          ? formatPKR(agent.displayAmount)
                          : `${agent.displayPercentage.toFixed(2)}%`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {originalAgent.notes && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="text-xs text-blue-800">
                        <Info className="h-3 w-3 inline mr-1" />
                        {originalAgent.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Agency Section */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="font-semibold mb-1">Agency Commission</h3>
          <p className="text-sm text-gray-600">
            Agency's portion of the total commission
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-gray-600" />
                <p className="font-medium text-gray-900">Agency Split</p>
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    if (isAdmin) {
                      setSelectedAgentForStatus(null);
                      setStatusModalOpen(true);
                    }
                  }}
                >
                  <CommissionStatusBadge
                    status={(deal.financial.commission.split.agency.status as CommissionStatus) || 'pending'}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Portion retained by the agency
              </p>
            </div>
          </div>

          {/* Input Row */}
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-7">
              <Label htmlFor="agency-commission" className="text-xs mb-1">
                {agencyMode === 'percentage' ? 'Percentage' : 'Amount'}
              </Label>
              <div className="relative">
                <Input
                  id="agency-commission"
                  type="number"
                  value={agencyValue}
                  onChange={(e) => setAgencyValue(e.target.value)}
                  min="0"
                  step={agencyMode === 'percentage' ? '0.1' : '1'}
                  disabled={!canEdit}
                  className="pr-12"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                  {agencyMode === 'percentage' ? '%' : 'PKR'}
                </div>
              </div>
            </div>
            <div className="col-span-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAgencyMode}
                disabled={!canEdit}
                className="w-full"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="col-span-2 text-right pb-2">
              <p className="text-xs text-gray-600 mb-0.5">
                {agencyMode === 'percentage' ? 'Amount' : '%'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {agencyMode === 'percentage'
                  ? formatPKR(agencyAmount)
                  : `${agencyPercentage.toFixed(2)}%`
                }
              </p>
            </div>
          </div>

          {/* Additional Info */}
          {deal.financial.commission.split.agency.notes && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-xs text-blue-800">
                <Info className="h-3 w-3 inline mr-1" />
                {deal.financial.commission.split.agency.notes}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Validation Footer */}
      <Card className={`p-4 ${isValid
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
        }`}>
        <div className="flex items-start gap-3">
          {isValid ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  Commission allocation is valid
                </p>
                <p className="text-sm text-green-700 mt-1">
                  All splits total exactly 100% ({formatPKR(totalCommission)})
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900">
                  Commission allocation incomplete
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {totalAllocatedPercentage > 100
                    ? `Over-allocated by ${(totalAllocatedPercentage - 100).toFixed(2)}% (${formatPKR(Math.abs(remainingAmount))})`
                    : `Under-allocated by ${(100 - totalAllocatedPercentage).toFixed(2)}% (${formatPKR(remainingAmount)})`
                  }
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Add Agent Modal */}
      <AddAgentToCommissionModal
        open={addAgentModalOpen}
        onClose={() => setAddAgentModalOpen(false)}
        currentAgents={agents}
        agencyPercentage={agencyPercentage}
        totalCommission={totalCommission}
        onAdd={handleAddAgent}
      />

      {/* Status Change Modal */}
      {statusModalOpen && (
        <ChangeCommissionStatusModal
          open={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedAgentForStatus(null);
          }}
          currentStatus={
            selectedAgentForStatus
              ? selectedAgentForStatus.agent.status
              : (deal.financial.commission.split.agency.status as CommissionStatus) || 'pending'
          }
          agentName={selectedAgentForStatus ? selectedAgentForStatus.agent.name : 'Agency'}
          splitType={selectedAgentForStatus ? 'primary' : 'agency'}
          onConfirm={(newStatus, reason) => {
            handleStatusChange(newStatus, reason);
            setStatusModalOpen(false);
            setSelectedAgentForStatus(null);
          }}
        />
      )}
    </div>
  );
}
