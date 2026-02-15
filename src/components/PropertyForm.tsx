/**
 * Property Form V2 - Multi-Step Form (4 Steps) ✅
 * 
 * PHASE 3 COMPLIANT:
 * - MultiStepForm component for 4-step wizard
 * - FormContainer + FormSection + FormField
 * - Complete validation per step
 * - Contact search for owner selection
 * - Asset-Centric architecture (owner required, no cycles)
 * - Pakistani real estate context (Karachi market)
 * - REAL API INTEGRATION
 * 
 * STEPS:
 * 1. Property Type - Type selection (required for address fields)
 * 2. Owner & Location - Owner selection and property address
 * 3. Property Details - Area, bedrooms, bathrooms, floor, year
 * 4. Additional Info - Features, description, images
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, Property } from '../types';
import { FormContainer } from './ui/form-container';
import { FormSection } from './ui/form-section';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { MultiStepForm, useMultiStepForm, type Step } from './ui/multi-step-form';
import {
  required,
  positiveNumber,
  validateForm,
  hasErrors,
  type FormErrors,
} from '../lib/formValidation';
import { ContactFormModal } from './ContactFormModal';
import { PropertyAddressFields } from './PropertyAddressFields';
import { ImageUpload } from './properties/ImageUpload';
import { toast } from 'sonner';
import { Loader2, Users, Search, Plus, X, Home, Building2 } from 'lucide-react';
import { contactsApi, type Contact } from '../lib/api/contacts';
import { propertiesApi, type CreatePropertyData } from '../lib/api/properties';
import { locationsApi } from '../lib/api/locations';
import { useAuthStore } from '@/store/useAuthStore';


// ==================== TYPE DEFINITIONS ====================

interface PropertyFormData {
  // Property Type (Step 1)
  propertyType: 'house' | 'apartment' | 'plot' | 'commercial' | 'land' | 'industrial' | '';

  // Owner (Step 2 - required for Asset-Centric architecture)
  currentOwnerId: string;
  currentOwnerName: string;

  // Structured Address (Step 2)
  cityId: string;
  areaId: string;
  blockId: string;
  buildingId: string;
  plotNumber: string;
  floorNumber: string;
  unitNumber: string;

  // Physical property details (Step 3)
  area: string;
  areaUnit: 'sqft' | 'sqyards' | 'marla' | 'kanal';
  bedrooms: string;
  bathrooms: string;
  floor: string;
  constructionYear: string;

  // Optional details (Step 4)
  features: string[];
  description: string;
  images: string[];
}

interface PropertyFormProps {
  user: User;
  onBack: () => void;
  onSuccess: () => void;
  editingProperty?: Property;
  acquisitionType?: 'client-listing' | 'agency-purchase' | 'investor-purchase' | null;
}


// ==================== STEP 1: PROPERTY TYPE ====================

interface Step1Props {
  formData: PropertyFormData;
  errors: FormErrors<PropertyFormData>;
  onFieldChange: (field: keyof PropertyFormData, value: string) => void;
}

const Step1PropertyType = React.memo(({
  formData,
  errors,
  onFieldChange,
}: Step1Props) => {
  return (
    <FormSection
      title="Property Type"
      description="Select the type of property you're adding"
    >
      <FormField
        label="Property Type"
        required
        error={errors.propertyType}
        hint="This determines the required address fields"
      >
        <Select
          value={formData.propertyType || undefined}
          onValueChange={(value) => onFieldChange('propertyType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="plot">Plot</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="land">Land</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Type description */}
      {formData.propertyType && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">
                {formData.propertyType === 'house' && 'House - Residential Property'}
                {formData.propertyType === 'apartment' && 'Apartment - Multi-unit Building'}
                {formData.propertyType === 'plot' && 'Plot - Land Plot'}
                {formData.propertyType === 'commercial' && 'Commercial - Business Property'}
                {formData.propertyType === 'land' && 'Land - Open Land'}
                {formData.propertyType === 'industrial' && 'Industrial - Industrial Property'}
              </p>
              <p className="text-sm text-blue-700">
                {formData.propertyType === 'house' && 'Requires: Plot number'}
                {formData.propertyType === 'apartment' && 'Requires: Building, floor, and unit number'}
                {formData.propertyType === 'plot' && 'Requires: Plot number only'}
                {formData.propertyType === 'commercial' && 'Requires: Building and shop/office number'}
                {formData.propertyType === 'land' && 'Requires: Plot or block information'}
                {formData.propertyType === 'industrial' && 'Requires: Plot or building information'}
              </p>
            </div>
          </div>
        </div>
      )}
    </FormSection>
  );
});

Step1PropertyType.displayName = 'Step1PropertyType';

// ==================== STEP 2: OWNER & LOCATION ====================

interface Step2Props {
  formData: PropertyFormData;
  errors: FormErrors<PropertyFormData>;
  contacts: Contact[];
  contactSearchQuery: string;
  showContactSearch: boolean;
  loadingContacts: boolean;
  onFieldChange: (field: any, value: string) => void;
  onContactSearchChange: (value: string) => void;
  onShowContactSearchChange: (show: boolean) => void;
  onSelectOwner: (contact: Contact) => void;
  onClearOwner: () => void;
  onShowQuickAdd: (show: boolean) => void;
}

const Step2OwnerLocation = React.memo(({
  formData,
  errors,
  contacts,
  contactSearchQuery,
  showContactSearch,
  loadingContacts,
  onFieldChange,
  onContactSearchChange,
  onShowContactSearchChange,
  onSelectOwner,
  onClearOwner,
  onShowQuickAdd,
}: Step2Props) => {
  return (
    <FormSection
      title="Owner & Location"
      description="Who owns this property and where is it located?"
    >
      {/* Owner Selection */}
      <FormField
        label="Property Owner"
        required
        error={errors.currentOwnerId}
        hint="Select from existing contacts or add new"
      >
        {formData.currentOwnerId ? (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="flex-1">{formData.currentOwnerName}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearOwner}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contacts by name or phone..."
                  value={contactSearchQuery}
                  onChange={(e) => {
                    onContactSearchChange(e.target.value);
                    onShowContactSearchChange(true);
                  }}
                  onFocus={() => onShowContactSearchChange(true)}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onShowQuickAdd(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>

            {showContactSearch && contactSearchQuery && (
              <div className="border rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto">
                {loadingContacts ? (
                  <div className="px-3 py-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching contacts...
                  </div>
                ) : contacts.length > 0 ? (
                  <div className="py-1">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => onSelectOwner(contact)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Users className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-gray-600">{contact.phone}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {contact.type}
                        </Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-gray-500">
                    No contacts found. Try a different search or add a new contact.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </FormField>

      {/* Structured Address */}
      <PropertyAddressFields
        propertyType={formData.propertyType}
        addressData={{
          cityId: formData.cityId,
          areaId: formData.areaId,
          blockId: formData.blockId,
          buildingId: formData.buildingId,
          plotNumber: formData.plotNumber,
          floorNumber: formData.floorNumber,
          unitNumber: formData.unitNumber
        }}
        errors={{
          cityId: errors.cityId,
          areaId: errors.areaId,
          blockId: errors.blockId,
          buildingId: errors.buildingId,
          plotNumber: errors.plotNumber,
          floorNumber: errors.floorNumber,
          unitNumber: errors.unitNumber
        }}
        onChange={onFieldChange}
      />
    </FormSection>
  );
});

Step2OwnerLocation.displayName = 'Step2OwnerLocation';

// ==================== STEP 3: PROPERTY DETAILS ====================

interface Step3Props {
  formData: PropertyFormData;
  errors: FormErrors<PropertyFormData>;
  onFieldChange: (field: keyof PropertyFormData, value: string) => void;
}

const Step3PropertyDetails = React.memo(({
  formData,
  errors,
  onFieldChange,
}: Step3Props) => {
  return (
    <FormSection
      title="Property Details"
      description="Physical characteristics of the property"
    >
      {/* Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Area"
          required
          error={errors.area}
          className="md:col-span-2"
        >
          <Input
            type="number"
            value={formData.area}
            onChange={(e) => onFieldChange('area', e.target.value)}
            placeholder="e.g., 500"
            min="0"
            step="0.01"
          />
        </FormField>

        <FormField label="Unit" required>
          <Select
            value={formData.areaUnit}
            onValueChange={(value) => onFieldChange('areaUnit', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sqft">Square Feet</SelectItem>
              <SelectItem value="sqyards">Square Yards</SelectItem>
              <SelectItem value="marla">Marla</SelectItem>
              <SelectItem value="kanal">Kanal</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Bedrooms"
          error={errors.bedrooms}
          hint="Leave empty if not applicable"
        >
          <Input
            type="number"
            value={formData.bedrooms}
            onChange={(e) => onFieldChange('bedrooms', e.target.value)}
            placeholder="e.g., 3"
            min="0"
          />
        </FormField>

        <FormField
          label="Bathrooms"
          error={errors.bathrooms}
          hint="Leave empty if not applicable"
        >
          <Input
            type="number"
            value={formData.bathrooms}
            onChange={(e) => onFieldChange('bathrooms', e.target.value)}
            placeholder="e.g., 2"
            min="0"
          />
        </FormField>
      </div>

      {/* Floor & Construction Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Floor Number"
          error={errors.floor}
          hint="Leave empty for ground floor or not applicable"
        >
          <Input
            type="number"
            value={formData.floor}
            onChange={(e) => onFieldChange('floor', e.target.value)}
            placeholder="e.g., 2"
            min="0"
          />
        </FormField>

        <FormField
          label="Construction Year"
          error={errors.constructionYear}
          hint="Year the property was built"
        >
          <Input
            type="number"
            value={formData.constructionYear}
            onChange={(e) => onFieldChange('constructionYear', e.target.value)}
            placeholder="e.g., 2020"
            min="1900"
            max={new Date().getFullYear() + 5}
          />
        </FormField>
      </div>
    </FormSection>
  );
});

Step3PropertyDetails.displayName = 'Step3PropertyDetails';

// ==================== STEP 4: ADDITIONAL INFO ====================

interface Step4Props {
  formData: PropertyFormData;
  featureInput: string;
  onFieldChange: (field: keyof PropertyFormData, value: string | string[]) => void;
  onFeatureInputChange: (value: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (index: number) => void;
}

const Step4AdditionalInfo = React.memo(({
  formData,
  featureInput,
  onFieldChange,
  onFeatureInputChange,
  onAddFeature,
  onRemoveFeature,
}: Step4Props) => {
  return (
    <FormSection
      title="Additional Information"
      description="Features, description, and images (all optional)"
    >
      {/* Features */}
      <FormField
        label="Property Features"
        hint="Add amenities and special features"
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={featureInput}
              onChange={(e) => onFeatureInputChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddFeature();
                }
              }}
              placeholder="e.g., Swimming Pool, Parking, Garden..."
            />
            <Button
              type="button"
              variant="outline"
              onClick={onAddFeature}
              disabled={!featureInput.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {formData.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="gap-1 pl-3 pr-1 py-1"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => onRemoveFeature(index)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </FormField>

      {/* Description */}
      <FormField
        label="Property Description"
        hint="Detailed description of the property"
      >
        <Textarea
          value={formData.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          placeholder="Describe the property, its condition, surrounding area, and any other relevant details..."
          rows={4}
        />
      </FormField>

      {/* Images - Using ImageUpload Component */}
      <FormField
        label="Property Images"
        hint="Upload images or add URLs"
      >
        <ImageUpload
          images={formData.images}
          onImagesChange={(images) => onFieldChange('images', images)}
        />
      </FormField>
    </FormSection>
  );
});

Step4AdditionalInfo.displayName = 'Step4AdditionalInfo';

// ==================== VALIDATION RULES ====================

// Step 1: Property Type
const step1ValidationRules = {
  propertyType: (value: string) => required(value, 'Property type'),
};

// Step 2: Owner & Location
const step2ValidationRules = {
  currentOwnerId: (value: string) => required(value, 'Owner'),
  cityId: (value: string) => required(value, 'City'),
  areaId: (value: string) => required(value, 'Area'),
};

// Step 3: Property Details
const step3ValidationRules = {
  area: (value: string) =>
    required(value, 'Area') || positiveNumber(value, 'Area'),
};

// Step 4: No required fields (all optional)

// ==================== MAIN COMPONENT ====================

export function PropertyForm({ user, onBack, onSuccess, editingProperty, acquisitionType }: PropertyFormProps) {
  const { user: authUser } = useAuthStore();

  // Form state using multi-step hook
  const initialData: PropertyFormData = {
    propertyType: editingProperty?.propertyType || '',

    currentOwnerId: editingProperty?.currentOwnerId || '',
    currentOwnerName: editingProperty?.currentOwnerName || '',

    // Structured address
    cityId: (typeof editingProperty?.address === 'object' ? editingProperty.address.cityId : '') || '',
    areaId: (typeof editingProperty?.address === 'object' ? editingProperty.address.areaId : '') || '',
    blockId: (typeof editingProperty?.address === 'object' ? editingProperty.address.blockId : '') || '',
    buildingId: (typeof editingProperty?.address === 'object' ? editingProperty.address.buildingId : '') || '',
    plotNumber: (typeof editingProperty?.address === 'object' ? editingProperty.address.plotNumber : '') || '',
    floorNumber: (typeof editingProperty?.address === 'object' ? editingProperty.address.floorNumber : '') || '',
    unitNumber: (typeof editingProperty?.address === 'object' ? editingProperty.address.unitNumber : '') || '',

    area: editingProperty?.area?.toString() || '',
    areaUnit: (editingProperty?.areaUnit?.toLowerCase() as any) || 'sqft',
    bedrooms: editingProperty?.bedrooms?.toString() || '',
    bathrooms: editingProperty?.bathrooms?.toString() || '',
    floor: editingProperty?.floor?.toString() || '',
    constructionYear: editingProperty?.constructionYear?.toString() || '',
    features: editingProperty?.features || [],
    description: editingProperty?.description || '',
    images: Array.isArray(editingProperty?.images)
      ? editingProperty.images
      : typeof editingProperty?.images === 'string'
        ? (editingProperty.images || '').split(',').map((s) => s.trim()).filter(Boolean)
        : [],
  };

  const { formData, updateFormData } = useMultiStepForm(initialData);
  const [errors, setErrors] = useState<FormErrors<PropertyFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Owner search UI state
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState(editingProperty?.currentOwnerName || '');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Features input state
  const [featureInput, setFeatureInput] = useState('');

  // Search contacts when query changes
  useEffect(() => {
    const searchContacts = async () => {
      if (!contactSearchQuery || contactSearchQuery.length < 2) {
        setContacts([]);
        return;
      }

      try {
        setLoadingContacts(true);
        const response = await contactsApi.search(contactSearchQuery, { limit: 10 });
        setContacts(response.data);
      } catch (error) {
        console.error('Failed to search contacts:', error);
        toast.error('Failed to search contacts');
      } finally {
        setLoadingContacts(false);
      }
    };

    const debounce = setTimeout(searchContacts, 300);
    return () => clearTimeout(debounce);
  }, [contactSearchQuery]);

  // Handle field change
  const handleChange = useCallback((field: keyof PropertyFormData, value: string | string[]) => {
    updateFormData({ [field]: value });

    // Clear error
    setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, [updateFormData]);

  // Handle owner selection
  const handleSelectOwner = useCallback((contact: Contact) => {
    updateFormData({
      currentOwnerId: contact.id,
      currentOwnerName: contact.name,
    });
    setContactSearchQuery(contact.name);
    setShowContactSearch(false);

    // Clear owner errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.currentOwnerId;
      return newErrors;
    });
  }, [updateFormData]);

  const handleClearOwner = useCallback(() => {
    updateFormData({
      currentOwnerId: '',
      currentOwnerName: '',
    });
    setContactSearchQuery('');
  }, [updateFormData]);

  // Handle features
  const handleAddFeature = useCallback(() => {
    if (featureInput.trim()) {
      const newFeatures = [...formData.features, featureInput.trim()];
      updateFormData({ features: newFeatures });
      setFeatureInput('');
    }
  }, [featureInput, formData.features, updateFormData]);

  const handleRemoveFeature = useCallback((index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    updateFormData({ features: newFeatures });
  }, [formData.features, updateFormData]);

  // ==================== STEP VALIDATION ====================

  const validateStep1 = useCallback(async () => {
    const stepErrors = validateForm(formData, step1ValidationRules);
    setErrors(stepErrors);

    if (hasErrors(stepErrors)) {
      toast.error('Please select a property type');
      return false;
    }
    return true;
  }, [formData]);

  const validateStep2 = useCallback(async () => {
    const stepErrors = validateForm(formData, step2ValidationRules);

    // Additional address validation based on property type
    const needsPlot = ['plot', 'land', 'house'].includes(formData.propertyType);
    const needsBuilding = ['apartment', 'commercial'].includes(formData.propertyType);

    if (needsPlot && !formData.plotNumber) {
      stepErrors.plotNumber = 'Plot number is required for this property type';
    }

    if (needsBuilding) {
      if (!formData.buildingId) stepErrors.buildingId = 'Building name is required';
      if (!formData.floorNumber) stepErrors.floorNumber = 'Floor number is required';
      if (!formData.unitNumber) stepErrors.unitNumber = 'Unit number is required';
    }

    setErrors(stepErrors);

    if (hasErrors(stepErrors)) {
      toast.error('Please fix the errors in Owner & Location');
      return false;
    }
    return true;
  }, [formData]);

  const validateStep3 = useCallback(async () => {
    const stepErrors = validateForm(formData, step3ValidationRules);
    setErrors(stepErrors);

    if (hasErrors(stepErrors)) {
      toast.error('Please fix the errors in Property Details');
      return false;
    }
    return true;
  }, [formData]);

  const validateStep4 = useCallback(async () => {
    // Step 4 has no required fields
    return true;
  }, []);

  // ==================== FORM SUBMISSION ====================

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);

    try {
      if (!authUser) {
        toast.error('Authentication required');
        return;
      }

      // Resolve country id (backend expects CUID, not code)
      const countries = await locationsApi.getCountries();
      const pakistan = countries.find((c) => c.code === 'PK');
      if (!pakistan) {
        toast.error('Country not found. Please ensure locations are seeded.');
        return;
      }

      // Map property type to address type
      const addressTypeMap: Record<string, string> = {
        house: 'RESIDENTIAL',
        apartment: 'RESIDENTIAL',
        plot: 'RESIDENTIAL',
        commercial: 'COMMERCIAL',
        land: 'AGRICULTURAL',
        industrial: 'INDUSTRIAL',
      };

      // Prepare property data
      const propertyData: CreatePropertyData = {
        propertyType: formData.propertyType.toUpperCase() as any,
        
        // Address
        address: {
          addressType: addressTypeMap[formData.propertyType] || 'RESIDENTIAL',
          countryId: pakistan.id,
          cityId: formData.cityId,
          areaId: formData.areaId,
          blockId: formData.blockId || undefined,
          plotNo: formData.plotNumber || undefined,
          buildingName: formData.buildingId || undefined, // Building name entered as text
          floorNo: formData.floorNumber || undefined,
          apartmentNo: formData.unitNumber || undefined,
        },

        // Owner
        contactId: formData.currentOwnerId || undefined,
        ownerName: formData.currentOwnerId ? undefined : formData.currentOwnerName,

        // Physical details
        area: parseFloat(formData.area),
        areaUnit: formData.areaUnit.toUpperCase() as any,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        constructionYear: formData.constructionYear ? parseInt(formData.constructionYear) : undefined,

        // Optional
        features: formData.features.length > 0 ? formData.features : undefined,
        description: formData.description.trim() || undefined,
        images: Array.isArray(formData.images) && formData.images.length > 0 ? formData.images : undefined,

        // Context
        tenantId: authUser.tenantId,
        agencyId: authUser.agencyId,
        branchId: authUser.branchId || undefined,
      };

      // Call API
      const response = await propertiesApi.create(propertyData);
      
      toast.success('Property created successfully!');
      console.log('Property created:', response);

      // Success!
      onSuccess();
    } catch (error: any) {
      console.error('Error saving property:', error);
      const errorMessage = error?.message || 'Failed to save property. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, authUser, onSuccess]);

  // ==================== STEPS CONFIGURATION ====================

  const steps: Step[] = useMemo(() => [
    {
      id: 'property-type',
      title: 'Property Type',
      description: 'What type of property?',
      component: (
        <Step1PropertyType
          formData={formData}
          errors={errors}
          onFieldChange={handleChange}
        />
      ),
      validate: validateStep1,
    },
    {
      id: 'owner-location',
      title: 'Owner & Location',
      description: 'Who owns it and where?',
      component: (
        <Step2OwnerLocation
          formData={formData}
          errors={errors}
          contacts={contacts}
          contactSearchQuery={contactSearchQuery}
          showContactSearch={showContactSearch}
          loadingContacts={loadingContacts}
          onFieldChange={handleChange}
          onContactSearchChange={setContactSearchQuery}
          onShowContactSearchChange={setShowContactSearch}
          onSelectOwner={handleSelectOwner}
          onClearOwner={handleClearOwner}
          onShowQuickAdd={setShowQuickAdd}
        />
      ),
      validate: validateStep2,
    },
    {
      id: 'property-details',
      title: 'Property Details',
      description: 'Size and features',
      component: (
        <Step3PropertyDetails
          formData={formData}
          errors={errors}
          onFieldChange={handleChange}
        />
      ),
      validate: validateStep3,
    },
    {
      id: 'additional-info',
      title: 'Additional Info',
      description: 'Features and images',
      component: (
        <Step4AdditionalInfo
          formData={formData}
          featureInput={featureInput}
          onFieldChange={handleChange}
          onFeatureInputChange={setFeatureInput}
          onAddFeature={handleAddFeature}
          onRemoveFeature={handleRemoveFeature}
        />
      ),
      validate: validateStep4,
    },
  ], [
    formData,
    errors,
    contacts,
    contactSearchQuery,
    showContactSearch,
    loadingContacts,
    featureInput,
    handleChange,
    handleSelectOwner,
    handleClearOwner,
    handleAddFeature,
    handleRemoveFeature,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
  ]);

  // ==================== RENDER ====================

  return (
    <>
      <FormContainer
        title={editingProperty ? 'Edit Property' : 'Add New Property'}
        description={editingProperty ? 'Update property details' : 'Add a physical property to your portfolio'}
        onBack={onBack}
        icon={<Home className="w-5 h-5" />}
      >
        <MultiStepForm
          steps={steps}
          onComplete={handleComplete}
          submitText={isSubmitting ? 'Saving...' : editingProperty ? 'Update Property' : 'Add Property'}
          isSubmitting={isSubmitting}
          allowStepNavigation={true}
          showStepNumbers={true}
        />
      </FormContainer>

      {/* Quick Add Contact Modal */}
      {showQuickAdd && (
        <ContactFormModal
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onSuccess={(newContact) => {
            handleSelectOwner(newContact);
            setShowQuickAdd(false);
            toast.success(`Contact "${newContact.name}" added successfully!`);
          }}
          agentId={user.id}
          defaultType="seller"
        />
      )}
    </>
  );
}