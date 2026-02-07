import React, { useState } from 'react';
import { Deal, PaymentInstallment } from '../../types';
import { formatPKR } from '../../lib/currency';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, CheckCircle2, Circle, DollarSign, Edit, Trash2, Plus, AlertCircle, Clock } from 'lucide-react';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ModifyInstallmentModal } from './ModifyInstallmentModal';
import { deleteInstallment } from '../../lib/dealPayments';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface PaymentScheduleProps {
  deal: Deal;
  currentUserId: string;
  currentUserName: string;
  onDealUpdate: (updatedDeal: Deal) => void;
  onAddInstallment: () => void;
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({
  deal,
  currentUserId,
  currentUserName,
  onDealUpdate,
  onAddInstallment,
}) => {
  const [recordPaymentModal, setRecordPaymentModal] = useState<{
    open: boolean;
    installment?: PaymentInstallment;
  }>({ open: false });
  
  const [modifyInstallmentModal, setModifyInstallmentModal] = useState<{
    open: boolean;
    installment?: PaymentInstallment;
  }>({ open: false });

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    installment?: PaymentInstallment;
  }>({ open: false });

  const isPrimaryAgent = deal.agents.primary.id === currentUserId;
  const paymentPlan = deal.financial.paymentPlan;

  if (!paymentPlan) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-2">No Payment Plan</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create a payment plan during the Sales Agreement stage
        </p>
      </div>
    );
  }

  const handleDelete = async (installment: PaymentInstallment) => {
    if (installment.status === 'paid') {
      toast.error('Cannot delete paid installment');
      return;
    }

    try {
      const reason = `Installment deleted: ${installment.description}`;
      const updatedDeal = deleteInstallment(
        deal.id,
        currentUserId,
        currentUserName,
        installment.id,
        reason
      );

      toast.success('Installment deleted successfully');
      onDealUpdate(updatedDeal);
      setDeleteConfirmModal({ open: false });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete installment');
    }
  };

  const getStatusBadge = (installment: PaymentInstallment) => {
    const now = new Date();
    const dueDate = new Date(installment.dueDate);
    const isOverdue = installment.status !== 'paid' && dueDate < now;

    switch (installment.status) {
      case 'paid':
        return <Badge className="bg-green-600">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-blue-600">Partial</Badge>;
      case 'pending':
        return isOverdue ? (
          <Badge className="bg-red-600">Overdue</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        );
      default:
        return <Badge variant="outline">{installment.status}</Badge>;
    }
  };

  const getStatusIcon = (installment: PaymentInstallment) => {
    const now = new Date();
    const dueDate = new Date(installment.dueDate);
    const isOverdue = installment.status !== 'paid' && dueDate < now;

    if (installment.status === 'paid') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    
    if (isOverdue) {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    
    if (installment.status === 'partial') {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
    
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Payment Schedule</h3>
          <p className="text-sm text-muted-foreground">
            {paymentPlan.installments.length} installment{paymentPlan.installments.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {isPrimaryAgent && (
          <Button onClick={onAddInstallment} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Installment
          </Button>
        )}
      </div>

      {/* Plan Status */}
      {paymentPlan.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">Payment Plan Completed</p>
            <p className="text-xs text-green-700">All installments have been paid</p>
          </div>
        </div>
      )}

      {/* Installments List */}
      <div className="space-y-3">
        {paymentPlan.installments.map((installment) => (
          <div
            key={installment.id}
            className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: Icon + Info */}
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(installment)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">#{installment.sequence}</h4>
                    <span className="text-sm text-muted-foreground">
                      {installment.description}
                    </span>
                    {installment.wasModified && (
                      <Badge variant="outline" className="text-xs">Modified</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {new Date(installment.dueDate).toLocaleDateString()}</span>
                    </div>
                    
                    {installment.paidDate && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Paid: {new Date(installment.paidDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Expected</p>
                      <p className="font-medium">{formatPKR(installment.amount)}</p>
                    </div>
                    
                    {installment.paidAmount > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="font-medium text-green-600">{formatPKR(installment.paidAmount)}</p>
                      </div>
                    )}
                    
                    {installment.status !== 'paid' && installment.amount > installment.paidAmount && (
                      <div>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                        <p className="font-medium text-orange-600">
                          {formatPKR(installment.amount - installment.paidAmount)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modification Note */}
                  {installment.wasModified && installment.modificationReason && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted rounded p-2">
                      <span className="font-medium">Modified: </span>
                      {installment.modificationReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Status + Actions */}
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(installment)}
                
                {isPrimaryAgent && (
                  <div className="flex gap-1">
                    {/* Record Payment Button */}
                    {installment.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRecordPaymentModal({ open: true, installment })}
                        title="Record Payment"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Modify Button */}
                    {installment.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setModifyInstallmentModal({ open: true, installment })}
                        title="Modify Installment"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Delete Button */}
                    {installment.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmModal({ open: true, installment })}
                        title="Delete Installment"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {recordPaymentModal.open && (
        <RecordPaymentModal
          open={recordPaymentModal.open}
          onClose={() => setRecordPaymentModal({ open: false })}
          deal={deal}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          selectedInstallment={recordPaymentModal.installment}
          onSuccess={onDealUpdate}
        />
      )}

      {modifyInstallmentModal.open && modifyInstallmentModal.installment && (
        <ModifyInstallmentModal
          open={modifyInstallmentModal.open}
          onClose={() => setModifyInstallmentModal({ open: false })}
          deal={deal}
          installment={modifyInstallmentModal.installment}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onSuccess={onDealUpdate}
        />
      )}

      {deleteConfirmModal.open && deleteConfirmModal.installment && (
        <AlertDialog open={deleteConfirmModal.open} onOpenChange={() => setDeleteConfirmModal({ open: false })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Installment?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirmModal.installment.description}"? 
                This action cannot be undone. All subsequent installments will be renumbered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmModal.installment && handleDelete(deleteConfirmModal.installment)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
