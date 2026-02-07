/**
 * Start Sell Cycle Modal V2 - Multi-Step Form
 * 
 * DESIGN SYSTEM V4.1 COMPLIANT:
 * - MultiStepForm component (4 steps)
 * - FormContainer + FormSection + FormField
 * - Complete validation per step
 * - Contact search for seller selection
 * - PKR formatting
 * 
 * STEPS:
 * 1. Seller Selection - Who is selling
 * 2. Pricing - Asking price and minimum acceptable
 * 3. Commission - Commission type and rate
 * 4. Additional Details - Marketing, exclusivity, notes
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Property, User, Contact } from '../types';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { FormContainer } from './ui/form-container';
import { FormSection } from './ui/form-section';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { MultiStepForm, type Step } from './ui/multi-step-form';
import {
  required,
  positiveNumber,
  minValue,
  validateForm,
  hasErrors,
  type FormErrors,
} from '../lib/formValidation';
import { createSellCycle } from '../lib/sellCycle';
import { getContacts } from '../lib/data';
import { formatPropertyAddress } from '../lib/utils';
import { formatPKR } from '../lib/currency';
import { QuickAddContactModal } from './QuickAddContactModal';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Percent, 
  FileText, 
  Search, 
  Plus, 
  AlertCircle,
  X 
} from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

interface SellCycleFormData {
  // Seller (Step 1)
  sellerId: string;
  sellerName: string;
  sellerType: 'individual' | 'developer' | 'agency' | 'investor';
  
  // Pricing (Step 2)
  askingPrice: string;
  minAcceptablePrice: string;
  
  // Commission (Step 3)
  commissionType: 'percentage' | 'fixed';
  commissionRate: string;
  
  // Additional Details (Step 4)
  marketingPlan: string;
  exclusiveListing: boolean;
  exclusivityEndDate: string;
  listedDate: string;
  targetSaleDate: string;
  sellerMotivation: string;
  privateNotes: string;
}

interface StartSellCycleModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  user: User;
  onSuccess: () => void;
}

// ==================== VALIDATION RULES ====================

const step1ValidationRules = {
  sellerId: [required('Please select a seller')],
  sellerName: [required('Seller name is required')],
};

const step2ValidationRules = {
  askingPrice: [
    required('Asking price is required'),
    positiveNumber('Price must be a positive number'),
    minValue(1, 'Price must be greater than 0'),
  ],
};

const step3ValidationRules = {
  commissionRate: [
    required('Commission rate is required'),
    positiveNumber('Commission rate must be a positive number'),
  ],
};

// Step 4 has no required fields

// ==================== STEP 1: SELLER SELECTION ====================

interface Step1Props {
  formData: SellCycleFormData;
  errors: FormErrors<SellCycleFormData>;
  contacts: Contact[];
  onFieldChange: (field: keyof SellCycleFormData, value: any) => void;
  onQuickAdd: () => void;
}

const Step1SellerSelection = React.memo(({
  formData,
  errors,
  contacts,
  onFieldChange,
  onQuickAdd,
}: Step1Props) => {
  const [searchQuery, setSearchQuery] = useState(formData.sellerName || '');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  }, [contacts, searchQuery]);

  const handleSelectContact = useCallback((contact: Contact) => {
    onFieldChange('sellerId', contact.id);
    onFieldChange('sellerName', contact.name);
    setSearchQuery(contact.name);
    setShowDropdown(false);
  }, [onFieldChange]);

  const handleClearSelection = useCallback(() => {
    onFieldChange('sellerId', '');
    onFieldChange('sellerName', '');
    setSearchQuery('');
  }, [onFieldChange]);

  return (
    <FormSection
      title="Seller Information"
      description="Who is selling this property?"
      icon={<Users className="w-5 h-5" />}
    >
      {/* Info Alert */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-green-900">Listing Property for Sale</p>
            <p className="text-green-700 mt-1">
              You're listing this property for sale. Configure pricing, commission, and receive offers from buyers.
            </p>
          </div>
        </div>
      </div>

      {/* Seller Search */}
      <FormField
        label="Select Seller"
        required
        error={errors.sellerId}
        hint="Search by name or phone number"
      >
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9"
              />
              {formData.sellerId && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Dropdown */}
            {showDropdown && !formData.sellerId && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredContacts.length > 0 ? (
                  filteredContacts.slice(0, 10).map(contact => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleSelectContact(contact)}
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contact.phone} • {contact.type}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No sellers found
                  </div>
                )}
              </div>
            )}
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onQuickAdd}
            title="Add new seller"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.sellerName && (
          <p className="text-sm text-muted-foreground mt-2">
            Selected: <span className="font-medium text-foreground">{formData.sellerName}</span>
          </p>
        )}
      </FormField>

      {/* Seller Type */}
      <FormField label="Seller Type" required={false}>
        <Select
          value={formData.sellerType}
          onValueChange={(value: any) => onFieldChange('sellerType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="agency">Agency</SelectItem>
            <SelectItem value="investor">Investor</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </FormSection>
  );
});

Step1SellerSelection.displayName = 'Step1SellerSelection';

// ==================== STEP 2: PRICING ====================

interface Step2Props {
  formData: SellCycleFormData;
  errors: FormErrors<SellCycleFormData>;
  onFieldChange: (field: keyof SellCycleFormData, value: string) => void;
}

const Step2Pricing = React.memo(({
  formData,
  errors,
  onFieldChange,
}: Step2Props) => {
  return (
    <FormSection
      title="Pricing"
      description="Set asking price and minimum acceptable price"
      icon={<DollarSign className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asking Price */}
        <FormField
          label="Asking Price"
          required
          error={errors.askingPrice}
          hint="Your initial listing price"
        >
          <Input
            type="number"
            placeholder="0"
            value={formData.askingPrice}
            onChange={(e) => onFieldChange('askingPrice', e.target.value)}
            min="0"
            step="100000"
          />
          {formData.askingPrice && parseFloat(formData.askingPrice) > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {formatPKR(parseFloat(formData.askingPrice))}
            </p>
          )}
        </FormField>

        {/* Minimum Acceptable Price */}
        <FormField
          label="Minimum Acceptable Price"
          required={false}
          error={errors.minAcceptablePrice}
          hint="Lowest price you'll accept (optional)"
        >
          <Input
            type="number"
            placeholder="0"
            value={formData.minAcceptablePrice}
            onChange={(e) => onFieldChange('minAcceptablePrice', e.target.value)}
            min="0"
            step="100000"
          />
          {formData.minAcceptablePrice && parseFloat(formData.minAcceptablePrice) > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {formatPKR(parseFloat(formData.minAcceptablePrice))}
            </p>
          )}
        </FormField>
      </div>

      {/* Pricing Summary */}
      {formData.askingPrice && parseFloat(formData.askingPrice) > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Pricing Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asking Price:</span>
              <span className="font-medium">{formatPKR(parseFloat(formData.askingPrice))}</span>
            </div>
            {formData.minAcceptablePrice && parseFloat(formData.minAcceptablePrice) > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Acceptable:</span>
                  <span className="font-medium">{formatPKR(parseFloat(formData.minAcceptablePrice))}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t">
                  <span className="text-muted-foreground">Negotiation Range:</span>
                  <span className="font-medium">
                    {formatPKR(parseFloat(formData.askingPrice) - parseFloat(formData.minAcceptablePrice))}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </FormSection>
  );
});

Step2Pricing.displayName = 'Step2Pricing';

// ==================== STEP 3: COMMISSION ====================

interface Step3Props {
  formData: SellCycleFormData;
  errors: FormErrors<SellCycleFormData>;
  onFieldChange: (field: keyof SellCycleFormData, value: any) => void;
}

const Step3Commission = React.memo(({
  formData,
  errors,
  onFieldChange,
}: Step3Props) => {
  // Calculate commission
  const calculatedCommission = useMemo(() => {
    if (!formData.askingPrice || !formData.commissionRate) return 0;
    
    const price = parseFloat(formData.askingPrice);
    const rate = parseFloat(formData.commissionRate);
    
    return formData.commissionType === 'percentage'
      ? (price * rate) / 100
      : rate;
  }, [formData.askingPrice, formData.commissionRate, formData.commissionType]);

  return (
    <FormSection
      title="Commission"
      description="Your commission for this sale"
      icon={<Percent className="w-5 h-5" />}
    >
      {/* Commission Type */}
      <FormField
        label="Commission Type"
        required
        hint="Percentage of sale price or fixed amount"
      >
        <Select
          value={formData.commissionType}
          onValueChange={(value: any) => onFieldChange('commissionType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Commission Rate */}
      <FormField
        label={formData.commissionType === 'percentage' ? 'Rate (%)' : 'Amount (PKR)'}
        required
        error={errors.commissionRate}
        hint={formData.commissionType === 'percentage' ? 'Default is 2%' : 'Fixed commission amount'}
      >
        <Input
          type="number"
          placeholder={formData.commissionType === 'percentage' ? '2' : '0'}
          value={formData.commissionRate}
          onChange={(e) => onFieldChange('commissionRate', e.target.value)}
          min="0"
          step={formData.commissionType === 'percentage' ? '0.1' : '1000'}
        />
      </FormField>

      {/* Commission Summary */}
      {calculatedCommission > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 mb-2">Commission Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Asking Price:</span>
              <span className="font-medium text-green-900">
                {formData.askingPrice ? formatPKR(parseFloat(formData.askingPrice)) : 'PKR 0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Commission Rate:</span>
              <span className="font-medium text-green-900">
                {formData.commissionType === 'percentage' 
                  ? `${formData.commissionRate}%` 
                  : formatPKR(parseFloat(formData.commissionRate))}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-green-300">
              <span className="font-medium text-green-900">Your Commission:</span>
              <span className="text-lg font-semibold text-green-900">
                {formatPKR(calculatedCommission)}
              </span>
            </div>
          </div>
        </div>
      )}
    </FormSection>
  );
});

Step3Commission.displayName = 'Step3Commission';

// ==================== STEP 4: ADDITIONAL DETAILS ====================

interface Step4Props {
  formData: SellCycleFormData;
  errors: FormErrors<SellCycleFormData>;
  onFieldChange: (field: keyof SellCycleFormData, value: any) => void;
}

const Step4AdditionalDetails = React.memo(({
  formData,
  errors,
  onFieldChange,
}: Step4Props) => {
  return (
    <FormSection
      title="Additional Details"
      description="Marketing plan, exclusivity, and notes (all optional)"
      icon={<FileText className="w-5 h-5" />}
    >
      {/* Marketing Plan */}
      <FormField
        label="Marketing Plan"
        required={false}
        hint="How will you market this property?"
      >
        <Textarea
          placeholder="e.g., Online listings, social media, open houses..."
          value={formData.marketingPlan}
          onChange={(e) => onFieldChange('marketingPlan', e.target.value)}
          rows={3}
        />
      </FormField>

      {/* Exclusive Listing */}
      <FormField
        label="Exclusive Listing"
        required={false}
        hint="Is this an exclusive listing agreement?"
      >
        <div className="flex items-center gap-3">
          <Switch
            checked={formData.exclusiveListing}
            onCheckedChange={(checked) => onFieldChange('exclusiveListing', checked)}
          />
          <span className="text-sm text-muted-foreground">
            {formData.exclusiveListing ? 'Yes, exclusive listing' : 'No, non-exclusive'}
          </span>
        </div>
      </FormField>

      {/* Exclusivity End Date (if exclusive) */}
      {formData.exclusiveListing && (
        <FormField
          label="Exclusivity End Date"
          required={false}
          hint="When does the exclusive period end?"
        >
          <Input
            type="date"
            value={formData.exclusivityEndDate}
            onChange={(e) => onFieldChange('exclusivityEndDate', e.target.value)}
          />
        </FormField>
      )}

      {/* Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Listed Date"
          required={false}
          hint="When was/will the property be listed?"
        >
          <Input
            type="date"
            value={formData.listedDate}
            onChange={(e) => onFieldChange('listedDate', e.target.value)}
          />
        </FormField>

        <FormField
          label="Target Sale Date"
          required={false}
          hint="Target date for completing the sale"
        >
          <Input
            type="date"
            value={formData.targetSaleDate}
            onChange={(e) => onFieldChange('targetSaleDate', e.target.value)}
          />
        </FormField>
      </div>

      {/* Seller Motivation */}
      <FormField
        label="Seller Motivation"
        required={false}
        hint="Why is the seller selling? (helps with negotiations)"
      >
        <Textarea
          placeholder="e.g., Relocating, upgrading, financial needs..."
          value={formData.sellerMotivation}
          onChange={(e) => onFieldChange('sellerMotivation', e.target.value)}
          rows={2}
        />
      </FormField>

      {/* Private Notes */}
      <FormField
        label="Private Notes"
        required={false}
        hint="Internal notes (not visible to seller or buyer)"
      >
        <Textarea
          placeholder="Any additional notes or reminders..."
          value={formData.privateNotes}
          onChange={(e) => onFieldChange('privateNotes', e.target.value)}
          rows={3}
        />
      </FormField>
    </FormSection>
  );
});

Step4AdditionalDetails.displayName = 'Step4AdditionalDetails';

// ==================== MAIN COMPONENT ====================

export default function StartSellCycleModalV2({
  isOpen,
  onClose,
  property,
  user,
  onSuccess,
}: StartSellCycleModalV2Props) {
  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors<SellCycleFormData>>({});

  // Form data
  const [formData, setFormData] = useState<SellCycleFormData>({
    // Seller (defaults to current owner, with fallback)
    sellerId: property.currentOwnerId || '',
    sellerName: property.currentOwnerName || '',
    sellerType: 'individual',
    
    // Pricing
    askingPrice: '',
    minAcceptablePrice: '',
    
    // Commission
    commissionType: 'percentage',
    commissionRate: '2',
    
    // Additional
    marketingPlan: '',
    exclusiveListing: false,
    exclusivityEndDate: '',
    listedDate: new Date().toISOString().split('T')[0],
    targetSaleDate: '',
    sellerMotivation: '',
    privateNotes: '',
  });

  // Load contacts
  useEffect(() => {
    const allContacts = getContacts(user.id, user.role);
    setContacts(allContacts);
  }, [user.id, user.role]);

  // Field change handler
  const handleChange = useCallback((field: keyof SellCycleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Quick add contact handler
  const handleQuickAddSuccess = useCallback((newContact: Contact) => {
    setContacts(prev => [...prev, newContact]);
    handleChange('sellerId', newContact.id);
    handleChange('sellerName', newContact.name);
    setShowQuickAdd(false);
    toast.success(`Contact "${newContact.name}" added successfully!`);
  }, [handleChange]);

  // ==================== VALIDATION ====================

  const validateStep1 = useCallback(async () => {
    const stepErrors = validateForm(formData, step1ValidationRules);
    setErrors(stepErrors);
    
    if (hasErrors(stepErrors)) {
      toast.error('Please select a seller');
      return false;
    }
    return true;
  }, [formData]);

  const validateStep2 = useCallback(async () => {
    const stepErrors = validateForm(formData, step2ValidationRules);
    
    // Additional validation for minimum price
    if (formData.minAcceptablePrice && formData.askingPrice) {
      const min = parseFloat(formData.minAcceptablePrice);
      const asking = parseFloat(formData.askingPrice);
      if (min > asking) {
        stepErrors.minAcceptablePrice = 'Minimum price cannot exceed asking price';
      }
    }
    
    setErrors(stepErrors);
    
    if (hasErrors(stepErrors)) {
      toast.error('Please fix pricing errors');
      return false;
    }
    return true;
  }, [formData]);

  const validateStep3 = useCallback(async () => {
    const stepErrors = validateForm(formData, step3ValidationRules);
    setErrors(stepErrors);
    
    if (hasErrors(stepErrors)) {
      toast.error('Please fix commission errors');
      return false;
    }
    return true;
  }, [formData]);

  const validateStep4 = useCallback(async () => {
    // Step 4 has no required fields
    return true;
  }, []);

  // ==================== SUBMISSION ====================

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);

    try {
      createSellCycle({
        propertyId: property.id,
        
        // Seller
        sellerId: formData.sellerId,
        sellerName: formData.sellerName,
        sellerType: formData.sellerType,
        
        // Pricing
        askingPrice: parseFloat(formData.askingPrice),
        minAcceptablePrice: formData.minAcceptablePrice ? parseFloat(formData.minAcceptablePrice) : undefined,
        
        // Commission
        commissionRate: parseFloat(formData.commissionRate),
        commissionType: formData.commissionType,
        
        // Listing
        marketingPlan: formData.marketingPlan || undefined,
        exclusiveListing: formData.exclusiveListing,
        exclusivityEndDate: formData.exclusivityEndDate || undefined,
        
        // Agent
        agentId: user.id,
        agentName: user.name,
        
        // Timeline
        listedDate: formData.listedDate,
        targetSaleDate: formData.targetSaleDate || undefined,
        
        // Notes
        sellerMotivation: formData.sellerMotivation || undefined,
        privateNotes: formData.privateNotes || undefined,
      });

      toast.success('Sell cycle created successfully!');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating sell cycle:', error);
      toast.error('Failed to create sell cycle');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, property.id, user, onClose, onSuccess]);

  // ==================== STEPS CONFIGURATION ====================

  const steps: Step[] = useMemo(() => [
    {
      id: 'seller',
      title: 'Seller',
      description: 'Who is selling',
      component: (
        <Step1SellerSelection
          formData={formData}
          errors={errors}
          contacts={contacts}
          onFieldChange={handleChange}
          onQuickAdd={() => setShowQuickAdd(true)}
        />
      ),
      validate: validateStep1,
    },
    {
      id: 'pricing',
      title: 'Pricing',
      description: 'Set prices',
      component: (
        <Step2Pricing
          formData={formData}
          errors={errors}
          onFieldChange={handleChange}
        />
      ),
      validate: validateStep2,
    },
    {
      id: 'commission',
      title: 'Commission',
      description: 'Your commission',
      component: (
        <Step3Commission
          formData={formData}
          errors={errors}
          onFieldChange={handleChange}
        />
      ),
      validate: validateStep3,
    },
    {
      id: 'details',
      title: 'Additional Details',
      description: 'Marketing & notes',
      component: (
        <Step4AdditionalDetails
          formData={formData}
          errors={errors}
          onFieldChange={handleChange}
        />
      ),
      validate: validateStep4,
    },
  ], [formData, errors, contacts, handleChange, validateStep1, validateStep2, validateStep3, validateStep4]);

  // ==================== RENDER ====================

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {/* Accessibility - Hidden title and description */}
          <DialogTitle className="sr-only">Start Sell Cycle</DialogTitle>
          <DialogDescription className="sr-only">
            Configure and start a new sell cycle for {formatPropertyAddress(property)}
          </DialogDescription>
          
          <FormContainer
            title="Start Sell Cycle"
            description={formatPropertyAddress(property)}
          >
            <MultiStepForm
              steps={steps}
              onComplete={handleComplete}
              submitText={isSubmitting ? 'Creating...' : 'Start Sell Cycle'}
              isSubmitting={isSubmitting}
              allowStepNavigation={true}
              showStepNumbers={true}
            />
          </FormContainer>
        </DialogContent>
      </Dialog>

      {/* Quick Add Contact Modal */}
      {showQuickAdd && (
        <QuickAddContactModal
          user={user}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={handleQuickAddSuccess}
          defaultCategory="seller"
        />
      )}
    </>
  );
}