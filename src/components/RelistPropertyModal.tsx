/**
 * Relist Property Modal
 * Allows agency to repurchase a previously sold property
 * Critical for asset-centric model - properties can be sold and re-listed multiple times
 */

import React, { useState } from 'react';
import { X, Building2, DollarSign, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Property, User } from '../types';
import { formatPKR } from '../lib/currency';
// [STUBBED] import { createTransaction } from '../lib/agencyTransactions';
// [STUBBED] import { transferOwnership } from '../lib/ownership';
// [STUBBED] import { updateProperty } from '../lib/data';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

// ===== STUBS for removed prototype functions =====
const createTransaction = (..._args: any[]): any => { /* stub - prototype function removed */ };
const transferOwnership = (..._args: any[]): any => { /* stub - prototype function removed */ };
const updateProperty = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface RelistPropertyModalProps {
  open: boolean;
  onClose: () => void;
  property: Property;
  user: User;
  onSuccess?: () => void;
}

export default function RelistPropertyModal({
  open,
  onClose,
  property,
  user,
  onSuccess,
}: RelistPropertyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    purchasePrice: property.price ? property.price.toString() : '',
    purchaseDate: new Date().toISOString().split('T')[0],
    seller: property.currentOwnerId || '',
    notes: '',
    // Acquisition costs
    stampDuty: '',
    registrationFees: '',
    legalFees: '',
    agentCommission: '',
  });

  const currentOwner = property.currentOwnerId || 'Unknown';
  const isInvestorOwned = property.currentOwnerType === 'investor';

  // Calculate total acquisition cost
  const totalAcquisitionCost = 
    parseFloat(formData.purchasePrice || '0') +
    parseFloat(formData.stampDuty || '0') +
    parseFloat(formData.registrationFees || '0') +
    parseFloat(formData.legalFees || '0') +
    parseFloat(formData.agentCommission || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validation
    const purchasePrice = parseFloat(formData.purchasePrice);
    if (!purchasePrice || purchasePrice <= 0) {
      toast.error('Please enter a valid purchase price');
      return;
    }

    if (!formData.purchaseDate) {
      toast.error('Please select a purchase date');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Create acquisition transaction for purchase price
      createTransaction({
        propertyId: property.id,
        propertyAddress: property.address,
        type: 'acquisition_cost',
        category: 'acquisition',
        amount: purchasePrice,
        date: formData.purchaseDate,
        description: `Property repurchase from ${formData.seller || 'seller'}`,
        paymentMethod: 'bank-transfer',
        recordedBy: user.id,
        recordedByName: user.name,
      });

      // 2. Create transactions for acquisition costs
      if (parseFloat(formData.stampDuty || '0') > 0) {
        createTransaction({
          propertyId: property.id,
          propertyAddress: property.address,
          type: 'stamp_duty',
          category: 'acquisition',
          amount: parseFloat(formData.stampDuty),
          date: formData.purchaseDate,
          description: 'Stamp duty for property repurchase',
          paymentMethod: 'bank-transfer',
          recordedBy: user.id,
          recordedByName: user.name,
        });
      }

      if (parseFloat(formData.registrationFees || '0') > 0) {
        createTransaction({
          propertyId: property.id,
          propertyAddress: property.address,
          type: 'registration_fees',
          category: 'acquisition',
          amount: parseFloat(formData.registrationFees),
          date: formData.purchaseDate,
          description: 'Registration fees for property repurchase',
          paymentMethod: 'bank-transfer',
          recordedBy: user.id,
          recordedByName: user.name,
        });
      }

      if (parseFloat(formData.legalFees || '0') > 0) {
        createTransaction({
          propertyId: property.id,
          propertyAddress: property.address,
          type: 'legal_fees',
          category: 'acquisition',
          amount: parseFloat(formData.legalFees),
          date: formData.purchaseDate,
          description: 'Legal fees for property repurchase',
          paymentMethod: 'bank-transfer',
          recordedBy: user.id,
          recordedByName: user.name,
        });
      }

      if (parseFloat(formData.agentCommission || '0') > 0) {
        createTransaction({
          propertyId: property.id,
          propertyAddress: property.address,
          type: 'commission',
          category: 'acquisition',
          amount: parseFloat(formData.agentCommission),
          date: formData.purchaseDate,
          description: 'Agent commission for property repurchase',
          paymentMethod: 'bank-transfer',
          recordedBy: user.id,
          recordedByName: user.name,
        });
      }

      // 3. Transfer ownership back to agency
      transferOwnership(
        property.id,
        'agency', // New owner type
        user.id, // New owner ID (agency)
        formData.purchaseDate,
        `Property repurchased by agency - Total cost: ${formatPKR(totalAcquisitionCost)}`
      );

      // 4. Update property status to available
      updateProperty(property.id, {
        status: 'available',
        currentOwnerType: 'agency',
        currentOwnerId: user.id,
        investorShares: [], // Clear investor shares
        price: purchasePrice, // Update current market price
      });

      toast.success(
        `Property successfully relisted! Total acquisition cost: ${formatPKR(totalAcquisitionCost)}`,
        { duration: 5000 }
      );
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error relisting property:', error);
      toast.error('Failed to relist property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Relist Property
          </DialogTitle>
          <DialogDescription>
            Repurchase this property to add it back to agency portfolio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Info */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{property.title}</h3>
                  <p className="text-sm text-muted-foreground">{property.address}</p>
                </div>
                <Badge variant={property.status === 'sold' ? 'secondary' : 'outline'}>
                  {property.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-3 border-t text-sm">
                <div>
                  <p className="text-muted-foreground">Current Owner Type:</p>
                  <p className="font-medium capitalize">{property.currentOwnerType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Owner:</p>
                  <p className="font-medium">{currentOwner}</p>
                </div>
              </div>

              {isInvestorOwned && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                  <AlertCircle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">Investor-Owned Property</p>
                    <p className="text-amber-700">
                      This property is currently owned by investors. Repurchasing will transfer ownership back to agency.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Details */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="size-4" />
              Purchase Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">
                  Purchase Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="Enter purchase price"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">
                  Purchase Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller">Seller Name</Label>
              <Input
                id="seller"
                type="text"
                placeholder="Enter seller name"
                value={formData.seller}
                onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
              />
            </div>
          </div>

          {/* Acquisition Costs */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="size-4" />
              Acquisition Costs (Optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stampDuty">Stamp Duty</Label>
                <Input
                  id="stampDuty"
                  type="number"
                  placeholder="0"
                  value={formData.stampDuty}
                  onChange={(e) => setFormData({ ...formData, stampDuty: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationFees">Registration Fees</Label>
                <Input
                  id="registrationFees"
                  type="number"
                  placeholder="0"
                  value={formData.registrationFees}
                  onChange={(e) => setFormData({ ...formData, registrationFees: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalFees">Legal Fees</Label>
                <Input
                  id="legalFees"
                  type="number"
                  placeholder="0"
                  value={formData.legalFees}
                  onChange={(e) => setFormData({ ...formData, legalFees: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentCommission">Agent Commission</Label>
                <Input
                  id="agentCommission"
                  type="number"
                  placeholder="0"
                  value={formData.agentCommission}
                  onChange={(e) => setFormData({ ...formData, agentCommission: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the repurchase..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Summary */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="size-4 text-blue-600" />
                Transaction Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Price:</span>
                  <span className="font-medium">{formatPKR(parseFloat(formData.purchasePrice || '0'))}</span>
                </div>
                {parseFloat(formData.stampDuty || '0') > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stamp Duty:</span>
                    <span>{formatPKR(parseFloat(formData.stampDuty))}</span>
                  </div>
                )}
                {parseFloat(formData.registrationFees || '0') > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration Fees:</span>
                    <span>{formatPKR(parseFloat(formData.registrationFees))}</span>
                  </div>
                )}
                {parseFloat(formData.legalFees || '0') > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Legal Fees:</span>
                    <span>{formatPKR(parseFloat(formData.legalFees))}</span>
                  </div>
                )}
                {parseFloat(formData.agentCommission || '0') > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent Commission:</span>
                    <span>{formatPKR(parseFloat(formData.agentCommission))}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-semibold text-base">
                  <span>Total Acquisition Cost:</span>
                  <span className="text-blue-600">{formatPKR(totalAcquisitionCost)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Relist Property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}