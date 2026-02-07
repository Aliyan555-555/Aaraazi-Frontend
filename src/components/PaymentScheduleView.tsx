/**
 * Payment Schedule View
 * Displays payment schedule with progress tracking and payment recording
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react';
import { formatPKR } from '../lib/currency';
import { PaymentSchedule, Instalment } from '../types/paymentSchedule';
import PaymentScheduleRecordingModal from './PaymentScheduleRecordingModal';

interface PaymentScheduleViewProps {
  schedule: PaymentSchedule;
  onRecordPayment?: (instalmentId: string, amount: number, date: string, method?: string, receiptNumber?: string, notes?: string) => void;
  onActivate?: () => void;
  onCancel?: () => void;
  canEdit?: boolean;
}

export function PaymentScheduleView({
  schedule: initialSchedule,
  onRecordPayment,
  onActivate,
  onCancel,
  canEdit = false,
}: PaymentScheduleViewProps) {
  const [schedule, setSchedule] = useState<PaymentSchedule>(initialSchedule);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstalment, setSelectedInstalment] = useState<Instalment | null>(null);

  // Update schedule when prop changes
  useEffect(() => {
    setSchedule(initialSchedule);
  }, [initialSchedule]);

  // Listen for payment schedule updates
  useEffect(() => {
    const handleScheduleUpdate = (event: CustomEvent) => {
      if (event.detail.scheduleId === schedule.id) {
        // Trigger parent refresh if callback provided
        if (onRecordPayment) {
          // Parent will re-fetch and update
          window.location.reload(); // Simple approach, parent can handle more elegantly
        }
      }
    };

    window.addEventListener('paymentScheduleUpdated', handleScheduleUpdate as EventListener);
    return () => {
      window.removeEventListener('paymentScheduleUpdated', handleScheduleUpdate as EventListener);
    };
  }, [schedule.id, onRecordPayment]);

  const handleRecordPaymentClick = (instalment: Instalment) => {
    setSelectedInstalment(instalment);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    // Refresh the component or notify parent
    if (onRecordPayment) {
      // Trigger parent to refresh data
      window.location.reload();
    }
  };

  const getInstalmentStatusBadge = (instalment: Instalment) => {
    switch (instalment.status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  const getScheduleStatusBadge = () => {
    switch (schedule.status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'draft':
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  const overdueInstalments = schedule.instalments.filter(i => i.status === 'overdue').length;
  const paidInstalments = schedule.instalments.filter(i => i.status === 'paid').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>Payment Schedule</CardTitle>
                {getScheduleStatusBadge()}
              </div>
              {schedule.description && (
                <p className="text-sm text-gray-600">{schedule.description}</p>
              )}
            </div>
            {schedule.status === 'draft' && onActivate && canEdit && (
              <Button onClick={onActivate} size="sm">
                Activate Schedule
              </Button>
            )}
            {schedule.status === 'active' && onCancel && canEdit && (
              <Button onClick={onCancel} size="sm" variant="destructive">
                Cancel Schedule
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">{schedule.percentageComplete}%</span>
            </div>
            <Progress value={schedule.percentageComplete} className="h-2" />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="font-medium">{formatPKR(schedule.totalAmount)}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Paid</p>
              <p className="font-medium text-green-700">{formatPKR(schedule.totalPaid)}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="font-medium text-orange-700">{formatPKR(schedule.totalPending)}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{paidInstalments} / {schedule.instalments.length} paid</span>
            </div>
            {overdueInstalments > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{overdueInstalments} overdue</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{schedule.numberOfInstalments} instalments</span>
            </div>
          </div>

          {/* Terms */}
          {schedule.terms && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-1">Payment Terms</p>
              <p className="text-sm text-blue-800">{schedule.terms}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instalments List */}
      <div>
        <h3 className="font-medium mb-3">Instalments</h3>
        <div className="space-y-3">
          {schedule.instalments.map((instalment) => {
            const remaining = instalment.amount - (instalment.paidAmount || 0);
            const isPaid = instalment.status === 'paid';

            return (
              <Card key={instalment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Instalment Number */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isPaid ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {isPaid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="font-medium text-gray-700">
                          {instalment.instalmentNumber}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">
                              Instalment #{instalment.instalmentNumber}
                            </h4>
                            {getInstalmentStatusBadge(instalment)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(instalment.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatPKR(instalment.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        {!isPaid && schedule.status === 'active' && onRecordPayment && canEdit && (
                          <Button
                            size="sm"
                            onClick={() => handleRecordPaymentClick(instalment)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Record Payment
                          </Button>
                        )}
                      </div>

                      {/* Payment Progress */}
                      {(instalment.paidAmount || 0) > 0 && (
                        <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-green-800 font-medium">
                              Paid: {formatPKR(instalment.paidAmount || 0)}
                            </span>
                            {!isPaid && (
                              <span className="text-gray-600">
                                Remaining: {formatPKR(remaining)}
                              </span>
                            )}
                          </div>
                          {instalment.paidDate && (
                            <p className="text-xs text-green-700">
                              Payment Date: {new Date(instalment.paidDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                          {instalment.paymentMethod && (
                            <p className="text-xs text-green-700">
                              Method: {instalment.paymentMethod}
                            </p>
                          )}
                          {instalment.receiptNumber && (
                            <p className="text-xs text-green-700">
                              Receipt: {instalment.receiptNumber}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {instalment.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">{instalment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Record Payment Modal */}
      <PaymentScheduleRecordingModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        scheduleId={schedule.id}
        instalment={selectedInstalment}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}