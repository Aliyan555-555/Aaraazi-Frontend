/**
 * CommissionTab Component - Multi-Agent Support
 * 
 * Comprehensive commission management with support for:
 * - Multiple internal agents
 * - External brokers
 * - Flexible splits
 * - Status tracking per agent
 * - Backward compatibility with legacy structure
 * 
 * Features:
 * - Add/Remove agents dynamically
 * - Edit commission structure
 * - Status management (Admin only)
 * - Real-time validation
 * - Agency split configuration
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Deal, User } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CommissionSplitCard } from './CommissionSplitCard';
import { CommissionStatusBadge, CommissionStatus } from './CommissionStatusBadge';
import { ChangeCommissionStatusModal } from './ChangeCommissionStatusModal';
import { AddAgentToCommissionModal } from './AddAgentToCommissionModal';
import { formatPKR } from '../../lib/currency';
import { updateDeal } from '../../lib/deals';
import {
  CommissionAgent,
  validateCommissionSplits,
  addAgentToCommission,
  removeAgentFromCommission,
  updateAgentCommissionPercentage,
  recalculateCommissionAmounts,
  migrateLegacyCommission,
} from '../../lib/commissionAgents';
import { toast } from 'sonner';
import {
  DollarSign,
  Users,
  Building2,
  Edit,
  Save,
  X,
  AlertCircle,
  TrendingUp,
  Info,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { Progress } from '../ui/progress';

interface CommissionTabProps {
  deal: Deal;
  user: User;
  isPrimary: boolean;
  onUpdate: (updatedDeal: Deal) => void;
}

export function CommissionTab({ deal, user, isPrimary, onUpdate }: CommissionTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRate, setEditedRate] = useState(deal.financial.commission.rate.toString());
  const [editedAgencyPct, setEditedAgencyPct] = useState(
    deal.financial.commission.split.agency.percentage.toString()
  );
  const [payoutTrigger, setPayoutTrigger] = useState<string>(
    deal.financial.commission.payoutTrigger || 'full-payment'
  );
  const [agents, setAgents] = useState<CommissionAgent[]>([]);
  
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [addAgentModalOpen, setAddAgentModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{
    agent: CommissionAgent;
    index: number;
  } | null>(null);

  const isAdmin = user.role === 'admin';
  const canEdit = isAdmin || isPrimary;

  // Initialize and migrate legacy structure
  useEffect(() => {
    let currentDeal = deal;
    
    // Migrate legacy structure if needed
    if (!deal.financial.commission.agents || deal.financial.commission.agents.length === 0) {
      currentDeal = migrateLegacyCommission(deal);
      onUpdate(currentDeal);
    }
    
    // Set agents from deal
    if (currentDeal.financial.commission.agents) {
      setAgents([...currentDeal.financial.commission.agents]);
    }
  }, [deal.id]); // Only run when deal changes

  // Calculate totals
  const totalCommission = deal.financial.commission.total;
  const agency = deal.financial.commission.split.agency;

  // Calculate used percentage
  const usedPercentage = useMemo(() => {
    const agentTotal = agents.reduce((sum, agent) => sum + agent.percentage, 0);
    return agentTotal + parseFloat(editedAgencyPct || '0');
  }, [agents, editedAgencyPct]);

  // Validation
  const validation = useMemo(() => {
    return validateCommissionSplits(agents, parseFloat(editedAgencyPct || '0'));
  }, [agents, editedAgencyPct]);

  // Handle save
  const handleSave = () => {
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    const rate = parseFloat(editedRate);
    if (rate < 0.1 || rate > 100) {
      toast.error('Commission rate must be between 0.1% and 100%');
      return;
    }

    const agencyPct = parseFloat(editedAgencyPct);
    const newTotal = (deal.financial.agreedPrice * rate) / 100;

    // Recalculate all agent amounts
    const updatedAgents = agents.map(agent => ({
      ...agent,
      amount: (newTotal * agent.percentage) / 100,
    }));

    const agencyAmt = (newTotal * agencyPct) / 100;

    try {
      const updatedDeal = updateDeal(deal.id, {
        financial: {
          ...deal.financial,
          commission: {
            ...deal.financial.commission,
            total: newTotal,
            rate,
            payoutTrigger: payoutTrigger as any,
            agents: updatedAgents,
            split: {
              ...deal.financial.commission.split,
              agency: {
                ...agency,
                percentage: agencyPct,
                amount: agencyAmt,
              },
            },
          },
        },
      });

      setAgents(updatedAgents);
      onUpdate(updatedDeal);
      setIsEditing(false);
      toast.success('Commission structure updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update commission');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditedRate(deal.financial.commission.rate.toString());
    setEditedAgencyPct(deal.financial.commission.split.agency.percentage.toString());
    setPayoutTrigger(deal.financial.commission.payoutTrigger || 'full-payment');
    setAgents(deal.financial.commission.agents ? [...deal.financial.commission.agents] : []);
    setIsEditing(false);
  };

  // Handle add agent
  const handleAddAgent = (newAgent: Omit<CommissionAgent, 'amount' | 'status'>) => {
    try {
      const updatedDeal = addAgentToCommission(deal.id, newAgent, totalCommission);
      setAgents(updatedDeal.financial.commission.agents || []);
      onUpdate(updatedDeal);
      setAddAgentModalOpen(false);
      toast.success(`${newAgent.name} added to commission`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add agent');
    }
  };

  // Handle remove agent
  const handleRemoveAgent = (agentId: string, agentName: string) => {
    if (!confirm(`Remove ${agentName} from commission split?`)) return;

    try {
      const updatedDeal = removeAgentFromCommission(deal.id, agentId);
      setAgents(updatedDeal.financial.commission.agents || []);
      onUpdate(updatedDeal);
      toast.success(`${agentName} removed from commission`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove agent');
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus: CommissionStatus, reason: string) => {
    if (!selectedAgent || !isAdmin) return;

    const now = new Date().toISOString();
    
    try {
      const updatedAgents = [...agents];
      const agent = updatedAgents[selectedAgent.index];
      
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  // Handle agency status change
  const handleAgencyStatusChange = (newStatus: CommissionStatus, reason: string) => {
    if (!isAdmin) return;

    try {
      const updatedDeal = updateDeal(deal.id, {
        financial: {
          ...deal.financial,
          commission: {
            ...deal.financial.commission,
            split: {
              ...deal.financial.commission.split,
              agency: {
                ...agency,
                status: newStatus,
                notes: reason || agency.notes,
              },
            },
          },
        },
      });

      onUpdate(updatedDeal);
      toast.success(`Agency commission status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update agency status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Edit Controls */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Commission Management</h2>
            <p className="text-sm text-gray-600">
              Manage commission splits across multiple agents and track payment status
            </p>
          </div>
          
          {canEdit && !isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Commission
            </Button>
          )}
          
          {isEditing && (
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                size="sm"
                disabled={!validation.valid}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-gray-600">Total Commission</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{formatPKR(totalCommission)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {deal.financial.commission.rate}% of {formatPKR(deal.financial.agreedPrice)}
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-600" />
              <p className="text-sm text-gray-600">Total Agents</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {agents.length} {agents.length === 1 ? 'Agent' : 'Agents'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {agents.filter(a => a.type === 'internal').length} Internal, {agents.filter(a => a.type === 'external').length} External
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-gray-600" />
              <p className="text-sm text-gray-600">Agency Split</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {agency.percentage}%
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {formatPKR(agency.amount)}
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Agent Commission Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Agent Commissions</h3>
              {canEdit && !isEditing && (
                <Button onClick={() => setAddAgentModalOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agent
                </Button>
              )}
            </div>

            {agents.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No agents added to commission yet
                </p>
                {canEdit && (
                  <Button onClick={() => setAddAgentModalOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Agent
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {agents.map((agent, index) => (
                  <div key={agent.id} className="space-y-3">
                    <CommissionSplitCard
                      type={agent.type}
                      name={agent.name}
                      percentage={agent.percentage}
                      amount={agent.amount}
                      status={agent.status}
                      payoutTrigger={deal.financial.commission.payoutTrigger}
                      paidDate={agent.paidDate}
                      approvedBy={agent.approvedBy}
                      approvedAt={agent.approvedAt}
                      notes={agent.notes}
                      email={agent.email}
                      phone={agent.phone}
                    />
                    
                    <div className="flex gap-2">
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedAgent({ agent, index });
                            setStatusModalOpen(true);
                          }}
                        >
                          Change Status
                        </Button>
                      )}
                      {canEdit && !isEditing && agents.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAgent(agent.id, agent.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agency Split */}
          <div>
            <h3 className="font-semibold mb-4">Agency Commission</h3>
            <CommissionSplitCard
              type="agency"
              name="Agency Commission"
              percentage={agency.percentage}
              amount={agency.amount}
              status={(agency.status as CommissionStatus) || 'pending'}
              notes={agency.notes}
            />
            
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSelectedAgent(null);
                  setStatusModalOpen(true);
                }}
              >
                Change Agency Status
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Configure Tab */}
        <TabsContent value="configure" className="space-y-6 mt-6">
          {!canEdit ? (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Only the primary agent or admin can modify commission settings
              </p>
            </Card>
          ) : !isEditing ? (
            <Card className="p-8 text-center">
              <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Click "Edit Commission" to modify the commission structure
              </p>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="font-semibold mb-6">Commission Configuration</h3>

              <div className="space-y-6">
                {/* Commission Rate */}
                <div>
                  <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                  <Input
                    id="commission-rate"
                    type="number"
                    value={editedRate}
                    onChange={(e) => setEditedRate(e.target.value)}
                    min="0.1"
                    max="100"
                    step="0.1"
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {formatPKR((deal.financial.agreedPrice * (parseFloat(editedRate) || 0)) / 100)}
                  </p>
                </div>

                {/* Payout Trigger */}
                <div>
                  <Label htmlFor="payout-trigger">Payout Trigger</Label>
                  <Select value={payoutTrigger} onValueChange={setPayoutTrigger}>
                    <SelectTrigger id="payout-trigger" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">At Booking</SelectItem>
                      <SelectItem value="50-percent">At 50% Payment</SelectItem>
                      <SelectItem value="possession">At Possession</SelectItem>
                      <SelectItem value="full-payment">At Full Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Split Management */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Commission Distribution</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className={`font-semibold ${
                        Math.abs(usedPercentage - 100) < 0.01 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {usedPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <Progress 
                    value={usedPercentage} 
                    className={`h-2 ${
                      Math.abs(usedPercentage - 100) < 0.01 ? '' : 'bg-red-100'
                    }`}
                  />

                  {/* Agents List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Agents ({agents.length})</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAddAgentModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Agent
                      </Button>
                    </div>

                    {agents.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600">No agents added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {agents.map((agent) => (
                          <div key={agent.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{agent.name}</p>
                                  <Badge 
                                    variant="secondary"
                                    className={agent.type === 'external' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}
                                  >
                                    {agent.type === 'internal' ? 'Internal' : 'External'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {agent.percentage}% • {formatPKR((totalCommission * agent.percentage) / 100)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAgent(agent.id, agent.name)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Agency Split */}
                  <div>
                    <Label htmlFor="agency-pct">Agency Split (%)</Label>
                    <Input
                      id="agency-pct"
                      type="number"
                      value={editedAgencyPct}
                      onChange={(e) => setEditedAgencyPct(e.target.value)}
                      min="0"
                      max="20"
                      step="0.1"
                      className="mt-2"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Amount: {formatPKR(((deal.financial.agreedPrice * (parseFloat(editedRate) || 0)) / 100) * (parseFloat(editedAgencyPct) || 0) / 100)}
                    </p>
                  </div>
                </div>

                {/* Validation Message */}
                {!validation.valid && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">Validation Error</p>
                        <p className="text-sm text-red-700 mt-1">{validation.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {validation.valid && agents.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-800">
                        Commission splits are valid and total 100%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Agent Modal */}
      <AddAgentToCommissionModal
        open={addAgentModalOpen}
        onClose={() => setAddAgentModalOpen(false)}
        currentAgents={agents}
        agencyPercentage={parseFloat(editedAgencyPct || '0')}
        totalCommission={totalCommission}
        onAdd={handleAddAgent}
      />

      {/* Status Change Modal */}
      {statusModalOpen && (
        <ChangeCommissionStatusModal
          open={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedAgent(null);
          }}
          currentStatus={selectedAgent ? selectedAgent.agent.status : (agency.status as CommissionStatus) || 'pending'}
          agentName={selectedAgent ? selectedAgent.agent.name : 'Agency'}
          splitType={selectedAgent ? 'primary' : 'agency'}
          onConfirm={(newStatus, reason) => {
            if (selectedAgent) {
              handleStatusChange(newStatus, reason);
            } else {
              handleAgencyStatusChange(newStatus, reason);
            }
            setStatusModalOpen(false);
            setSelectedAgent(null);
          }}
        />
      )}
    </div>
  );
}