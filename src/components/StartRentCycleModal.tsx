/**
 * Start Rent Cycle Modal V2 - Multi-Step Form
 * 
 * DESIGN SYSTEM V4.1 COMPLIANT:
 * - MultiStepForm component (4 steps)
 * - FormContainer + FormSection + FormField
 * - Complete validation per step
 * - Contact search for landlord selection
 * - PKR formatting
 * 
 * STEPS:
 * 1. Landlord Selection - Who owns the property
 * 2. Rent Details - Monthly rent, security deposit, advance
 * 3. Lease Terms - Duration, availability, additional costs
 * 4. Requirements - Pet policy, furnishing, tenant requirements
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
import { MultiStepForm, type Step } from './ui/multi-step-form';
import {
  required,
  positiveNumber,
  minValue,
  validateForm,
  hasErrors,
  type FormErrors,
} from '../lib/formValidation';
// [STUBBED] import { createRentCycle } from '../lib/rentCycle';
// [STUBBED] import { getContacts } from '../lib/data';
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

// ===== STUBS for removed prototype functions =====
const createRentCycle = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getContacts = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


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

interface StartRentCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  user: User;
  onSuccess: () => void;
}

// ==================== VALIDATION RULES ====================

const step1ValidationRules = {
  landlordId: [required('Please select a landlord')],
  landlordName: [required('Landlord name is required')],
};

const step2ValidationRules = {
  monthlyRent: [
    required('Monthly rent is required'),
    positiveNumber('Rent must be a positive number'),
    minValue(1, 'Rent must be greater than 0'),
  ],
  advanceMonths: [
    required('Advance months is required'),
    positiveNumber('Must be a positive number'),
  ],
};

const step3ValidationRules = {
  leaseDuration: [
    required('Lease duration is required'),
    positiveNumber('Must be a positive number'),
  ],
  availableFrom: [required('Available from date is required')],
  commissionMonths: [
    required('Commission months is required'),
    positiveNumber('Must be a positive number'),
  ],
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

const Step1LandlordSelection = React.memo(({
  formData,
  errors,
  contacts,
  onFieldChange,
  onQuickAdd,
}: Step1Props) => {
  const [searchQuery, setSearchQuery] = useState(formData.landlordName || '');
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-purple-900">Listing Property for Rent</p>
            <p className="text-purple-700 mt-1">
              Configure rental terms, receive tenant applications, and manage leases.
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
});

Step1LandlordSelection.displayName = 'Step1LandlordSelection';

// ==================== STEP 2: RENT DETAILS ====================

interface Step2Props {
  formData: RentCycleFormData;
  errors: FormErrors<RentCycleFormData>;
  onFieldChange: (field: keyof RentCycleFormData, value: string) => void;
}

const Step2RentDetails = React.memo(({
  formData,
  errors,
  onFieldChange,
}: Step2Props) => {
  // Calculate totals
  const monthlyRent = parseFloat(formData.monthlyRent) || 0;
  const securityDeposit = parseFloat(formData.securityDeposit) || 0;
  const advanceMonths = parseInt(formData.advanceMonths) || 0;
  const totalUpfront = securityDeposit + (monthlyRent * advanceMonths);

  return (
    <FormSection
      title="Rent Details"
      description="Set monthly rent and upfront costs"
      icon={<DollarSign className="w-5 h-5" />}
    >
      {/* Monthly Rent */}
      <FormField
        label="Monthly Rent"
        required
        error={errors.monthlyRent}
        hint="Monthly rental amount"
      >
        <Input
          type="number"
          placeholder="0"
          value={formData.monthlyRent}
          onChange={(e) => onFieldChange('monthlyRent', e.target.value)}
          min="0"
          step="1000"
        />
        {monthlyRent > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {formatPKR(monthlyRent)} per month
          </p>
        )}
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Deposit */}
        <FormField
          label="Security Deposit"
          required={false}
          error={errors.securityDeposit}
          hint="Refundable security amount"
        >
          <Input
            type="number"
            placeholder="0"
            value={formData.securityDeposit}
            onChange={(e) => onFieldChange('securityDeposit', e.target.value)}
            min="0"
            step="1000"
          />
          {securityDeposit > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {formatPKR(securityDeposit)}
            </p>
          )}
        </FormField>

        {/* Advance Months */}
        <FormField
          label="Advance Months"
          required
          error={errors.advanceMonths}
          hint="Months of rent paid in advance"
        >
          <Input
            type="number"
            placeholder="1"
            value={formData.advanceMonths}
            onChange={(e) => onFieldChange('advanceMonths', e.target.value)}
            min="0"
            step="1"
          />
        </FormField>
      </div>

      {/* Upfront Cost Summary */}
      {totalUpfront > 0 && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="text-sm font-medium text-purple-900 mb-2">Upfront Cost Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-700">Monthly Rent:</span>
              <span className="font-medium text-purple-900">{formatPKR(monthlyRent)}</span>
            </div>
            {securityDeposit > 0 && (
              <div className="flex justify-between">
                <span className="text-purple-700">Security Deposit:</span>
                <span className="font-medium text-purple-900">{formatPKR(securityDeposit)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-purple-700">Advance ({advanceMonths} months):</span>
              <span className="font-medium text-purple-900">{formatPKR(monthlyRent * advanceMonths)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-purple-300">
              <span className="font-medium text-purple-900">Total Upfront:</span>
              <span className="text-lg font-semibold text-purple-900">
                {formatPKR(totalUpfront)}
              </span>
            </div>
          </div>
        </div>
      )}
    </FormSection>
  );
});

Step2RentDetails.displayName = 'Step2RentDetails';

// ==================== STEP 3: LEASE TERMS ====================

interface Step3Props {
  formData: RentCycleFormData;
  errors: FormErrors<RentCycleFormData>;
  onFieldChange: (field: keyof RentCycleFormData, value: any) => void;
}

const Step3LeaseTerms = React.memo(({
  formData,
  errors,
  onFieldChange,
}: Step3Props) => {
  // Calculate commission
  const monthlyRent = parseFloat(formData.monthlyRent) || 0;
  const commissionMonths = parseInt(formData.commissionMonths) || 0;
  const estimatedCommission = monthlyRent * commissionMonths;

  return (
    <FormSection
      title="Lease Terms"
      description="Duration, availability, and additional costs"
      icon={<Calendar className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lease Duration */}
        <FormField
          label="Lease Duration (months)"
          required
          error={errors.leaseDuration}
          hint="Standard lease period"
        >
          <Input
            type="number"
            placeholder="12"
            value={formData.leaseDuration}
            onChange={(e) => onFieldChange('leaseDuration', e.target.value)}
            min="1"
            step="1"
          />
        </FormField>

        {/* Available From */}
        <FormField
          label="Available From"
          required
          error={errors.availableFrom}
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
        label="Maintenance Fee (monthly)"
        required={false}
        hint="Optional monthly maintenance charge"
      >
        <Input
          type="number"
          placeholder="0"
          value={formData.maintenanceFee}
          onChange={(e) => onFieldChange('maintenanceFee', e.target.value)}
          min="0"
          step="100"
        />
        {formData.maintenanceFee && parseFloat(formData.maintenanceFee) > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {formatPKR(parseFloat(formData.maintenanceFee))} per month
          </p>
        )}
      </FormField>

      {/* Utilities */}
      <FormField
        label="Utilities Responsibility"
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
            <SelectItem value="shared">Shared</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Commission */}
      <FormField
        label="Commission (months of rent)"
        required
        error={errors.commissionMonths}
        hint="Your commission in months of rent (default 1)"
      >
        <Input
          type="number"
          placeholder="1"
          value={formData.commissionMonths}
          onChange={(e) => onFieldChange('commissionMonths', e.target.value)}
          min="0"
          step="0.5"
        />
      </FormField>

      {/* Commission Summary */}
      {estimatedCommission > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 mb-2">Commission Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Monthly Rent:</span>
              <span className="font-medium text-green-900">{formatPKR(monthlyRent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Commission Rate:</span>
              <span className="font-medium text-green-900">{commissionMonths} month(s)</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-green-300">
              <span className="font-medium text-green-900">Your Commission:</span>
              <span className="text-lg font-semibold text-green-900">
                {formatPKR(estimatedCommission)}
              </span>
            </div>
          </div>
        </div>
      )}
    </FormSection>
  );
});

Step3LeaseTerms.displayName = 'Step3LeaseTerms';

// ==================== STEP 4: REQUIREMENTS ====================

interface Step4Props {
  formData: RentCycleFormData;
  errors: FormErrors<RentCycleFormData>;
  onFieldChange: (field: keyof RentCycleFormData, value: any) => void;
}

const Step4Requirements = React.memo(({
  formData,
  errors,
  onFieldChange,
}: Step4Props) => {
  return (
    <FormSection
      title="Tenant Requirements"
      description="Pet policy, furnishing, and special terms (all optional)"
      icon={<Home className="w-5 h-5" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pet Policy */}
        <FormField
          label="Pet Policy"
          required={false}
          hint="Are pets allowed?"
        >
          <Select
            value={formData.petPolicy}
            onValueChange={(value: any) => onFieldChange('petPolicy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allowed">Allowed</SelectItem>
              <SelectItem value="not-allowed">Not Allowed</SelectItem>
              <SelectItem value="case-by-case">Case by Case</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* Furnishing Status */}
        <FormField
          label="Furnishing Status"
          required={false}
          hint="What's included?"
        >
          <Select
            value={formData.furnishingStatus}
            onValueChange={(value: any) => onFieldChange('furnishingStatus', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="furnished">Fully Furnished</SelectItem>
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
          placeholder="e.g., No smoking, family preferred, credit check required..."
          value={formData.tenantRequirements}
          onChange={(e) => onFieldChange('tenantRequirements', e.target.value)}
          rows={3}
        />
      </FormField>

      {/* Special Terms */}
      <FormField
        label="Special Terms"
        required={false}
        hint="Any additional terms or conditions"
      >
        <Textarea
          placeholder="e.g., Early termination clause, renewal terms..."
          value={formData.specialTerms}
          onChange={(e) => onFieldChange('specialTerms', e.target.value)}
          rows={3}
        />
      </FormField>
    </FormSection>
  );
});

Step4Requirements.displayName = 'Step4Requirements';

// ==================== MAIN COMPONENT ====================

export default function StartRentCycleModal({
  isOpen,
  onClose,
  property,
  user,
  onSuccess,
}: StartRentCycleModalProps) {
  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors<RentCycleFormData>>({});

  // Form data
  const [formData, setFormData] = useState<RentCycleFormData>({
    // Landlord (defaults to current owner, with fallback)
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
    petPolicy: 'not-allowed',
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
    // Clear error for this field
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
    // Step 4 has no required fields
    return true;
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
        
        // Rent details
        monthlyRent: parseFloat(formData.monthlyRent),
        securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : undefined,
        advanceMonths: parseInt(formData.advanceMonths),
        
        // Lease
        leaseDuration: parseInt(formData.leaseDuration),
        availableFrom: formData.availableFrom,
        
        // Additional
        maintenanceFee: formData.maintenanceFee ? parseFloat(formData.maintenanceFee) : undefined,
        utilities: formData.utilities,
        
        // Commission
        commissionMonths: parseInt(formData.commissionMonths),
        
        // Requirements
        petPolicy: formData.petPolicy,
        furnishingStatus: formData.furnishingStatus,
        
        // Agent
        agentId: user.id,
        agentName: user.name,
        
        // Notes
        tenantRequirements: formData.tenantRequirements || undefined,
        specialTerms: formData.specialTerms || undefined,
      });

      toast.success('Rent cycle created successfully!');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating rent cycle:', error);
      toast.error('Failed to create rent cycle');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, property.id, user, onClose, onSuccess]);

  // ==================== STEPS CONFIGURATION ====================

  const steps: Step[] = useMemo(() => [
    {
      id: 'landlord',
      title: 'Landlord',
      description: 'Who owns',
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
      description: 'Set rent',
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
      description: 'Tenant terms',
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {/* Accessibility - Hidden title and description */}
          <DialogTitle className="sr-only">Start Rent Cycle</DialogTitle>
          <DialogDescription className="sr-only">
            Configure and start a new rent cycle for {formatPropertyAddress(property)}
          </DialogDescription>
          
          <FormContainer
            title="Start Rent Cycle"
            description={formatPropertyAddress(property)}
          >
            <MultiStepForm
              steps={steps}
              onComplete={handleComplete}
              submitText={isSubmitting ? 'Creating...' : 'Start Rent Cycle'}
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
          defaultCategory="landlord"
        />
      )}
    </>
  );
}