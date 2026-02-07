import { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Archive, 
  UserPlus, 
  TrendingUp, 
  Download,
  Share2,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Property } from '../../types';
import { toast } from 'sonner';

interface BulkPropertyActionsProps {
  selectedProperties: Property[];
  allProperties: Property[];
  onSelectionChange: (ids: string[]) => void;
  onBulkAction: (action: string, params?: any) => void;
  availableAgents: Array<{ id: string; name: string }>;
}

export function BulkPropertyActions({
  selectedProperties,
  allProperties,
  onSelectionChange,
  onBulkAction,
  availableAgents
}: BulkPropertyActionsProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [priceAdjustment, setPriceAdjustment] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [pendingAction, setPendingAction] = useState<{ action: string; label: string } | null>(null);

  const isAllSelected = selectedProperties.length === allProperties.length && allProperties.length > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allProperties.map(p => p.id));
    }
  };

  const handleBulkStatusUpdate = () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    onBulkAction('update-status', { status: selectedStatus });
    setShowStatusModal(false);
    setSelectedStatus('');
  };

  const handleBulkAgentAssignment = () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }
    onBulkAction('assign-agent', { agentId: selectedAgent });
    setShowAgentModal(false);
    setSelectedAgent('');
  };

  const handleBulkPriceAdjustment = () => {
    const adjustment = parseFloat(priceAdjustment);
    if (isNaN(adjustment) || adjustment === 0) {
      toast.error('Please enter a valid adjustment value');
      return;
    }
    onBulkAction('adjust-price', { 
      adjustment, 
      type: adjustmentType 
    });
    setShowPriceModal(false);
    setPriceAdjustment('');
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      onBulkAction(pendingAction.action);
      setPendingAction(null);
      setShowConfirmModal(false);
    }
  };

  const requestConfirmation = (action: string, label: string) => {
    setPendingAction({ action, label });
    setShowConfirmModal(true);
  };

  if (selectedProperties.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="gap-2"
        >
          <Square className="w-4 h-4" />
          Select All
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="gap-2"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </Button>

        <Badge variant="default" className="gap-1">
          {selectedProperties.length} selected
        </Badge>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Status Update */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusModal(true)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Update Status
          </Button>

          {/* Agent Assignment */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAgentModal(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Assign Agent
          </Button>

          {/* Price Adjustment */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPriceModal(true)}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Adjust Prices
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => requestConfirmation('archive', 'Archive')}>
                <Archive className="w-4 h-4 mr-2" />
                Archive Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction('export')}>
                <Download className="w-4 h-4 mr-2" />
                Export Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction('share')}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => requestConfirmation('delete', 'Delete')}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
            className="gap-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Update Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for {selectedProperties.length} Properties</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="negotiation">In Negotiation</SelectItem>
                  <SelectItem value="under-contract">Under Contract</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkStatusUpdate}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Assignment Modal */}
      <Dialog open={showAgentModal} onOpenChange={setShowAgentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Agent to {selectedProperties.length} Properties</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {availableAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAgentAssignment}>
              Assign Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Adjustment Modal */}
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Prices for {selectedProperties.length} Properties</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select 
                value={adjustmentType} 
                onValueChange={(value: 'percentage' | 'fixed') => setAdjustmentType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (PKR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {adjustmentType === 'percentage' ? 'Percentage Change' : 'Amount Change'}
              </Label>
              <Input
                type="number"
                placeholder={adjustmentType === 'percentage' ? 'e.g., 10 for +10% or -10 for -10%' : 'e.g., 500000'}
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                {adjustmentType === 'percentage' 
                  ? 'Use positive numbers to increase, negative to decrease'
                  : 'Use positive numbers to increase price, negative to decrease'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkPriceAdjustment}>
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {pendingAction?.label}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {pendingAction?.label?.toLowerCase()} {selectedProperties.length} properties? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmAction}
            >
              {pendingAction?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
