/**
 * Agency Purchase Form - V4.0
 * When the agency is buying a property as an investment
 * PHASE 4: Integrated with AcquisitionCostModal for financial tracking
 */

import React, { useState } from 'react';
import { Property, User } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
<<<<<<< Updated upstream
import { createPurchaseCycle } from '../../lib/purchaseCycle';
=======
>>>>>>> Stashed changes
import { DollarSign, TrendingUp, Calculator, AlertCircle, Receipt } from 'lucide-react';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';
import { AcquisitionCostModal } from '../agency-financials/AcquisitionCostModal';
<<<<<<< Updated upstream
=======
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';
>>>>>>> Stashed changes

interface AgencyPurchaseFormProps {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

export function AgencyPurchaseForm({
  property,
  user,
  onSuccess,
  onCancel,
  onSubmitFromProperty,
}: AgencyPurchaseFormProps) {
  const [formData, setFormData] = useState({
    // Seller info
    sellerName: '',
    sellerContact: '',
    sellerType: 'individual' as 'individual' | 'developer' | 'agency' | 'bank' | 'other',
    
    // Pricing
    askingPrice: '',
    offerAmount: '',
    
    // Investment details
    purpose: 'investment' as 'investment' | 'resale' | 'hold' | 'development',
    expectedResaleValue: '',
    renovationBudget: '',
    targetROI: '',
    
    // Financing
    financingType: 'cash' as 'cash' | 'loan' | 'installment' | 'other',
    
    // Dates
    targetCloseDate: '',
    
    // Notes
    investmentNotes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Phase 4: Acquisition cost modal integration
  const [showAcquisitionModal, setShowAcquisitionModal] = useState(false);
  const [createdCycleId, setCreatedCycleId] = useState<string>('');

  // Calculate ROI
  const totalInvestment = 
    (parseFloat(formData.offerAmount) || 0) + 
    (parseFloat(formData.renovationBudget) || 0);
  const expectedReturn = parseFloat(formData.expectedResaleValue) || 0;
  const calculatedROI = totalInvestment > 0 && expectedReturn > 0
    ? ((expectedReturn - totalInvestment) / totalInvestment) * 100
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.sellerName.trim()) {
      toast.error('Please enter seller name');
      return;
    }
    if (!formData.sellerContact.trim()) {
      toast.error('Please enter seller contact');
      return;
    }
    if (!formData.askingPrice || parseFloat(formData.askingPrice) <= 0) {
      toast.error('Please enter valid asking price');
      return;
    }
    if (!formData.offerAmount || parseFloat(formData.offerAmount) <= 0) {
      toast.error('Please enter valid offer amount');
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmitFromProperty) {
        const payload: CreatePurchaseCycleFromPropertyPayload = {
          propertyListingId: property.id,
          purchaserType: 'agency',
          sellerName: formData.sellerName.trim(),
          sellerContact: formData.sellerContact.trim() || undefined,
          offerAmount: parseFloat(formData.offerAmount),
          askingPrice: parseFloat(formData.askingPrice) || undefined,
          financingType: formData.financingType,
          targetCloseDate: formData.targetCloseDate || undefined,
          notes: formData.investmentNotes || undefined,
          purpose: formData.purpose,
          expectedResaleValue: formData.expectedResaleValue ? parseFloat(formData.expectedResaleValue) : undefined,
          renovationBudget: formData.renovationBudget ? parseFloat(formData.renovationBudget) : undefined,
          targetROI: formData.targetROI ? parseFloat(formData.targetROI) : undefined,
          investmentNotes: formData.investmentNotes || undefined,
        };
        const newCycle = await onSubmitFromProperty(payload);
        toast.success('Agency purchase cycle created successfully!');
        if (newCycle?.id) {
          setCreatedCycleId(newCycle.id);
          setShowAcquisitionModal(true);
        } else {
          onSuccess();
        }
      } else {
        toast.info('Purchase cycle creation is only available from the property-based flow.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating purchase cycle:', error);
      toast.error('Failed to create purchase cycle');
      setIsSubmitting(false);
    }
  };
  
  // Phase 4: Handle acquisition modal close
  const handleAcquisitionModalClose = () => {
    setShowAcquisitionModal(false);
    setIsSubmitting(false);
    onSuccess();
  };
  
  // Phase 4: Handle skip acquisition costs
  const handleSkipAcquisition = () => {
    setShowAcquisitionModal(false);
    setIsSubmitting(false);
    toast.info('You can record acquisition costs later from the purchase cycle details');
    onSuccess();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Agency Investment</p>
              <p className="text-blue-700 mt-1">
                The agency will own this property. After creating the purchase, you'll be prompted to record acquisition costs for financial tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Seller Information */}
        <Card>
          <CardHeader>
            <CardTitle>Seller Information</CardTitle>
            <CardDescription>Who is selling this property?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellerName">
                  Seller Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sellerName"
                  placeholder="e.g., Ahmed Khan"
                  value={formData.sellerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellerContact">
                  Seller Contact <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sellerContact"
                  placeholder="e.g., 0300-1234567"
                  value={formData.sellerContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerContact: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerType">Seller Type</Label>
              <Select
                value={formData.sellerType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, sellerType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Asking price and your offer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="askingPrice">
                  Asking Price <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="askingPrice"
                  type="number"
                  placeholder="0"
                  value={formData.askingPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, askingPrice: e.target.value }))}
                  required
                  min="0"
                  step="100000"
                />
                {formData.askingPrice && (
                  <p className="text-sm text-muted-foreground">
                    {formatPKR(parseFloat(formData.askingPrice))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="offerAmount">
                  Offer Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="offerAmount"
                  type="number"
                  placeholder="0"
                  value={formData.offerAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, offerAmount: e.target.value }))}
                  required
                  min="0"
                  step="100000"
                />
                {formData.offerAmount && (
                  <p className="text-sm text-muted-foreground">
                    {formatPKR(parseFloat(formData.offerAmount))}
                  </p>
                )}
              </div>
            </div>

            {/* Difference */}
            {formData.askingPrice && formData.offerAmount && (
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Difference:</span>
                  <span className={parseFloat(formData.offerAmount) < parseFloat(formData.askingPrice) ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {formatPKR(Math.abs(parseFloat(formData.askingPrice) - parseFloat(formData.offerAmount)))}
                    {parseFloat(formData.offerAmount) < parseFloat(formData.askingPrice) ? ' below asking' : ' above asking'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Investment Strategy
            </CardTitle>
            <CardDescription>Plan for this investment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, purpose: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investment">Hold as Investment</SelectItem>
                    <SelectItem value="resale">Quick Resale</SelectItem>
                    <SelectItem value="hold">Long-term Hold</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="financingType">Financing Type</Label>
                <Select
                  value={formData.financingType}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, financingType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="loan">Bank Loan</SelectItem>
                    <SelectItem value="installment">Installments</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="renovationBudget">Renovation Budget (Optional)</Label>
                <Input
                  id="renovationBudget"
                  type="number"
                  placeholder="0"
                  value={formData.renovationBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, renovationBudget: e.target.value }))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedResaleValue">Expected Resale Value (Optional)</Label>
                <Input
                  id="expectedResaleValue"
                  type="number"
                  placeholder="0"
                  value={formData.expectedResaleValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedResaleValue: e.target.value }))}
                  min="0"
                />
              </div>
            </div>

            {/* ROI Calculation */}
            {totalInvestment > 0 && expectedReturn > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Projected ROI</p>
                    <p className="text-2xl font-bold text-green-600">
                      {calculatedROI.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Profit: {formatPKR(expectedReturn - totalInvestment)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="targetCloseDate">Target Close Date (Optional)</Label>
              <Input
                id="targetCloseDate"
                type="date"
                value={formData.targetCloseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetCloseDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentNotes">Investment Notes</Label>
              <Textarea
                id="investmentNotes"
                placeholder="Strategy, timeline, special considerations..."
                value={formData.investmentNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, investmentNotes: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Receipt className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create & Record Costs'}
          </Button>
        </div>
      </form>
      
      {/* Phase 4: Acquisition Cost Modal */}
      {showAcquisitionModal && (
        <AcquisitionCostModal
          isOpen={showAcquisitionModal}
          onClose={handleAcquisitionModalClose}
          propertyId={property.id}
          propertyAddress={formatPropertyAddress(property)}
          purchaseDate={new Date().toISOString().split('T')[0]}
          purchaseCycleId={createdCycleId}
          userId={user.id}
          userName={user.name}
          onSuccess={handleAcquisitionModalClose}
          // Auto-populate with purchase cycle data
          initialPurchasePrice={parseFloat(formData.offerAmount) || 0}
          initialRenovation={parseFloat(formData.renovationBudget) || 0}
          allowSkip={true}
          onSkip={handleSkipAcquisition}
        />
      )}
    </>
  );
}