/**
 * Investor Purchase Form - V4.0 - Multi-Investor Support
 * When facilitating a purchase for one or more investor clients
 */

import React, { useState } from 'react';
import { Property, User, InvestorShare } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
// <<<<<<< HEAD
// [STUBBED] import { createPurchaseCycle } from '../../lib/purchaseCycle';
// =======
// <<<<<<< Updated upstream
// import { createPurchaseCycle } from '../../lib/purchaseCycle';
// >>>>>>> aaraazi/properties
// import { createInvestorInvestmentsFromPurchase, transferPropertyToInvestors, validateInvestorShares } from '../../lib/multiInvestorPurchase';
// =======
// import { validateInvestorShares } from '../../lib/formValidation';
// >>>>>>> Stashed changes
import { Users, AlertCircle, DollarSign, Edit, X } from 'lucide-react';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';
import { InvestorSelectionModal } from './InvestorSelectionModal';
// <<<<<<< Updated upstream
// =======
// import { logger } from "../../lib/logger";
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';
// >>>>>>> Stashed changes

import { logger } from "../../lib/logger";

// ===== STUBS for removed prototype functions =====
const createPurchaseCycle = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====

interface InvestorPurchaseFormProps {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

export function InvestorPurchaseForm({
  property,
  user,
  onSuccess,
  onCancel,
  onSubmitFromProperty,
}: InvestorPurchaseFormProps) {
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [selectedInvestors, setSelectedInvestors] = useState<InvestorShare[]>([]);

  const [formData, setFormData] = useState({
    // Seller info
    sellerName: '',
    sellerContact: '',
    sellerType: 'individual' as 'individual' | 'developer' | 'agency' | 'bank' | 'other',
    
    // Pricing
    askingPrice: '',
    offerAmount: '',
    
    // Facilitation
    facilitationFee: '',
    
    // Financing
    financingType: 'cash' as 'cash' | 'loan' | 'installment' | 'other',
    
    // Dates
    targetCloseDate: '',
    
    // Notes
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total price for investor modal
  const totalPrice = parseFloat(formData.offerAmount || formData.askingPrice || '0');

  // Recalculate investment amounts when price changes
  React.useEffect(() => {
    if (selectedInvestors.length > 0 && totalPrice > 0) {
      const updatedInvestors = selectedInvestors.map(inv => ({
        ...inv,
        investmentAmount: (totalPrice * inv.sharePercentage) / 100,
      }));
      setSelectedInvestors(updatedInvestors);
    }
  }, [totalPrice]);

  const handleInvestorsSelected = (investors: InvestorShare[]) => {
    logger.log('✅ Investors selected:', {
      count: investors.length,
      investors: investors.map(inv => ({
        name: inv.investorName,
        percentage: inv.sharePercentage,
        amount: inv.investmentAmount,
      })),
    });
    setSelectedInvestors(investors);
    toast.success(`${investors.length} investor${investors.length !== 1 ? 's' : ''} selected`);
  };

  const handleOpenInvestorModal = () => {
    // Validate that a price is entered first
    if (!totalPrice || totalPrice <= 0) {
      toast.error('Please enter Asking Price or Offer Amount before selecting investors');
      return;
    }
    setShowInvestorModal(true);
  };

  const removeInvestor = (investorId: string) => {
    setSelectedInvestors(prev => prev.filter(inv => inv.investorId !== investorId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logger.log('🚀 Investor Purchase Form - Starting submission');
    logger.log('📊 Form Data:', {
      selectedInvestors: selectedInvestors.length,
      sellerName: formData.sellerName,
      askingPrice: formData.askingPrice,
      offerAmount: formData.offerAmount,
    });
    
    // Validation
    if (selectedInvestors.length === 0) {
      logger.error('❌ Validation failed: No investors selected');
      toast.error('Please select at least one investor');
      handleOpenInvestorModal();
      return;
    }
    
    // Validate investor shares
    const validation = validateInvestorShares(selectedInvestors);
    if (!validation.valid) {
      logger.error('❌ Validation failed: Invalid investor shares', validation.error);
      toast.error(validation.error || 'Invalid investor selection');
      return;
    }
    
    if (!formData.sellerName.trim()) {
      logger.error('❌ Validation failed: No seller name');
      toast.error('Please enter seller name');
      return;
    }
    if (!formData.sellerContact.trim()) {
      logger.error('❌ Validation failed: No seller contact');
      toast.error('Please enter seller contact');
      return;
    }
    if (!formData.askingPrice || parseFloat(formData.askingPrice) <= 0) {
      logger.error('❌ Validation failed: Invalid asking price');
      toast.error('Please enter valid asking price');
      return;
    }
    if (!formData.offerAmount || parseFloat(formData.offerAmount) <= 0) {
      logger.error('❌ Validation failed: Invalid offer amount');
      toast.error('Please enter valid offer amount');
      return;
    }

    logger.log('✅ All validations passed');
    setIsSubmitting(true);

    try {
      const investorNames = selectedInvestors.map(inv => inv.investorName).join(', ');
// <<<<<<< Updated upstream
      
      logger.log('📝 Creating purchase cycle with data:', {
        propertyId: property.id,
        purchaserType: 'investor',
        investorCount: selectedInvestors.length,
        investorNames,
      });
      
      // Create purchase cycle with multi-investor support
      const purchaseCycle = createPurchaseCycle({
        propertyId: property.id,
        
        // Purchaser (Multi-Investor)
        purchaserType: 'investor',
        purchaserId: 'INVESTORS', // Special ID for multi-investor
        purchaserName: investorNames,
        
        // NEW: Multi-investor shares
        investors: selectedInvestors,
        
        // Seller
        sellerId: `seller_${Date.now()}`,
        sellerName: formData.sellerName,
        sellerContact: formData.sellerContact,
        sellerType: formData.sellerType,
        
        // Pricing
        askingPrice: parseFloat(formData.askingPrice),
        offerAmount: parseFloat(formData.offerAmount),
        
        // Facilitation fee
        facilitationFee: formData.facilitationFee ? parseFloat(formData.facilitationFee) : undefined,
        
        // Financing
        financingType: formData.financingType,
        
        // Agent
        agentId: user.id,
        agentName: user.name,
        
        // Dates
        targetCloseDate: formData.targetCloseDate || undefined,
        
        // Notes
        notes: formData.notes || undefined,
      });

      logger.log('✅ Purchase cycle created:', purchaseCycle.id);
      logger.log('💾 Investors saved in cycle:', purchaseCycle.investors?.length || 0);

      // CRITICAL: Create InvestorInvestment records and transfer property ownership
      logger.log('📋 Creating investor investment records...');
      createInvestorInvestmentsFromPurchase(
        purchaseCycle.id,
        property.id,
        selectedInvestors,
        purchaseCycle
      );
      
      logger.log('🏠 Transferring property ownership to investors...');
      transferPropertyToInvestors(
        property.id,
        selectedInvestors,
        purchaseCycle
      );

      logger.log('🎉 Investor purchase completed successfully!');
      toast.success(`Multi-investor purchase cycle created with ${selectedInvestors.length} investor${selectedInvestors.length !== 1 ? 's' : ''}!`);
      onSuccess();
// =======
      const firstInvestor = selectedInvestors[0];

      if (onSubmitFromProperty) {
        const payload: CreatePurchaseCycleFromPropertyPayload = {
          propertyListingId: property.id,
          purchaserType: 'investor',
          contactId: firstInvestor?.investorId || undefined,
          buyerName: investorNames,
          buyerPhone: '03000000000',
          sellerName: formData.sellerName.trim(),
          sellerContact: formData.sellerContact.trim() || undefined,
          offerAmount: parseFloat(formData.offerAmount),
          askingPrice: parseFloat(formData.askingPrice) || undefined,
          facilitationFee: formData.facilitationFee ? parseFloat(formData.facilitationFee) : undefined,
          financingType: formData.financingType,
          targetCloseDate: formData.targetCloseDate || undefined,
          notes: formData.notes || undefined,
        };
        const cycle = await onSubmitFromProperty(payload);
        logger.log('✅ Purchase cycle created:', cycle?.id);
        toast.success(`Multi-investor purchase cycle created with ${selectedInvestors.length} investor${selectedInvestors.length !== 1 ? 's' : ''}!`);
        onSuccess();
      } else {
        toast.info('Purchase cycle creation is only available from the property-based flow.');
      }
// >>>>>>> Stashed changes
    } catch (error) {
      logger.error('❌ Error creating purchase cycle:', error);
      toast.error('Failed to create purchase cycle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Alert */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-purple-900">Multi-Investor Purchase</p>
              <p className="text-purple-700 mt-1">
                You're facilitating this purchase for one or more investors. Select investors and allocate ownership percentages. The total must equal 100%.
              </p>
            </div>
          </div>
        </div>

        {/* Investor Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Investors
            </CardTitle>
            <CardDescription>
              Select one or more investors and allocate ownership percentages
              {(!totalPrice || totalPrice <= 0) && (
                <span className="block mt-2 text-orange-600">
                  💡 Tip: Fill in the Asking Price or Offer Amount below first, then select investors
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedInvestors.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No investors selected</p>
                <Button
                  type="button"
                  onClick={handleOpenInvestorModal}
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Select Investors
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedInvestors.length} investor{selectedInvestors.length !== 1 ? 's' : ''} selected
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOpenInvestorModal}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Change Selection
                  </Button>
                </div>

                {/* Investment Breakdown Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Investor</th>
                        <th className="text-right p-3 text-sm font-medium">Percentage</th>
                        <th className="text-right p-3 text-sm font-medium">Investment Amount</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvestors.map((investor) => (
                        <tr key={investor.investorId} className="border-t">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{investor.investorName}</p>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant="secondary">
                              {investor.sharePercentage.toFixed(2)}%
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatPKR(investor.investmentAmount || 0)}
                          </td>
                          <td className="p-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeInvestor(investor.investorId)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/50 font-medium">
                        <td className="p-3">Total</td>
                        <td className="p-3 text-right">
                          <Badge>
                            {selectedInvestors.reduce((sum, inv) => sum + inv.sharePercentage, 0).toFixed(2)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {formatPKR(selectedInvestors.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Pricing & Facilitation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Fees
            </CardTitle>
            <CardDescription>Deal pricing and your facilitation fee</CardDescription>
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

            <div className="space-y-2">
              <Label htmlFor="facilitationFee">Facilitation Fee (Optional)</Label>
              <Input
                id="facilitationFee"
                type="number"
                placeholder="e.g., 500000"
                value={formData.facilitationFee}
                onChange={(e) => setFormData(prev => ({ ...prev, facilitationFee: e.target.value }))}
                min="0"
              />
              {formData.facilitationFee && (
                <p className="text-sm text-muted-foreground">
                  {formatPKR(parseFloat(formData.facilitationFee))}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Fixed fee you're charging the investor for facilitating this deal
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="targetCloseDate">Target Close Date (Optional)</Label>
                <Input
                  id="targetCloseDate"
                  type="date"
                  value={formData.targetCloseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetCloseDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Special conditions, investor requirements, timeline notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Investor Purchase'}
          </Button>
        </div>
      </form>

      {/* Investor Selection Modal */}
      {showInvestorModal && (
        <InvestorSelectionModal
          isOpen={showInvestorModal}
          user={user}
          onClose={() => setShowInvestorModal(false)}
          onConfirm={handleInvestorsSelected}
          totalPrice={totalPrice}
        />
      )}
    </>
  );
}