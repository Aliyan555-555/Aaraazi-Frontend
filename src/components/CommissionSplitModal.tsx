import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Trash2, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { formatPKR } from '../lib/currency';

interface CommissionSplitModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (splits: Array<{ agentId: string; agentName: string; percentage: number }>) => void;
  totalAmount: number;
  availableAgents: Array<{ id: string; name: string }>;
}

export function CommissionSplitModal({ 
  open, 
  onClose, 
  onSave, 
  totalAmount,
  availableAgents 
}: CommissionSplitModalProps) {
  const [splits, setSplits] = useState<Array<{
    agentId: string;
    agentName: string;
    percentage: number;
  }>>([
    { agentId: '', agentName: '', percentage: 50 },
    { agentId: '', agentName: '', percentage: 50 }
  ]);

  const totalPercentage = splits.reduce((sum, split) => sum + Number(split.percentage || 0), 0);
  const isValid = totalPercentage === 100 && splits.every(s => s.agentId && s.percentage > 0);

  // Reset to default when dialog opens
  useEffect(() => {
    if (open) {
      setSplits([
        { agentId: '', agentName: '', percentage: 50 },
        { agentId: '', agentName: '', percentage: 50 }
      ]);
    }
  }, [open]);

  const addSplit = () => {
    if (splits.length >= 5) {
      toast.error('Maximum 5 agents can split a commission');
      return;
    }
    
    const remainingPercentage = 100 - totalPercentage;
    setSplits([...splits, { 
      agentId: '', 
      agentName: '', 
      percentage: remainingPercentage > 0 ? remainingPercentage : 0 
    }]);
  };

  const removeSplit = (index: number) => {
    if (splits.length <= 1) {
      toast.error('At least one agent must receive commission');
      return;
    }
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (index: number, field: string, value: any) => {
    const newSplits = [...splits];
    if (field === 'agentId') {
      const agent = availableAgents.find(a => a.id === value);
      newSplits[index].agentId = value;
      newSplits[index].agentName = agent?.name || '';
    } else if (field === 'percentage') {
      const numValue = Number(value);
      if (numValue < 0 || numValue > 100) {
        toast.error('Percentage must be between 0 and 100');
        return;
      }
      newSplits[index].percentage = numValue;
    }
    setSplits(newSplits);
  };

  const handleSave = () => {
    if (!isValid) {
      if (totalPercentage !== 100) {
        toast.error('Total percentage must equal 100%');
      } else {
        toast.error('Please select all agents and set valid percentages');
      }
      return;
    }
    
    // Check for duplicate agents
    const agentIds = splits.map(s => s.agentId);
    const uniqueAgentIds = new Set(agentIds);
    if (agentIds.length !== uniqueAgentIds.size) {
      toast.error('Same agent cannot appear multiple times');
      return;
    }
    
    onSave(splits);
    toast.success('Commission split configured successfully');
    onClose();
  };

  const distributeEvenly = () => {
    const evenPercentage = Math.floor(100 / splits.length);
    const remainder = 100 - (evenPercentage * splits.length);
    
    const newSplits = splits.map((split, index) => ({
      ...split,
      percentage: index === 0 ? evenPercentage + remainder : evenPercentage
    }));
    
    setSplits(newSplits);
    toast.success('Percentages distributed evenly');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Split Commission
          </DialogTitle>
          <DialogDescription>
            Divide commission among multiple agents for team deals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="p-4 bg-muted/50">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-medium">{formatPKR(totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Percentage</p>
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${
                    totalPercentage === 100 ? 'text-green-600' : 
                    totalPercentage > 100 ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>
                    {totalPercentage}%
                  </p>
                  {totalPercentage === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Agents</p>
                <p className="font-medium">{splits.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`font-medium ${
                  100 - totalPercentage === 0 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {100 - totalPercentage}%
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Action */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={distributeEvenly}
              disabled={splits.length === 0}
            >
              Distribute Evenly
            </Button>
          </div>

          {/* Splits Configuration */}
          <div className="space-y-3">
            <Label>Commission Splits</Label>
            
            {splits.map((split, index) => (
              <Card key={index} className="p-4">
                <div className="flex gap-3 items-start">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Agent</Label>
                        <Select
                          value={split.agentId}
                          onValueChange={(value) => updateSplit(index, 'agentId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select agent" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAgents.map(agent => (
                              <SelectItem 
                                key={agent.id} 
                                value={agent.id}
                                disabled={splits.some((s, i) => s.agentId === agent.id && i !== index)}
                              >
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Percentage</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={split.percentage}
                            onChange={(e) => updateSplit(index, 'percentage', e.target.value)}
                            className="flex-1"
                          />
                          <span className="flex items-center text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Commission Amount:
                      </span>
                      <span className="font-medium">
                        {formatPKR((totalAmount * split.percentage) / 100)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSplit(index)}
                    disabled={splits.length === 1}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={addSplit} 
            className="w-full"
            disabled={splits.length >= 5}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Agent
          </Button>

          {/* Validation Messages */}
          {totalPercentage !== 100 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Percentage Mismatch</p>
                <p>
                  {totalPercentage > 100 
                    ? `Total exceeds 100% by ${totalPercentage - 100}%` 
                    : `Total is ${100 - totalPercentage}% short of 100%`}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Split Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
