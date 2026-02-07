/**
 * Create Payment Schedule Modal
 * Agent-driven payment schedule creation with full customization
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Calendar, DollarSign, Hash, Clock, Edit2, Save, X } from 'lucide-react';
import { formatPKR } from '../lib/currency';
import { Instalment } from '../types/paymentSchedule';

interface CreatePaymentScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    totalAmount: number;
    numberOfInstalments: number;
    paymentCompletionDays: number;
    startDate: string;
    instalments: Instalment[];
    description?: string;
    terms?: string;
  }) => void;
  defaultTotalAmount?: number;
  entityName?: string;
}

export function CreatePaymentScheduleModal({
  open,
  onClose,
  onSave,
  defaultTotalAmount = 0,
  entityName = 'Transaction',
}: CreatePaymentScheduleModalProps) {
  const [totalAmount, setTotalAmount] = useState(defaultTotalAmount.toString());
  const [numberOfInstalments, setNumberOfInstalments] = useState('3');
  const [paymentCompletionDays, setPaymentCompletionDays] = useState('90');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  
  const [instalments, setInstalments] = useState<Instalment[]>([]);
  const [editingInstalment, setEditingInstalment] = useState<string | null>(null);

  // Generate default instalments when inputs change
  useEffect(() => {
    if (!totalAmount || !numberOfInstalments || !paymentCompletionDays || !startDate) return;
    
    const total = parseFloat(totalAmount);
    const count = parseInt(numberOfInstalments);
    const days = parseInt(paymentCompletionDays);
    
    if (isNaN(total) || isNaN(count) || isNaN(days) || count <= 0) return;
    
    generateInstalments(total, count, startDate, days);
  }, [totalAmount, numberOfInstalments, paymentCompletionDays, startDate]);

  const generateInstalments = (
    total: number,
    count: number,
    start: string,
    totalDays: number
  ) => {
    const baseAmount = Math.floor(total / count);
    const remainder = total - (baseAmount * count);
    const daysBetween = Math.floor(totalDays / count);
    
    const startDateObj = new Date(start);
    const newInstalments: Instalment[] = [];
    
    for (let i = 0; i < count; i++) {
      const dueDate = new Date(startDateObj);
      dueDate.setDate(startDateObj.getDate() + (i * daysBetween));
      
      // Add remainder to last instalment
      const amount = i === count - 1 ? baseAmount + remainder : baseAmount;
      
      newInstalments.push({
        id: `temp-${Date.now()}-${i}`,
        instalmentNumber: i + 1,
        amount: amount,
        dueDate: dueDate.toISOString().split('T')[0],
        paidAmount: 0,
        status: 'pending',
      });
    }
    
    setInstalments(newInstalments);
  };

  const handleInstalmentChange = (instalmentId: string, field: 'amount' | 'dueDate', value: string) => {
    setInstalments(prev => prev.map(inst => {
      if (inst.id === instalmentId) {
        if (field === 'amount') {
          return { ...inst, amount: parseFloat(value) || 0 };
        } else {
          return { ...inst, dueDate: value };
        }
      }
      return inst;
    }));
  };

  const handleSave = () => {
    // Validate
    const total = parseFloat(totalAmount);
    const count = parseInt(numberOfInstalments);
    const days = parseInt(paymentCompletionDays);
    
    if (isNaN(total) || total <= 0) {
      alert('Please enter a valid total amount');
      return;
    }
    
    if (isNaN(count) || count <= 0) {
      alert('Please enter a valid number of instalments');
      return;
    }
    
    if (isNaN(days) || days <= 0) {
      alert('Please enter valid payment completion days');
      return;
    }
    
    if (instalments.length === 0) {
      alert('No instalments generated');
      return;
    }
    
    // Check if instalments total matches
    const instalmentsTotal = instalments.reduce((sum, inst) => sum + inst.amount, 0);
    if (Math.abs(instalmentsTotal - total) > 1) {
      alert(`Instalments total (${formatPKR(instalmentsTotal)}) doesn't match total amount (${formatPKR(total)})`);
      return;
    }
    
    onSave({
      totalAmount: total,
      numberOfInstalments: count,
      paymentCompletionDays: days,
      startDate,
      instalments,
      description: description.trim() || undefined,
      terms: terms.trim() || undefined,
    });
  };

  const instalmentsTotal = instalments.reduce((sum, inst) => sum + inst.amount, 0);
  const totalFromInput = parseFloat(totalAmount) || 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payment Schedule</DialogTitle>
          <DialogDescription>
            Set up a customizable payment schedule for {entityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Total Amount */}
                <div>
                  <Label htmlFor="totalAmount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Amount (PKR)
                  </Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="e.g., 5000000"
                  />
                </div>

                {/* Number of Instalments */}
                <div>
                  <Label htmlFor="numberOfInstalments" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Number of Instalments
                  </Label>
                  <Input
                    id="numberOfInstalments"
                    type="number"
                    min="1"
                    value={numberOfInstalments}
                    onChange={(e) => setNumberOfInstalments(e.target.value)}
                    placeholder="e.g., 3"
                  />
                </div>

                {/* Payment Completion Days */}
                <div>
                  <Label htmlFor="paymentCompletionDays" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Payment Completion (Days)
                  </Label>
                  <Input
                    id="paymentCompletionDays"
                    type="number"
                    min="1"
                    value={paymentCompletionDays}
                    onChange={(e) => setPaymentCompletionDays(e.target.value)}
                    placeholder="e.g., 90"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Payment schedule for property purchase"
                />
              </div>

              {/* Terms */}
              <div>
                <Label htmlFor="terms">Payment Terms (Optional)</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="e.g., Late payment penalty: 5% per month"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Instalments Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Instalments Preview</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Total: {formatPKR(instalmentsTotal)}
                </span>
                {Math.abs(instalmentsTotal - totalFromInput) > 1 && (
                  <Badge variant="destructive" className="text-xs">
                    Mismatch!
                  </Badge>
                )}
                {Math.abs(instalmentsTotal - totalFromInput) <= 1 && instalments.length > 0 && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    Balanced ✓
                  </Badge>
                )}
              </div>
            </div>

            {instalments.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-gray-500">Enter configuration to generate instalments</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {instalments.map((inst) => (
                  <Card key={inst.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Instalment Number */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-medium text-blue-700">
                            {inst.instalmentNumber}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          {/* Amount */}
                          <div>
                            <Label className="text-xs text-gray-600">Amount</Label>
                            {editingInstalment === inst.id ? (
                              <Input
                                type="number"
                                value={inst.amount}
                                onChange={(e) => handleInstalmentChange(inst.id, 'amount', e.target.value)}
                                className="h-8 text-sm"
                              />
                            ) : (
                              <p className="font-medium">{formatPKR(inst.amount)}</p>
                            )}
                          </div>

                          {/* Due Date */}
                          <div>
                            <Label className="text-xs text-gray-600">Due Date</Label>
                            {editingInstalment === inst.id ? (
                              <Input
                                type="date"
                                value={inst.dueDate}
                                onChange={(e) => handleInstalmentChange(inst.id, 'dueDate', e.target.value)}
                                className="h-8 text-sm"
                              />
                            ) : (
                              <p className="font-medium">
                                {new Date(inst.dueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingInstalment(editingInstalment === inst.id ? null : inst.id)}
                        >
                          {editingInstalment === inst.id ? (
                            <Save className="h-4 w-4" />
                          ) : (
                            <Edit2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={instalments.length === 0 || Math.abs(instalmentsTotal - totalFromInput) > 1}>
            Create Payment Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
