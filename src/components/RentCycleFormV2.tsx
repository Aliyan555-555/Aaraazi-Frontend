/**
 * Rent Cycle Form V2 - Full Page Multi-Step Form
 * 
 * DESIGN SYSTEM V4.1 COMPLIANT:
 * - MultiStepForm component (4 steps)
 * - FormContainer + FormSection + FormField
 * - Complete validation per step
 * - Contact search for landlord selection
 * - PKR formatting
 * - Full-page layout with back button (not a modal)
 * 
 * STEPS:
 * 1. Landlord Selection - Who owns the property
 * 2. Rent Details - Monthly rent, security deposit, advance
 * 3. Lease Terms - Duration, availability, additional costs
 * 4. Requirements - Pet policy, furnishing, tenant requirements
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Property, User, Contact } from '../types';
import { FormContainer } from './ui/form-container';
import { FormSection } from './ui/form-section';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { MultiStepForm, type Step } from './ui/multi-step-form';
import {
  required,
  positiveNumber,
  minValue,
  validateForm,
  hasErrors,
  type FormErrors,
} from '../lib/formValidation';
import { createRentCycle } from '../lib/rentCycle';
import { getContacts } from '../lib/data';
import { formatPropertyAddress } from '../lib/utils';
import { formatPKR } from '../lib/currency';
import { QuickAddContactModal } from './QuickAddContactModal';
import { toast } from 'sonner';
import { 
  Key, 
  Users, 
  DollarSign, 
  Calendar, 
  Home, 
  Search, 
  Plus, 
  AlertCircle,
  X 
} from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

interface RentCycleFormData {
  // Landlord (Step 1)
  landlordId: string;
  landlordName: string;
  landlordType: 'individual' | 'agency' | 'investor' | 'corporate';
  
  // Rent Details (Step 2)
  monthlyRent: string;
  securityDeposit: string;
  advanceMonths: string;
  
  // Lease Terms (Step 3)
  leaseDuration: string;
  availableFrom: string;
  maintenanceFee: string;
  utilities: 'tenant' | 'landlord' | 'shared';
  commissionMonths: string;
  
  // Requirements (Step 4)
  petPolicy: 'allowed' | 'not-allowed' | 'case-by-case';
  furnishingStatus: 'furnished' | 'semi-furnished' | 'unfurnished';
  tenantRequirements: string;
  specialTerms: string;
}

interface RentCycleFormV2Props {
  property: Property;
  user: User;
  onBack: () => void;
  onSuccess: () => void;
}

// ==================== VALIDATION RULES ====================

const step1ValidationRules = {
  landlordId: (value: string) => required(value, 'Landlord'),
  landlordName: (value: string) => required(value, 'Landlord name'),
};

const step2ValidationRules = {
  monthlyRent: (value: string) => 
    required(value, 'Monthly rent') || 
    positiveNumber(value, 'Monthly rent') ||
    minValue(parseFloat(value), 1, 'Monthly rent'),
};

const step3ValidationRules = {
  leaseDuration: (value: string) => 
    required(value, 'Lease duration') || 
    positiveNumber(value, 'Lease duration'),
  commissionMonths: (value: string) => 
    required(value, 'Commission') || 
    positiveNumber(value, 'Commission'),
};

// Step 4 has no required fields

// ==================== STEP 1: LANDLORD SELECTION ====================

interface Step1Props {
  formData: RentCycleFormData;
  errors: FormErrors<RentCycleFormData>;
  contacts: Contact[];
  onFieldChange: (field: keyof RentCycleFormData, value: any) => void;
  onQuickAdd: () => void;
}

function Step1LandlordSelection({
  formData,
  errors,
  contacts,
  onFieldChange,
  onQuickAdd,
}: Step1Props) {
  const [searchQuery, setSearchQuery] = useState(formData.landlordName || '');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  }, [contacts, searchQuery]);

  const handleSelectContact = useCallback((contact: Contact) => {
    onFieldChange('landlordId', contact.id);
    onFieldChange('landlordName', contact.name);
    setSearchQuery(contact.name);
    setShowDropdown(false);
  }, [onFieldChange]);

  const handleClearSelection = useCallback(() => {
    onFieldChange('landlordId', '');
    onFieldChange('landlordName', '');
    setSearchQuery('');
  }, [onFieldChange]);

  return (
    <FormSection
      title="Landlord Information"
      description="Who owns this property?"
      icon={<Users className="w-5 h-5" />}
    >
      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Listing Property for Rent</p>
            <p className="text-blue-700 mt-1">
              You're listing this property for rent. Configure rental terms and find tenants.
            </p>
          </div>
        </div>
      </div>

      {/* Landlord Search */}
      <FormField
        label="Select Landlord"
        required
        error={errors.landlordId}
        hint="Search by name or phone number"
      >
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search landlords..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9"
              />
              {formData.landlordId && (
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
            {showDropdown && !formData.landlordId && (
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
                    No landlords found
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
            title="Add new landlord"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.landlordName && (
          <p className="text-sm text-muted-foreground mt-2">
            Selected: <span className="font-medium text-foreground">{formData.landlordName}</span>
          </p>
        )}
      </FormField>

      {/* Landlord Type */}
      <FormField label="Landlord Type" required={false}>
        <Select
          value={formData.landlordType}
          onValueChange={(value: any) => onFieldChange('landlordType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="agency">Agency</SelectItem>
            <SelectItem value="investor">Investor</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </FormSection>
  );
}

Step1LandlordSelection.displayName = 'Step1LandlordSelection';

// ==================== STEP 2: RENT DETAILS ====================

interface Step2Props {
  formData: RentCycleFormData;
  errors: FormErrors<RentCycleFormData>;
  onFieldChange: (field: keyof RentCycleFormData, value: string) => void;
}

function Step2RentDetails({
  formData,
  errors,
  onFieldChange,
}: Step2Props) {
  return (
    <FormSection
      title="Rent Details"
      description="Monthly rent and deposit information"
      icon={<DollarSign className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Rent */}
        <FormField
          label="Monthly Rent"
          required
          error={errors.monthlyRent}
          hint="Rent amount per month"
        >
          <Input
            type="number"
            placeholder="0"
            value={formData.monthlyRent}
            onChange={(e) => onFieldChange('monthlyRent', e.target.value)}
            min="0"
            step="5000"
          />
          {formData.monthlyRent && parseFloat(formData.monthlyRent) > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {formatPKR(parseFloat(formData.monthlyRent))}
            </p>
          )}
        </FormField>

        {/* Security Deposit */}
        <FormField
          label="Security Deposit"
          required={false}
          error={errors.securityDeposit}
          hint="Refundable security deposit"
        >
          <Input
            type="number"
            placeholder="0"
            value={formData.securityDeposit}
            onChange={(e) => onFieldChange('securityDeposit', e.target.value)}
            min="0"
            step="10000"
          />
          {formData.securityDeposit && parseFloat(formData.securityDeposit) > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {formatPKR(parseFloat(formData.securityDeposit))}
            </p>
          )}
        </FormField>
      </div>

      {/* Advance Months */}
      <FormField
        label="Advance Payment (Months)"
        required={false}
        hint="Number of months rent to be paid in advance"
      >
        <Input
          type="number"
          placeholder="0"
          value={formData.advanceMonths}
          onChange={(e) => onFieldChange('advanceMonths', e.target.value)}
          min="0"
          max="12"
        />
      </FormField>

      {/* Payment Summary */}
      {formData.monthlyRent && parseFloat(formData.monthlyRent) > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Payment Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Rent:</span>
              <span className="font-medium">{formatPKR(parseFloat(formData.monthlyRent))}</span>
            </div>
            {formData.securityDeposit && parseFloat(formData.securityDeposit) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit:</span>
                <span className="font-medium">{formatPKR(parseFloat(formData.securityDeposit))}</span>
              </div>
            )}
            {formData.advanceMonths && parseFloat(formData.advanceMonths) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Advance ({formData.advanceMonths} months):</span>
                <span className="font-medium">
                  {formatPKR(parseFloat(formData.monthlyRent) * parseFloat(formData.advanceMonths))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </FormSection>
  );
}

Step2RentDetails.displayName = 'Step2RentDetails';

// ==================== STEP 3: LEASE TERMS ====================

interface Step3Props {
  formData: RentCycleFormData;
  errors: FormErrors<RentCycleFormData>;
  onFieldChange: (field: keyof RentCycleFormData, value: any) => void;
}

function Step3LeaseTerms({
  formData,
  errors,
  onFieldChange,
}: Step3Props) {
  return (
    <FormSection
      title="Lease Terms"
      description="Duration and additional costs"
      icon={<Calendar className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lease Duration */}
        <FormField
          label="Lease Duration (Months)"
          required
          error={errors.leaseDuration}
          hint="Typical: 12 months"
        >
          <Input
            type="number"
            placeholder="12"
            value={formData.leaseDuration}
            onChange={(e) => onFieldChange('leaseDuration', e.target.value)}
            min="1"
          />
        </FormField>

        {/* Available From */}
        <FormField
          label="Available From"
          required={false}
          hint="When can tenant move in?"
        >
          <Input
            type="date"
            value={formData.availableFrom}
            onChange={(e) => onFieldChange('availableFrom', e.target.value)}
          />
        </FormField>
      </div>

      {/* Maintenance Fee */}
      <FormField
        label="Monthly Maintenance Fee"
        required={false}
        hint="Additional monthly charges (optional)"
      >
        <Input
          type="number"
          placeholder="0"
          value={formData.maintenanceFee}
          onChange={(e) => onFieldChange('maintenanceFee', e.target.value)}
          min="0"
          step="1000"
        />
        {formData.maintenanceFee && parseFloat(formData.maintenanceFee) > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {formatPKR(parseFloat(formData.maintenanceFee))}
          </p>
        )}
      </FormField>

      {/* Utilities */}
      <FormField
        label="Utilities"
        required={false}
        hint="Who pays for utilities?"
      >
        <Select
          value={formData.utilities}
          onValueChange={(value: any) => onFieldChange('utilities', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tenant">Tenant Pays</SelectItem>
            <SelectItem value="landlord">Landlord Pays</SelectItem>
            <SelectItem value="shared">Shared/Variable</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Commission */}
      <FormField
        label="Commission (Months)"
        required
        error={errors.commissionMonths}
        hint="Your commission in months of rent (typical: 1 month)"
      >
        <Input
          type="number"
          placeholder="1"
          value={formData.commissionMonths}
          onChange={(e) => onFieldChange('commissionMonths', e.target.value)}
          min="0"
          step="0.5"
        />
        {formData.commissionMonths && formData.monthlyRent && (
          <p className="text-sm text-green-700 mt-2">
            Your Commission: {formatPKR(parseFloat(formData.monthlyRent) * parseFloat(formData.commissionMonths))}
          </p>
        )}
      </FormField>
    </FormSection>
  );
}

Step3LeaseTerms.displayName = 'Step3LeaseTerms';

// ==================== STEP 4: REQUIREMENTS ====================

interface Step4Props {
  formData: RentCycleFormData;
  errors: FormErrors<RentCycleFormData>;
  onFieldChange: (field: keyof RentCycleFormData, value: any) => void;
}

function Step4Requirements({
  formData,
  errors,
  onFieldChange,
}: Step4Props) {
  return (
    <FormSection
      title="Requirements"
      description="Property requirements and policies (all optional)"
      icon={<Home className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pet Policy */}
        <FormField
          label="Pet Policy"
          required={false}
        >
          <Select
            value={formData.petPolicy}
            onValueChange={(value: any) => onFieldChange('petPolicy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allowed">Pets Allowed</SelectItem>
              <SelectItem value="not-allowed">No Pets</SelectItem>
              <SelectItem value="case-by-case">Case by Case</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* Furnishing Status */}
        <FormField
          label="Furnishing Status"
          required={false}
        >
          <Select
            value={formData.furnishingStatus}
            onValueChange={(value: any) => onFieldChange('furnishingStatus', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="furnished">Furnished</SelectItem>
              <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
              <SelectItem value="unfurnished">Unfurnished</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* Tenant Requirements */}
      <FormField
        label="Tenant Requirements"
        required={false}
        hint="Any specific requirements for tenants?"
      >
        <Textarea
          placeholder="e.g., Family only, professionals, no smoking..."
          value={formData.tenantRequirements}
          onChange={(e) => onFieldChange('tenantRequirements', e.target.value)}
          rows={3}
        />
      </FormField>

      {/* Special Terms */}
      <FormField
        label="Special Terms"
        required={false}
        hint="Any other terms or conditions"
      >
        <Textarea
          placeholder="Any additional terms or conditions..."
          value={formData.specialTerms}
          onChange={(e) => onFieldChange('specialTerms', e.target.value)}
          rows={3}
        />
      </FormField>
    </FormSection>
  );
}

Step4Requirements.displayName = 'Step4Requirements';

// ==================== MAIN COMPONENT ====================

export function RentCycleFormV2({
  property,
  user,
  onBack,
  onSuccess,
}: RentCycleFormV2Props) {
  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors<RentCycleFormData>>({});

  // Form data
  const [formData, setFormData] = useState<RentCycleFormData>({
    // Landlord (defaults to current owner)
    landlordId: property.currentOwnerId || '',
    landlordName: property.currentOwnerName || '',
    landlordType: 'individual',
    
    // Rent Details
    monthlyRent: '',
    securityDeposit: '',
    advanceMonths: '1',
    
    // Lease Terms
    leaseDuration: '12',
    availableFrom: new Date().toISOString().split('T')[0],
    maintenanceFee: '',
    utilities: 'tenant',
    commissionMonths: '1',
    
    // Requirements
    petPolicy: 'case-by-case',
    furnishingStatus: 'unfurnished',
    tenantRequirements: '',
    specialTerms: '',
  });

  // Load contacts
  useEffect(() => {
    const allContacts = getContacts(user.id, user.role);
    setContacts(allContacts);
  }, [user.id, user.role]);

  // Field change handler
  const handleChange = useCallback((field: keyof RentCycleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Quick add contact handler
  const handleQuickAddSuccess = useCallback((newContact: Contact) => {
    setContacts(prev => [...prev, newContact]);
    handleChange('landlordId', newContact.id);
    handleChange('landlordName', newContact.name);
    setShowQuickAdd(false);
    toast.success(`Contact "${newContact.name}" added successfully!`);
  }, [handleChange]);

  // ==================== VALIDATION ====================

  const validateStep1 = useCallback(async () => {
    const stepErrors = validateForm(formData, step1ValidationRules);
    setErrors(stepErrors);
    if (hasErrors(stepErrors)) {
      toast.error('Please select a landlord');
      return false;
    }
    return true;
  }, [formData]);

  const validateStep2 = useCallback(async () => {
    const stepErrors = validateForm(formData, step2ValidationRules);
    setErrors(stepErrors);
    if (hasErrors(stepErrors)) {
      toast.error('Please fix rent details errors');
      return false;
    }
    return true;
  }, [formData]);

  const validateStep3 = useCallback(async () => {
    const stepErrors = validateForm(formData, step3ValidationRules);
    setErrors(stepErrors);
    if (hasErrors(stepErrors)) {
      toast.error('Please fix lease terms errors');
      return false;
    }
    return true;
  }, [formData]);

  const validateStep4 = useCallback(async () => {
    return true; // No required fields
  }, []);

  // ==================== SUBMISSION ====================

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);

    try {
      createRentCycle({
        propertyId: property.id,
        
        // Landlord
        landlordId: formData.landlordId,
        landlordName: formData.landlordName,
        landlordType: formData.landlordType,
        
        // Rent Details
        monthlyRent: parseFloat(formData.monthlyRent),
        securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : undefined,
        advanceMonths: formData.advanceMonths ? parseInt(formData.advanceMonths) : undefined,
        
        // Lease Terms
        leaseDuration: parseInt(formData.leaseDuration),
        availableFrom: formData.availableFrom || undefined,
        maintenanceFee: formData.maintenanceFee ? parseFloat(formData.maintenanceFee) : undefined,
        utilities: formData.utilities,
        
        // Commission
        commissionMonths: parseFloat(formData.commissionMonths),
        
        // Agent
        agentId: user.id,
        agentName: user.name,
        
        // Requirements
        petPolicy: formData.petPolicy,
        furnishingStatus: formData.furnishingStatus,
        tenantRequirements: formData.tenantRequirements || undefined,
        specialTerms: formData.specialTerms || undefined,
      });

      toast.success('Rent cycle created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating rent cycle:', error);
      toast.error('Failed to create rent cycle');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, property.id, user, onSuccess]);

  // ==================== STEPS CONFIGURATION ====================

  const steps: Step[] = useMemo(() => [
    {
      id: 'landlord',
      title: 'Landlord',
      description: 'Property owner',
      component: (
        <Step1LandlordSelection
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
      id: 'rent',
      title: 'Rent Details',
      description: 'Payment terms',
      component: (
        <Step2RentDetails
          formData={formData}
          errors={errors}
          onFieldChange={handleChange}
        />
      ),
      validate: validateStep2,
    },
    {
      id: 'lease',
      title: 'Lease Terms',
      description: 'Duration & costs',
      component: (
        <Step3LeaseTerms
          formData={formData}
          errors={errors}
          onFieldChange={handleChange}
        />
      ),
      validate: validateStep3,
    },
    {
      id: 'requirements',
      title: 'Requirements',
      description: 'Policies & terms',
      component: (
        <Step4Requirements
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
    <div className="min-h-screen bg-gray-50">
      <FormContainer
        title="Start Rent Cycle"
        description={formatPropertyAddress(property)}
        onBack={onBack}
      >
        <MultiStepForm
          steps={steps}
          onComplete={handleComplete}
          onCancel={onBack}
          isSubmitting={isSubmitting}
          submitLabel="Start Rent Cycle"
        />
      </FormContainer>

      {/* Quick Add Contact Modal */}
      {showQuickAdd && (
        <QuickAddContactModal
          onClose={() => setShowQuickAdd(false)}
          onSuccess={handleQuickAddSuccess}
          user={user}
        />
      )}
    </div>
  );
}