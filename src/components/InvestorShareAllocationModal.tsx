/**
 * Investor Share Allocation Modal
 * Phase 2 Implementation - Allocate shares to multiple investors for a property
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, AlertCircle, Users, PieChart, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { formatPKR } from '../lib/currency';
// [STUBBED] import { getInvestors } from '../lib/investors';
import { Investor, InvestorShare } from '../types';
import { toast } from 'sonner';

// ===== STUBS for removed prototype functions =====
const getInvestors = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface InvestorShareAllocationModalProps {
  open: boolean;
  onClose: () => void;
  onAllocate: (shares: InvestorShare[], investments: InvestorInvestmentInput[]) => void;
  totalPropertyValue: number;
  existingShares?: InvestorShare[];
}

interface InvestorInvestmentInput {
  investorId: string;
  investorName: string;
  sharePercentage: number;
  investmentAmount: number;
  notes?: string;
}

interface ShareRow {
  id: string;
  investorId: string;
  sharePercentage: string;
  notes: string;
}

export default function InvestorShareAllocationModal({
  open,
  onClose,
  onAllocate,
  totalPropertyValue,
  existingShares = []
}: InvestorShareAllocationModalProps) {
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const investors = getInvestors();

  // Initialize with existing shares or empty row
  useEffect(() => {
    if (open) {
      if (existingShares.length > 0) {
        setShares(existingShares.map(share => ({
          id: Math.random().toString(36).substr(2, 9),
          investorId: share.investorId,
          sharePercentage: share.sharePercentage.toString(),
          notes: share.notes || ''
        })));
      } else {
        setShares([createEmptyRow()]);
      }
      setErrors({});
    }
  }, [open, existingShares]);

  function createEmptyRow(): ShareRow {
    return {
      id: Math.random().toString(36).substr(2, 9),
      investorId: '',
      sharePercentage: '',
      notes: ''
    };
  }

  const addRow = () => {
    setShares([...shares, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    if (shares.length === 1) {
      toast.error('Cannot Remove', {
        description: 'At least one investor is required'
      });
      return;
    }
    setShares(shares.filter(row => row.id !== id));

    // Clear errors for removed row
    const newErrors = { ...errors };
    delete newErrors[`investor-${id}`];
    delete newErrors[`share-${id}`];
    setErrors(newErrors);
  };

  const updateRow = (id: string, field: keyof ShareRow, value: string) => {
    setShares(shares.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));

    // Clear error for this field
    const errorKey = field === 'investorId' ? `investor-${id}` : `share-${id}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalPercentage = shares.reduce((sum, row) => {
      const percentage = parseFloat(row.sharePercentage) || 0;
      return sum + percentage;
    }, 0);

    const allocatedAmount = (totalPropertyValue * totalPercentage) / 100;
    const remainingAmount = totalPropertyValue - allocatedAmount;

    return {
      totalPercentage,
      allocatedAmount,
      remainingAmount,
      isValid: totalPercentage === 100
    };
  }, [shares, totalPropertyValue]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check each row
    shares.forEach(row => {
      if (!row.investorId) {
        newErrors[`investor-${row.id}`] = 'Select an investor';
      }

      const percentage = parseFloat(row.sharePercentage);
      if (!row.sharePercentage || isNaN(percentage)) {
        newErrors[`share-${row.id}`] = 'Enter share percentage';
      } else if (percentage <= 0) {
        newErrors[`share-${row.id}`] = 'Must be greater than 0';
      } else if (percentage > 100) {
        newErrors[`share-${row.id}`] = 'Cannot exceed 100%';
      }
    });

    // Check for duplicate investors
    const investorIds = shares.map(row => row.investorId).filter(id => id);
    const duplicates = investorIds.filter((id, index) => investorIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      duplicates.forEach(id => {
        const rowId = shares.find(row => row.investorId === id)?.id;
        if (rowId) {
          newErrors[`investor-${rowId}`] = 'Investor already selected';
        }
      });
    }

    // Check total percentage
    if (totals.totalPercentage !== 100) {
      newErrors.total = `Total must equal 100% (currently ${totals.totalPercentage.toFixed(2)}%)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('Validation Error', {
        description: 'Please fix the errors before allocating shares'
      });
      return;
    }

    // Convert to InvestorShare and InvestorInvestment objects
    const investorShares: InvestorShare[] = shares.map(row => {
      const investor = investors.find(inv => inv.id === row.investorId)!;
      return {
        investorId: row.investorId,
        investorName: investor.name,
        sharePercentage: parseFloat(row.sharePercentage),
        notes: row.notes || undefined
      };
    });

    const investments: InvestorInvestmentInput[] = shares.map(row => {
      const investor = investors.find(inv => inv.id === row.investorId)!;
      const sharePercentage = parseFloat(row.sharePercentage);
      const investmentAmount = (totalPropertyValue * sharePercentage) / 100;

      return {
        investorId: row.investorId,
        investorName: investor.name,
        sharePercentage,
        investmentAmount,
        notes: row.notes || undefined
      };
    });

    onAllocate(investorShares, investments);
    onClose();
  };

  // Get available investors for a row (excluding already selected ones)
  const getAvailableInvestors = (currentRowId: string) => {
    const selectedIds = shares
      .filter(row => row.id !== currentRowId && row.investorId)
      .map(row => row.investorId);

    return investors.filter(inv => !selectedIds.includes(inv.id));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Allocate Investor Shares
          </DialogTitle>
          <DialogDescription>
            Distribute property ownership among investors. Total shares must equal 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Value Summary */}
          <Card className="p-4 bg-[var(--color-muted)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--color-text-secondary)] mb-1">Total Property Value</p>
                <p className="text-xl">{formatPKR(totalPropertyValue)}</p>
              </div>
              <div className="text-right">
                <p className="text-[var(--color-text-secondary)] mb-1">Allocated Amount</p>
                <p className="text-xl">{formatPKR(totals.allocatedAmount)}</p>
              </div>
            </div>
          </Card>

          {/* Allocation Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Total Allocation</span>
              <div className="flex items-center gap-2">
                <span className={
                  totals.totalPercentage === 100 ? 'text-green-600' :
                    totals.totalPercentage > 100 ? 'text-red-600' :
                      'text-orange-600'
                }>
                  {totals.totalPercentage.toFixed(2)}%
                </span>
                {totals.totalPercentage === 100 && (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
              </div>
            </div>
            <Progress
              value={Math.min(totals.totalPercentage, 100)}
              className="h-2"
            />
            {errors.total && (
              <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.total}
              </p>
            )}
          </div>

          {/* Share Allocation Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Investor Allocation</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Investor
              </Button>
            </div>

            <div className="space-y-3">
              {shares.map((row, index) => {
                const availableInvestors = getAvailableInvestors(row.id);
                const selectedInvestor = investors.find(inv => inv.id === row.investorId);
                const shareAmount = totalPropertyValue * (parseFloat(row.sharePercentage) || 0) / 100;

                return (
                  <Card key={row.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                        <span className="text-sm">{index + 1}</span>
                      </div>

                      <div className="flex-1 space-y-4">
                        {/* Investor Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>
                              Investor <span className="text-[var(--color-destructive)]">*</span>
                            </Label>
                            <Select
                              value={row.investorId}
                              onValueChange={(value) => updateRow(row.id, 'investorId', value)}
                            >
                              <SelectTrigger className={errors[`investor-${row.id}`] ? 'border-[var(--color-destructive)]' : ''}>
                                <SelectValue placeholder="Select investor" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableInvestors.map(investor => (
                                  <SelectItem key={investor.id} value={investor.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{investor.name}</span>
                                      {investor.email && (
                                        <span className="text-xs text-[var(--color-text-secondary)] ml-2">
                                          {investor.email}
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors[`investor-${row.id}`] && (
                              <p className="text-xs text-[var(--color-destructive)]">
                                {errors[`investor-${row.id}`]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Share Percentage <span className="text-[var(--color-destructive)]">*</span>
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={row.sharePercentage}
                                onChange={(e) => updateRow(row.id, 'sharePercentage', e.target.value)}
                                placeholder="0.00"
                                className={errors[`share-${row.id}`] ? 'border-[var(--color-destructive)]' : ''}
                              />
                              <span className="flex items-center px-3 bg-[var(--color-muted)] rounded-lg">%</span>
                            </div>
                            {errors[`share-${row.id}`] && (
                              <p className="text-xs text-[var(--color-destructive)]">
                                {errors[`share-${row.id}`]}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Investment Amount Display */}
                        {row.sharePercentage && !isNaN(parseFloat(row.sharePercentage)) && (
                          <div className="p-3 bg-[var(--color-muted)] rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[var(--color-text-secondary)]">Investment Amount</span>
                              <span className="font-medium">{formatPKR(shareAmount)}</span>
                            </div>
                          </div>
                        )}

                        {/* Investor Contact Info */}
                        {selectedInvestor && (
                          <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                            {selectedInvestor.email && <span>{selectedInvestor.email}</span>}
                            {selectedInvestor.phone && <span>{selectedInvestor.phone}</span>}
                            {selectedInvestor.cnic && <span>CNIC: {selectedInvestor.cnic}</span>}
                          </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                          <Label>Notes (Optional)</Label>
                          <Input
                            value={row.notes}
                            onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                            placeholder="Any special terms or notes..."
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(row.id)}
                        disabled={shares.length === 1}
                        className="text-[var(--color-destructive)]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <Card className="p-4">
            <h4 className="text-[var(--color-primary)] mb-3">Allocation Summary</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Number of Investors</span>
                <span>{shares.filter(row => row.investorId).length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Total Percentage</span>
                <span className={totals.totalPercentage === 100 ? 'text-green-600' : 'text-orange-600'}>
                  {totals.totalPercentage.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Allocated Amount</span>
                <span>{formatPKR(totals.allocatedAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Remaining Amount</span>
                <span className={totals.remainingAmount === 0 ? 'text-green-600' : 'text-orange-600'}>
                  {formatPKR(totals.remainingAmount)}
                </span>
              </div>
            </div>
          </Card>

          {/* No Investors Warning */}
          {investors.length === 0 && (
            <Card className="p-4 border-orange-600 bg-orange-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm">No investors found in your registry.</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    You need to add investors before you can allocate shares.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!totals.isValid || investors.length === 0}
              className="flex-1 gap-2"
            >
              {totals.isValid ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Allocate Shares
                </>
              ) : (
                'Allocate Shares'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
