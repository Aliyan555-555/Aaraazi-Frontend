/**
 * Bulk Operations Component
 * Perform actions on multiple deals at once
 */

import React, { useState } from 'react';
import { Deal } from '../../types';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { 
  CheckSquare, 
  Trash2, 
  Archive,
  Download,
  Mail,
  Tag,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkOperationsProps {
  selectedDeals: Deal[];
  onClearSelection: () => void;
  onBulkAction: (action: BulkAction, dealIds: string[]) => Promise<void>;
}

export type BulkAction = 
  | 'export'
  | 'archive'
  | 'delete'
  | 'notify-agents'
  | 'generate-reports';

export const BulkOperations: React.FC<BulkOperationsProps> = ({ 
  selectedDeals, 
  onClearSelection,
  onBulkAction
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (selectedDeals.length === 0) {
    return null;
  }
  
  const handleActionClick = (action: BulkAction) => {
    // Actions that require confirmation
    if (action === 'delete' || action === 'archive') {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      // Execute immediately
      executeBulkAction(action);
    }
  };
  
  const executeBulkAction = async (action: BulkAction) => {
    setIsProcessing(true);
    
    try {
      const dealIds = selectedDeals.map(d => d.id);
      await onBulkAction(action, dealIds);
      
      // Success messages
      switch (action) {
        case 'export':
          toast.success(`Exported ${selectedDeals.length} deals successfully`);
          break;
        case 'archive':
          toast.success(`Archived ${selectedDeals.length} deals`);
          break;
        case 'delete':
          toast.success(`Deleted ${selectedDeals.length} deals`);
          break;
        case 'notify-agents':
          toast.success(`Notifications sent for ${selectedDeals.length} deals`);
          break;
        case 'generate-reports':
          toast.success(`Generated reports for ${selectedDeals.length} deals`);
          break;
      }
      
      onClearSelection();
      setShowConfirmDialog(false);
      setPendingAction(null);
    } catch (error) {
      toast.error('Bulk operation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getActionLabel = (action: BulkAction) => {
    switch (action) {
      case 'export': return 'Export Data';
      case 'archive': return 'Archive Deals';
      case 'delete': return 'Delete Deals';
      case 'notify-agents': return 'Notify Agents';
      case 'generate-reports': return 'Generate Reports';
    }
  };
  
  const getActionIcon = (action: BulkAction) => {
    switch (action) {
      case 'export': return <Download className="h-4 w-4" />;
      case 'archive': return <Archive className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'notify-agents': return <Mail className="h-4 w-4" />;
      case 'generate-reports': return <Tag className="h-4 w-4" />;
    }
  };
  
  return (
    <>
      {/* Bulk Operations Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 min-w-[600px]">
          <div className="flex items-center justify-between gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5" />
              <span className="font-medium">
                {selectedDeals.length} {selectedDeals.length === 1 ? 'deal' : 'deals'} selected
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleActionClick('export')}
                disabled={isProcessing}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleActionClick('notify-agents')}
                disabled={isProcessing}
              >
                <Mail className="h-4 w-4 mr-2" />
                Notify
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleActionClick('generate-reports')}
                disabled={isProcessing}
              >
                <Tag className="h-4 w-4 mr-2" />
                Reports
              </Button>
              
              <div className="h-6 w-px bg-primary-foreground/20 mx-1" />
              
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleActionClick('archive')}
                disabled={isProcessing}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleActionClick('delete')}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              
              <div className="h-6 w-px bg-primary-foreground/20 mx-1" />
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearSelection}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction === 'delete' ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Confirm Deletion
                </>
              ) : (
                <>
                  <Archive className="h-5 w-5" />
                  Confirm Archive
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'delete' 
                ? `Review the ${selectedDeals.length} deal(s) you are about to permanently delete.`
                : `Review the ${selectedDeals.length} deal(s) you are about to archive.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert className={pendingAction === 'delete' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}>
              <AlertTriangle className={`h-4 w-4 ${pendingAction === 'delete' ? 'text-red-600' : 'text-orange-600'}`} />
              <AlertDescription className={pendingAction === 'delete' ? 'text-red-800' : 'text-orange-800'}>
                {pendingAction === 'delete' ? (
                  <>
                    <div className="font-medium mb-2">Warning: This action cannot be undone!</div>
                    <p>You are about to permanently delete {selectedDeals.length} {selectedDeals.length === 1 ? 'deal' : 'deals'}. 
                    All associated data including tasks, documents, and payment records will be lost.</p>
                  </>
                ) : (
                  <>
                    <div className="font-medium mb-2">Archive Deals</div>
                    <p>You are about to archive {selectedDeals.length} {selectedDeals.length === 1 ? 'deal' : 'deals'}. 
                    Archived deals can be restored later if needed.</p>
                  </>
                )}
              </AlertDescription>
            </Alert>
            
            {/* Deal List */}
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <div className="divide-y">
                {selectedDeals.slice(0, 10).map(deal => (
                  <div key={deal.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{deal.dealNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {deal.parties.seller.name} → {deal.parties.buyer.name}
                      </div>
                    </div>
                    <Badge variant={deal.lifecycle.status === 'active' ? 'default' : 'secondary'}>
                      {deal.lifecycle.status}
                    </Badge>
                  </div>
                ))}
                {selectedDeals.length > 10 && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    ... and {selectedDeals.length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant={pendingAction === 'delete' ? 'destructive' : 'default'}
              onClick={() => pendingAction && executeBulkAction(pendingAction)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : (pendingAction === 'delete' ? 'Delete Permanently' : 'Archive Deals')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Export functionality
export const exportDealsToCSV = (deals: Deal[]): void => {
  const headers = [
    'Deal Number',
    'Status',
    'Stage',
    'Seller',
    'Buyer',
    'Property',
    'Agreed Price',
    'Total Paid',
    'Balance',
    'Commission',
    'Primary Agent',
    'Secondary Agent',
    'Created Date',
    'Expected Closing',
  ];
  
  const rows = deals.map(deal => [
    deal.dealNumber,
    deal.lifecycle.status,
    deal.lifecycle.stage,
    deal.parties.seller.name,
    deal.parties.buyer.name,
    deal.property.address,
    deal.financial.agreedPrice,
    deal.financial.totalPaid,
    deal.financial.balanceRemaining,
    deal.financial.commission.total,
    deal.agents.primary.name,
    deal.agents.secondary?.name || 'N/A',
    new Date(deal.createdAt).toLocaleDateString(),
    new Date(deal.lifecycle.timeline.expectedClosingDate).toLocaleDateString(),
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deals-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};