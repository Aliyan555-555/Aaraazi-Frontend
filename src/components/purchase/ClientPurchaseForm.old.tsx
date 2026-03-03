/**
 * Client Purchase Form - V3.0
 * Buyer representation - helping a client buy a property
 */

import React, { useState, useMemo } from 'react';
import { Property, User, Contact } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useContacts } from '@/hooks/useContacts';
import type { ContactCategory } from '@/types/schema';
import { formatPropertyAddress } from '../../lib/utils';
import { Search, UserCheck, AlertCircle, DollarSign, Plus, Percent } from 'lucide-react';
import { formatPKR } from '../../lib/currency';
import { toast } from 'sonner';
import { QuickAddContactModal } from '../QuickAddContactModal';
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';

interface ClientPurchaseFormProps {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

export function ClientPurchaseFormContent({
  property,
  user,
  onSuccess,
  onCancel,
  onSubmitFromProperty,
}: ClientPurchaseFormProps) {
  const { contacts: allContacts, refetch: refetchContacts } = useContacts({
    category: 'BUYER' as ContactCategory,
  });
  const contacts = useMemo(() => Array.isArray(allContacts) ? allContacts : [], [allContacts]);
  const [extraContacts, setExtraContacts] = useState<Array<{ id: string; name: string; phone?: string | null }>>([]);
  const allContactsMerged = useMemo(
    () => [...contacts, ...extraContacts],
    [contacts, extraContacts]
  );
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [formData, setFormData] = useState({
    // Buyer Client
    buyerId: '',
    buyerName: '',

    // Seller info
    sellerName: '',
    sellerContact: '',
    sellerType: 'individual' as 'individual' | 'developer' | 'agency' | 'bank' | 'other',

    // Pricing
    askingPrice: '',
    offerAmount: '',

    // Commission
    commissionRate: '2',
    commissionType: 'percentage' as 'percentage' | 'fixed',
    commissionSource: 'buyer' as 'buyer' | 'seller' | 'split',

    // Buyer Info
    buyerBudgetMin: '',
    buyerBudgetMax: '',
    buyerPrequalified: false,
    buyerFinancingType: 'cash' as 'cash' | 'loan' | 'installment',

    // Deal conditions
    conditions: '',

    // Financing
    financingType: 'cash' as 'cash' | 'loan' | 'installment' | 'other',

    // Dates
    targetCloseDate: '',

    // Notes
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter clients based on search
  const filteredClients = allContactsMerged.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  const handleClientSelect = (contact: { id: string; name: string; phone?: string | null }) => {
    setFormData(prev => ({
      ...prev,
      buyerId: contact.id,
      buyerName: contact.name,
    }));
    setSearchQuery(contact.name);
    setShowClientDropdown(false);
  };

  // Calculate commission
  const calculatedCommission = formData.offerAmount && formData.commissionRate
    ? formData.commissionType === 'percentage'
      ? (parseFloat(formData.offerAmount) * parseFloat(formData.commissionRate)) / 100
      : parseFloat(formData.commissionRate)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.buyerId) {
      toast.error('Please select a buyer client');
      return;
    }
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
          purchaserType: 'client',
          contactId: formData.buyerId,
          buyerName: formData.buyerName,
          sellerName: formData.sellerName.trim(),
          sellerContact: formData.sellerContact.trim() || undefined,
          offerAmount: parseFloat(formData.offerAmount),
          askingPrice: parseFloat(formData.askingPrice) || undefined,
          commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : undefined,
          commissionType: formData.commissionType,
          buyerBudgetMin: formData.buyerBudgetMin ? parseFloat(formData.buyerBudgetMin) : undefined,
          buyerBudgetMax: formData.buyerBudgetMax ? parseFloat(formData.buyerBudgetMax) : undefined,
          financingType: formData.financingType,
          targetCloseDate: formData.targetCloseDate || undefined,
          notes: formData.notes || undefined,
        };
        await onSubmitFromProperty(payload);
        toast.success('Client purchase cycle created successfully!');
        onSuccess();
      } else {
        toast.info('Purchase cycle creation is only available from the property-based flow.');
      }
    } catch (error) {
      console.error('Error creating purchase cycle:', error);
      toast.error('Failed to create purchase cycle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Alert */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900">Buyer Representation</p>
              <p className="text-green-700 mt-1">
                You're representing a buyer client. The client will own the property. Earn commission based on the configured rate and source.
              </p>
            </div>
          </div>
        </div>

        {/* Buyer Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Buyer Client
            </CardTitle>
            <CardDescription>Who is the client you're representing?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyer">
                Select Buyer <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search buyer clients..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="pl-9"
                    />
                  </div>

                  {/* Client Dropdown */}
                  {showClientDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => handleClientSelect(client)}
                            className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {client.phone ?? '—'}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                          No buyer clients found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowQuickAdd(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.buyerName && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium">{formData.buyerName}</span>
                </p>
              )}
            </div>

            {/* Buyer Budget & Qualification */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyerBudgetMin">Buyer Budget Min (Optional)</Label>
                <Input
                  id="buyerBudgetMin"
                  type="number"
                  placeholder="Minimum budget"
                  value={formData.buyerBudgetMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyerBudgetMin: e.target.value }))}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerBudgetMax">Buyer Budget Max (Optional)</Label>
                <Input
                  id="buyerBudgetMax"
                  type="number"
                  placeholder="Maximum budget"
                  value={formData.buyerBudgetMax}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyerBudgetMax: e.target.value }))}
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="buyerPrequalified">Buyer Pre-qualified?</Label>
                <p className="text-xs text-muted-foreground">Has financing approval</p>
              </div>
              <Switch
                id="buyerPrequalified"
                checked={formData.buyerPrequalified}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, buyerPrequalified: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerFinancingType">Buyer Financing Type</Label>
              <Select
                value={formData.buyerFinancingType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, buyerFinancingType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="loan">Bank Loan</SelectItem>
                  <SelectItem value="installment">Installments</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
            <CardDescription>Deal pricing</CardDescription>
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
          </CardContent>
        </Card>

        {/* Commission Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Commission
            </CardTitle>
            <CardDescription>Your commission for this deal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissionType">Commission Type</Label>
                <Select
                  value={formData.commissionType}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, commissionType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionRate">
                  {formData.commissionType === 'percentage' ? 'Rate (%)' : 'Amount'}
                </Label>
                <Input
                  id="commissionRate"
                  type="number"
                  placeholder={formData.commissionType === 'percentage' ? '2' : '500000'}
                  value={formData.commissionRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: e.target.value }))}
                  min="0"
                  step={formData.commissionType === 'percentage' ? '0.1' : '10000'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionSource">Commission Source</Label>
                <Select
                  value={formData.commissionSource}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, commissionSource: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer Pays</SelectItem>
                    <SelectItem value="seller">Seller Pays</SelectItem>
                    <SelectItem value="split">Split 50/50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Commission Calculation */}
            {calculatedCommission > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Commission</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPKR(calculatedCommission)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Paid by: {formData.commissionSource === 'buyer' ? 'Buyer' : formData.commissionSource === 'seller' ? 'Seller' : 'Both (Split)'}
                    </p>
                  </div>
                  <Percent className="h-8 w-8 text-green-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Conditions & Financing */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conditions">Deal Conditions (Optional)</Label>
              <Textarea
                id="conditions"
                placeholder="e.g., Contingent on home inspection, requires clear title..."
                value={formData.conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                rows={2}
              />
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

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes, special considerations..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
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
            {isSubmitting ? 'Creating...' : 'Create Client Purchase'}
          </Button>
        </div>
      </form>

      {/* Quick Add Contact Modal */}
      {showQuickAdd && (
        <QuickAddContactModal
          user={user}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={(newContact) => {
            setExtraContacts((prev) => [...prev, { id: newContact.id, name: newContact.name, phone: newContact.phone ?? null }]);
            handleClientSelect({ id: newContact.id, name: newContact.name, phone: newContact.phone ?? null });
            setShowQuickAdd(false);
          }}
          defaultCategory="buyer"
        />
      )}
    </>
  );
}
