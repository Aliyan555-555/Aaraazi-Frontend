import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  User,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { calculateCommissionAmount } from '@/lib/commissionAgents';
import { useInternalAgents, useExternalBrokers } from '@/hooks/useCommissionAgents';
import { formatPKR } from '@/lib/currency';
import { CommissionAgent } from '@/types/deals';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
interface AddAgentToCommissionModalProps {
  open: boolean;
  onClose: () => void;
  currentAgents: CommissionAgent[];
  agencyPercentage: number;
  totalCommission: number;
  onAdd: (agent: Omit<CommissionAgent, 'amount' | 'status'>) => void;
}

export function AddAgentToCommissionModal({
  open,
  onClose,
  currentAgents,
  agencyPercentage,
  totalCommission,
  onAdd,
}: AddAgentToCommissionModalProps) {
  const [selectedAgentType, setSelectedAgentType] = useState<'internal' | 'external'>('internal');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [percentage, setPercentage] = useState('');
  const [notes, setNotes] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Service layer via hooks – internal from auth, external from contacts API when modal opens
  const internalAgents = useInternalAgents();
  const { brokers: externalBrokers } = useExternalBrokers(open);

  // Filter out already added agents
  const availableInternalAgents = useMemo(
    () => internalAgents.filter((a: { id: string }) => !currentAgents.some(ca => ca.id === a.id)),
    [internalAgents, currentAgents]
  );

  const availableExternalBrokers = useMemo(
    () => externalBrokers.filter((b) => !currentAgents.some(ca => ca.id === b.id)),
    [externalBrokers, currentAgents]
  );

  // Calculate remaining percentage
  const usedPercentage = currentAgents.reduce((sum, a) => sum + a.percentage, 0) + agencyPercentage;
  const remainingPercentage = 100 - usedPercentage;

  // Calculate amount in real-time
  const calculatedAmount = useMemo(() => {
    const pct = parseFloat(percentage) || 0;
    return calculateCommissionAmount(totalCommission, pct);
  }, [percentage, totalCommission]);

  // Validate
  const validate = () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return false;
    }

    const pct = parseFloat(percentage);
    if (!pct || pct <= 0) {
      toast.error('Please enter a valid percentage');
      return false;
    }

    if (pct > remainingPercentage) {
      toast.error(`Percentage cannot exceed remaining ${remainingPercentage.toFixed(1)}%`);
      return false;
    }

    return true;
  };

  // Handle add
  const handleAdd = () => {
    if (!validate()) return;

    try {
      const newAgent: Omit<CommissionAgent, 'amount' | 'status'> = {
        id: selectedAgent.id,
        type: selectedAgentType,
        entityType: selectedAgentType === 'internal' ? 'user' : 'contact',
        name: selectedAgent.name,
        email: selectedAgent.email,
        phone: selectedAgent.phone,
        percentage: parseFloat(percentage),
        notes: notes || undefined,
      };

      console.log('🔧 Adding agent to commission:', newAgent);

      // Call the onAdd callback - this will handle the actual addition
      onAdd(newAgent);

      // Only reset and close if successful (no error thrown)
      // Note: The parent component (CommissionTab) will show success toast
      setSelectedAgent(null);
      setPercentage('');
      setNotes('');

    } catch (error: any) {
      console.error('❌ Error adding agent:', error);
      toast.error(error.message || 'Failed to add agent');
    }
  };

  const handleClose = () => {
    setSelectedAgent(null);
    setPercentage('');
    setNotes('');
    setSelectedAgentType('internal');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Agent to Commission</DialogTitle>
          <DialogDescription>
            Select an agent and specify their commission percentage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agent Type Tabs */}
          <Tabs value={selectedAgentType} onValueChange={(v: any) => {
            setSelectedAgentType(v);
            setSelectedAgent(null);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="internal">
                <User className="h-4 w-4 mr-2" />
                Internal Agents
                <Badge variant="secondary" className="ml-2">
                  {availableInternalAgents.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="external">
                <Building2 className="h-4 w-4 mr-2" />
                External Brokers
                <Badge variant="secondary" className="ml-2">
                  {availableExternalBrokers.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Internal Agents Tab */}
            <TabsContent value="internal" className="space-y-4 mt-4">
              <div>
                <Label>Select Internal Agent</Label>
                <Popover open={searchOpen && selectedAgentType === 'internal'} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between mt-2"
                    >
                      {selectedAgent && selectedAgentType === 'internal'
                        ? selectedAgent.name
                        : "Select agent..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search agents..." />
                      <CommandEmpty>No agents found.</CommandEmpty>
                      <CommandGroup>
                        {availableInternalAgents.map((agent: { id: string; name: string; email?: string }) => (
                          <CommandItem
                            key={agent.id}
                            value={agent.name}
                            onSelect={() => {
                              setSelectedAgent(agent);
                              setSearchOpen(false);
                            }}
                          >
                            <User className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-sm text-gray-500">{agent.email}</p>
                            </div>
                            {selectedAgent?.id === agent.id && (
                              <CheckCircle2 className="ml-2 h-4 w-4 text-green-600" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </TabsContent>

            {/* External Brokers Tab */}
            <TabsContent value="external" className="space-y-4 mt-4">
              <div>
                <Label>Select External Broker</Label>
                <Popover open={searchOpen && selectedAgentType === 'external'} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between mt-2"
                    >
                      {selectedAgent && selectedAgentType === 'external'
                        ? selectedAgent.name
                        : "Select broker..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search brokers..." />
                      <CommandEmpty>No external brokers found.</CommandEmpty>
                      <CommandGroup>
                        {availableExternalBrokers.map((broker: any) => (
                          <CommandItem
                            key={broker.id}
                            value={broker.name}
                            onSelect={() => {
                              setSelectedAgent(broker);
                              setSearchOpen(false);
                            }}
                          >
                            <Building2 className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <p className="font-medium">{broker.name}</p>
                              <p className="text-sm text-gray-500">
                                {broker.phone} {broker.email && `• ${broker.email}`}
                              </p>
                            </div>
                            {selectedAgent?.id === broker.id && (
                              <CheckCircle2 className="ml-2 h-4 w-4 text-green-600" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {availableExternalBrokers.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">No External Brokers Found</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Add contacts with type "External Broker" in the Contacts section to use them here.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Selected Agent Info */}
          {selectedAgent && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-300">
                  {selectedAgentType === 'internal' ? (
                    <User className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Building2 className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedAgent.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="secondary">
                      {selectedAgentType === 'internal' ? 'Internal Agent' : 'External Broker'}
                    </Badge>
                    {selectedAgent.email && (
                      <span className="text-sm text-gray-600">{selectedAgent.email}</span>
                    )}
                    {selectedAgent.phone && (
                      <span className="text-sm text-gray-600">{selectedAgent.phone}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commission Percentage */}
          <div>
            <Label htmlFor="percentage">
              Commission Percentage
              <span className="text-sm text-gray-500 ml-2">
                (Remaining: {remainingPercentage.toFixed(1)}%)
              </span>
            </Label>
            <Input
              id="percentage"
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              min="0.1"
              max={remainingPercentage}
              step="0.1"
              placeholder="0.0"
              className="mt-2"
            />
            {percentage && (
              <p className="text-sm text-gray-600 mt-1">
                Amount: {formatPKR(calculatedAmount)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this commission split..."
              className="mt-2"
            />
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Commission</p>
                <p className="font-semibold">{formatPKR(totalCommission)}</p>
              </div>
              <div>
                <p className="text-gray-600">Current Allocation</p>
                <p className="font-semibold">{usedPercentage.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-600">Remaining</p>
                <p className="font-semibold text-blue-700">{remainingPercentage.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-600">After Adding</p>
                <p className="font-semibold">
                  {(100 - remainingPercentage + (parseFloat(percentage) || 0)).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedAgent || !percentage}>
            Add Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}