/**
 * Add Application Modal - * Modal for recording tenant applications on a rent cycle
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { User } from '../types';
import { toast } from 'sonner';
import { addTenantApplication } from '../lib/rentCycle';
import { User as UserIcon, Phone, Calendar, FileText } from 'lucide-react';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentCycleId: string;
  monthlyRent: number;
  user: User;
  onSuccess: () => void;
}

export function AddApplicationModal({
  isOpen,
  onClose,
  rentCycleId,
  monthlyRent,
  user,
  onSuccess,
}: AddApplicationModalProps) {
  const [formData, setFormData] = useState({
    tenantName: '',
    tenantContact: '',
    moveInDate: '',
    proposedRent: monthlyRent,
    employmentInfo: '',
    references: '',
    notes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validation
    if (!formData.tenantName) {
      setErrors({ tenantName: 'Tenant name is required' });
      toast.error('Please enter tenant name');
      return;
    }
    
    if (!formData.tenantContact) {
      setErrors({ tenantContact: 'Contact number is required' });
      toast.error('Please enter contact number');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      addTenantApplication(
        rentCycleId,
        `tenant_${Date.now()}`,
        formData.tenantName,
        formData.tenantContact,
        formData.notes || undefined
      );
      
      toast.success('Application recorded successfully');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error adding application:', error);
      toast.error('Failed to record application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      tenantName: '',
      tenantContact: '',
      moveInDate: '',
      proposedRent: monthlyRent,
      employmentInfo: '',
      references: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Tenant Application</DialogTitle>
          <DialogDescription>
            Enter the details of the tenant's application for this rental property.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tenant Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Tenant Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">
                  Tenant Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenantName"
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  placeholder="Enter tenant's full name"
                  required
                  className={errors.tenantName ? 'border-red-500' : ''}
                />
                {errors.tenantName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>⚠</span> {errors.tenantName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantContact">
                  <Phone className="inline h-3 w-3 mr-1" />
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenantContact"
                  value={formData.tenantContact}
                  onChange={(e) => setFormData({ ...formData, tenantContact: e.target.value })}
                  placeholder="+92 300 1234567"
                  required
                  className={errors.tenantContact ? 'border-red-500' : ''}
                />
                {errors.tenantContact && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>⚠</span> {errors.tenantContact}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Rental Details
            </h3>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="font-medium">PKR {monthlyRent.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="moveInDate">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Preferred Move-in Date
                </Label>
                <Input
                  id="moveInDate"
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposedRent">Proposed Monthly Rent (PKR)</Label>
                <Input
                  id="proposedRent"
                  type="number"
                  value={formData.proposedRent}
                  onChange={(e) => setFormData({ ...formData, proposedRent: parseFloat(e.target.value) || monthlyRent })}
                  placeholder={monthlyRent.toString()}
                  min="0"
                  step="1"
                />
                <p className="text-xs text-muted-foreground">
                  {monthlyRent > 0 
                    ? `${((formData.proposedRent / monthlyRent) * 100).toFixed(1)}% of asking rent`
                    : 'Enter proposed rent'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Additional Information
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employmentInfo">Employment Information</Label>
                <Textarea
                  id="employmentInfo"
                  value={formData.employmentInfo}
                  onChange={(e) => setFormData({ ...formData, employmentInfo: e.target.value })}
                  placeholder="e.g., Company name, position, salary, employment verification..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="references">References</Label>
                <Textarea
                  id="references"
                  value={formData.references}
                  onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                  placeholder="Previous landlord references, personal references..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Application Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or comments about this application..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || Object.keys(errors).length > 0}
            >
              {isSubmitting ? 'Recording...' : 'Record Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
