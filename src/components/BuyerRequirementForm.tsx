/**
 * Buyer Requirement Form - Clean Implementation with Form Design Standards ✅
 * 
 * Simple form for capturing buyer requirements with:
 * - FormContainer + FormSection + FormField
 * - Complete validation
 * - Contact search and linking
 * - Budget range
 * - Property preferences
 * - Industry-standard requirement fields
 */

import React, { useState, useMemo, useEffect } from 'react';
import { User, Contact } from '../types';
import { FormContainer } from './ui/form-container';
import { FormSection, FormSectionDivider } from './ui/form-section';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  required,
  positiveNumber,
  email,
  pakistanPhone,
  minLength,
  maxLength,
  validateForm,
  hasErrors,
  type FormErrors,
} from '../lib/formValidation';
import { getContacts } from '../lib/data';
import { addBuyerRequirement } from '../lib/buyerRequirements';
import { createRentRequirement } from '../lib/rentRequirements';
import { toast } from 'sonner';
import { Loader2, Users, Search, Home } from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

interface RequirementFormData {
  // Contact Information
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;

  // Requirement Type
  requirementType: 'buy' | 'rent' | '';

  // Property Preferences
  propertyType: 'house' | 'apartment' | 'commercial' | 'land' | '';
  minBudget: string;
  maxBudget: string;
  preferredLocations: string[];

  // Details
  minArea: string;
  maxArea: string;
  areaUnit: 'sq yd' | 'sq ft' | 'marla' | 'kanal';
  minBedrooms: string;
  maxBedrooms: string;
  minBathrooms: string;

  // Additional Preferences
  furnishingPreference: 'furnished' | 'semi-furnished' | 'unfurnished' | 'any' | '';
  parkingRequired: boolean;
  mustHaveFeatures: string[];

  // Timeline & Priority
  urgency: 'low' | 'medium' | 'high' | '';
  moveInDate: string;

  // Notes
  additionalNotes: string;
}

interface BuyerRequirementFormProps {
  user: User;
  onBack: () => void;
  onSuccess: () => void;
  requirementType?: 'buy' | 'rent';
}

// ==================== CONSTANTS ====================

const KARACHI_AREAS = [
  'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 3', 'DHA Phase 4', 'DHA Phase 5',
  'DHA Phase 6', 'DHA Phase 7', 'DHA Phase 8',
  'Clifton Block 2', 'Clifton Block 4', 'Clifton Block 5', 'Clifton Block 8',
  'Bahria Town Karachi',
  'Gulshan-e-Iqbal', 'Gulistan-e-Jauhar',
  'North Nazimabad', 'Nazimabad',
  'PECHS', 'Tariq Road',
  'Malir', 'Korangi',
  'Saddar', 'I.I. Chundrigar Road',
];

const MUST_HAVE_FEATURES = [
  'Security System',
  'Backup Generator',
  'Water Tank',
  'Garden',
  'Swimming Pool',
  'Gym',
  'Elevator',
  'Central AC',
  'Servant Quarter',
  'Prayer Room',
  'Terrace',
  'Balcony',
];

// ==================== MAIN COMPONENT ====================

export function BuyerRequirementForm({
  user,
  onBack,
  onSuccess,
  requirementType: initialRequirementType,
}: BuyerRequirementFormProps) {
  const [formData, setFormData] = useState<RequirementFormData>({
    buyerId: '',
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    requirementType: initialRequirementType || '',
    propertyType: '',
    minBudget: '',
    maxBudget: '',
    preferredLocations: [],
    minArea: '',
    maxArea: '',
    areaUnit: 'sq yd',
    minBedrooms: '',
    maxBedrooms: '',
    minBathrooms: '',
    furnishingPreference: '',
    parkingRequired: false,
    mustHaveFeatures: [],
    urgency: '',
    moveInDate: '',
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<FormErrors<RequirementFormData>>({});
  const [touched, setTouched] = useState<Set<keyof RequirementFormData>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [selectedLocationInput, setSelectedLocationInput] = useState('');

  // Load contacts
  const contacts = useMemo(() => {
    return getContacts(user.id, user.role).filter((c) => {
      const cat = c.category?.toString().toLowerCase();
      return cat === 'buyer' || cat === 'tenant';
    });
  }, [user.id, user.role]);

  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery) return contacts;
    const query = contactSearchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query))
    );
  }, [contacts, contactSearchQuery]);

  // Handle field change
  const handleChange = (field: keyof RequirementFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle field blur
  const handleBlur = (field: keyof RequirementFormData) => {
    setTouched((prev) => new Set([...prev, field]));

    // Validate this field
    const validator = (validationRules as any)[field];
    if (validator) {
      const error = validator(formData[field] as any);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    }
  };

  // Handle contact selection
  const handleSelectContact = (contact: Contact) => {
    setFormData((prev) => ({
      ...prev,
      buyerId: contact.id,
      buyerName: contact.name,
      buyerPhone: contact.phone,
      buyerEmail: contact.email || '',
    }));
    setShowContactSearch(false);
    setContactSearchQuery('');
    toast.success(`Selected: ${contact.name}`);
  };

  // Handle location toggle
  const toggleLocation = (location: string) => {
    const current = formData.preferredLocations;
    const updated = current.includes(location)
      ? current.filter((l) => l !== location)
      : [...current, location];
    handleChange('preferredLocations', updated);
  };

  // Add custom location
  const addCustomLocation = () => {
    if (selectedLocationInput.trim()) {
      const current = formData.preferredLocations;
      if (!current.includes(selectedLocationInput.trim())) {
        handleChange('preferredLocations', [...current, selectedLocationInput.trim()]);
        setSelectedLocationInput('');
      }
    }
  };

  // Toggle feature
  const toggleFeature = (feature: string) => {
    const current = formData.mustHaveFeatures;
    const updated = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    handleChange('mustHaveFeatures', updated);
  };

  // Validation rules
  const validationRules = {
    buyerName: (value: string) =>
      required(value, 'Buyer name') || minLength(value, 2, 'Buyer name'),
    buyerPhone: (value: string) =>
      required(value, 'Phone') || pakistanPhone(value),
    buyerEmail: (value: string) => (value ? email(value) : undefined),
    requirementType: (value: string) => required(value, 'Requirement type'),
    propertyType: (value: string) => required(value, 'Property type'),
    minBudget: (value: string) =>
      required(value, 'Minimum budget') || positiveNumber(value, 'Minimum budget'),
    maxBudget: (value: string) => {
      if (!value) return undefined;
      const minBudget = parseFloat(formData.minBudget);
      const maxBudget = parseFloat(value);
      if (maxBudget < minBudget) {
        return 'Maximum budget must be greater than minimum budget';
      }
      return positiveNumber(value, 'Maximum budget');
    },
    preferredLocations: (value: string[]) =>
      value.length === 0 ? 'Select at least one location' : undefined,
    minArea: (value: string) => (value ? positiveNumber(value, 'Minimum area') : undefined),
    maxArea: (value: string) => {
      if (!value) return undefined;
      const minArea = parseFloat(formData.minArea || '0');
      const maxArea = parseFloat(value);
      if (maxArea < minArea) {
        return 'Maximum area must be greater than minimum area';
      }
      return positiveNumber(value, 'Maximum area');
    },
    additionalNotes: (value: string) =>
      value ? maxLength(value, 1000, 'Additional notes') : undefined,
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateForm(formData, validationRules as any);

    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      toast.error('Please fix the errors in the form');
      setTouched(new Set(Object.keys(formData) as Array<keyof RequirementFormData>));
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if this is a rent requirement
      if (formData.requirementType === 'rent') {
        // Create rent requirement
        const rentRequirementData = {
          contactId: formData.buyerId || `renter-${Date.now()}`,
          renterId: formData.buyerId || `renter-${Date.now()}`,
          renterName: formData.buyerName,
          renterContact: formData.buyerPhone,
          renterEmail: formData.buyerEmail,
          propertyType: formData.propertyType ? [formData.propertyType] : [],
          budgetMin: parseFloat(formData.minBudget),
          budgetMax: parseFloat(formData.maxBudget),
          preferredAreas: formData.preferredLocations,
          minBedrooms: formData.minBedrooms ? parseInt(formData.minBedrooms) : undefined,
          maxBedrooms: formData.maxBedrooms ? parseInt(formData.maxBedrooms) : undefined,
          minBathrooms: formData.minBathrooms ? parseInt(formData.minBathrooms) : undefined,
          features: formData.mustHaveFeatures,
          urgency: formData.urgency || undefined,
          targetMoveDate: formData.moveInDate || undefined,
          additionalNotes: formData.additionalNotes,
          agentId: user.id,
          agentName: user.name,
          status: 'active' as const,
        };

        createRentRequirement(rentRequirementData);
        toast.success('Rent requirement added successfully!');
      } else {
        // Create buyer requirement
        const requirementData = {
          buyerId: formData.buyerId || `buyer-${Date.now()}`,
          buyerName: formData.buyerName,
          buyerContact: formData.buyerPhone,
          propertyTypes: formData.propertyType ? [formData.propertyType] : [],
          minBudget: parseFloat(formData.minBudget),
          maxBudget: parseFloat(formData.maxBudget),
          preferredLocations: formData.preferredLocations,
          minBedrooms: formData.minBedrooms ? parseInt(formData.minBedrooms) : 0,
          maxBedrooms: formData.maxBedrooms ? parseInt(formData.maxBedrooms) : undefined,
          minBathrooms: formData.minBathrooms ? parseInt(formData.minBathrooms) : undefined,
          mustHaveFeatures: formData.mustHaveFeatures,
          urgency: (formData.urgency || 'medium') as 'low' | 'medium' | 'high',
          targetMoveDate: formData.moveInDate || undefined,
          additionalNotes: formData.additionalNotes,
          agentId: user.id,
          agentName: user.name,
        };

        addBuyerRequirement(requirementData);
        toast.success('Buyer requirement added successfully!');
      }

      onSuccess();
    } catch (error) {
      console.error('Error adding requirement:', error);
      toast.error('Failed to add requirement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContainer
      title={`Add ${formData.requirementType === 'rent' ? 'Rent' : 'Buyer'} Requirement`}
      description="Capture detailed buyer/tenant preferences for property matching"
      onBack={onBack}
      onSubmit={handleSubmit}
      maxWidth="lg"
    >
      <FormContainer.Body>
        {/* Contact Import */}
        {contacts.length > 0 && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      Import from Existing Contacts
                    </p>
                    <p className="text-sm text-blue-700">
                      {contacts.length} buyer/tenant contacts available
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContactSearch(!showContactSearch)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {showContactSearch ? 'Hide' : 'Search'}
                </Button>
              </div>

              {showContactSearch && (
                <div className="mt-4 space-y-3">
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                  />
                  {filteredContacts.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredContacts.slice(0, 10).map((contact) => (
                        <div
                          key={contact.id}
                          className="p-3 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleSelectContact(contact)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-gray-600">
                                {contact.phone}
                              </p>
                            </div>
                            <Badge variant="secondary">{contact.type}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No contacts found
                    </p>
                  )}
                </div>
              )}
            </div>
            <FormSectionDivider />
          </>
        )}

        {/* Buyer Information */}
        <FormSection
          title="Buyer/Tenant Information"
          description="Contact details of the person looking for property"
        >
          <FormField
            label="Full Name"
            required
            error={touched.has('buyerName') ? errors.buyerName : undefined}
          >
            <Input
              value={formData.buyerName}
              onChange={(e) => handleChange('buyerName', e.target.value)}
              onBlur={() => handleBlur('buyerName')}
              placeholder="Enter full name"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Phone Number"
              required
              error={touched.has('buyerPhone') ? errors.buyerPhone : undefined}
            >
              <Input
                type="tel"
                value={formData.buyerPhone}
                onChange={(e) => handleChange('buyerPhone', e.target.value)}
                onBlur={() => handleBlur('buyerPhone')}
                placeholder="03001234567"
              />
            </FormField>

            <FormField
              label="Email"
              error={touched.has('buyerEmail') ? errors.buyerEmail : undefined}
              hint="Optional"
            >
              <Input
                type="email"
                value={formData.buyerEmail}
                onChange={(e) => handleChange('buyerEmail', e.target.value)}
                onBlur={() => handleBlur('buyerEmail')}
                placeholder="buyer@example.com"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSectionDivider />

        {/* Requirement Type */}
        <FormSection
          title="Requirement Details"
          description="What type of property are they looking for?"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Looking For"
              required
              error={touched.has('requirementType') ? errors.requirementType : undefined}
            >
              <Select
                value={formData.requirementType}
                onValueChange={(value) => handleChange('requirementType', value)}
              >
                <SelectTrigger onBlur={() => handleBlur('requirementType')}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Property Type"
              required
              error={touched.has('propertyType') ? errors.propertyType : undefined}
            >
              <Select
                value={formData.propertyType}
                onValueChange={(value) => handleChange('propertyType', value)}
              >
                <SelectTrigger onBlur={() => handleBlur('propertyType')}>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land/Plot</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={`Minimum ${formData.requirementType === 'rent' ? 'Monthly Rent' : 'Budget'} (PKR)`}
              required
              error={touched.has('minBudget') ? errors.minBudget : undefined}
            >
              <Input
                type="number"
                value={formData.minBudget}
                onChange={(e) => handleChange('minBudget', e.target.value)}
                onBlur={() => handleBlur('minBudget')}
                placeholder="5000000"
                min="0"
              />
            </FormField>

            <FormField
              label={`Maximum ${formData.requirementType === 'rent' ? 'Monthly Rent' : 'Budget'} (PKR)`}
              error={touched.has('maxBudget') ? errors.maxBudget : undefined}
              hint="Optional"
            >
              <Input
                type="number"
                value={formData.maxBudget}
                onChange={(e) => handleChange('maxBudget', e.target.value)}
                onBlur={() => handleBlur('maxBudget')}
                placeholder="10000000"
                min="0"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSectionDivider />

        {/* Location Preferences */}
        <FormSection title="Location Preferences">
          <FormField
            label="Preferred Locations"
            required
            error={touched.has('preferredLocations') ? errors.preferredLocations : undefined}
            hint={`${formData.preferredLocations.length} locations selected`}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {KARACHI_AREAS.map((area) => (
                  <div
                    key={area}
                    className={`p-2 border rounded cursor-pointer transition-colors ${formData.preferredLocations.includes(area)
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => toggleLocation(area)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{area}</span>
                      {formData.preferredLocations.includes(area) && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Location */}
              <div className="flex gap-2">
                <Input
                  value={selectedLocationInput}
                  onChange={(e) => setSelectedLocationInput(e.target.value)}
                  placeholder="Add custom location..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomLocation();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomLocation}
                >
                  Add
                </Button>
              </div>

              {/* Selected Locations */}
              {formData.preferredLocations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.preferredLocations.map((location) => (
                    <Badge
                      key={location}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleLocation(location)}
                    >
                      {location} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </FormField>
        </FormSection>

        <FormSectionDivider />

        {/* Property Specifications */}
        <FormSection title="Property Specifications">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Minimum Area" hint="Optional">
              <Input
                type="number"
                value={formData.minArea}
                onChange={(e) => handleChange('minArea', e.target.value)}
                placeholder="500"
                min="0"
              />
            </FormField>

            <FormField label="Maximum Area" hint="Optional">
              <Input
                type="number"
                value={formData.maxArea}
                onChange={(e) => handleChange('maxArea', e.target.value)}
                onBlur={() => handleBlur('maxArea')}
                placeholder="1000"
                min="0"
              />
            </FormField>

            <FormField label="Area Unit">
              <Select
                value={formData.areaUnit}
                onValueChange={(value) => handleChange('areaUnit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sq yd">Square Yards</SelectItem>
                  <SelectItem value="sq ft">Square Feet</SelectItem>
                  <SelectItem value="marla">Marla</SelectItem>
                  <SelectItem value="kanal">Kanal</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {formData.propertyType !== 'land' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Minimum Bedrooms">
                  <Input
                    type="number"
                    value={formData.minBedrooms}
                    onChange={(e) => handleChange('minBedrooms', e.target.value)}
                    placeholder="3"
                    min="0"
                  />
                </FormField>

                <FormField label="Maximum Bedrooms">
                  <Input
                    type="number"
                    value={formData.maxBedrooms}
                    onChange={(e) => handleChange('maxBedrooms', e.target.value)}
                    placeholder="5"
                    min="0"
                  />
                </FormField>

                <FormField label="Minimum Bathrooms">
                  <Input
                    type="number"
                    value={formData.minBathrooms}
                    onChange={(e) => handleChange('minBathrooms', e.target.value)}
                    placeholder="2"
                    min="0"
                  />
                </FormField>
              </div>

              <FormField label="Furnishing Preference">
                <Select
                  value={formData.furnishingPreference}
                  onValueChange={(value) => handleChange('furnishingPreference', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="furnished">Fully Furnished</SelectItem>
                    <SelectItem value="semi-furnished">Semi Furnished</SelectItem>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="parking"
                  checked={formData.parkingRequired}
                  onCheckedChange={(checked) =>
                    handleChange('parkingRequired', checked)
                  }
                />
                <Label htmlFor="parking" className="cursor-pointer">
                  Parking Required
                </Label>
              </div>

              {/* Must-Have Features */}
              <div>
                <Label className="mb-3 block">
                  Must-Have Features
                  <span className="text-sm text-gray-500 ml-2">
                    ({formData.mustHaveFeatures.length} selected)
                  </span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MUST_HAVE_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature}
                        checked={formData.mustHaveFeatures.includes(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <Label htmlFor={feature} className="cursor-pointer text-sm">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </FormSection>

        <FormSectionDivider />

        {/* Timeline & Notes */}
        <FormSection title="Timeline & Additional Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Urgency">
              <Select
                value={formData.urgency}
                onValueChange={(value) => handleChange('urgency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Exploring options</SelectItem>
                  <SelectItem value="medium">Medium - Actively searching</SelectItem>
                  <SelectItem value="high">High - Urgent requirement</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={formData.requirementType === 'rent' ? 'Preferred Move-in Date' : 'Target Purchase Date'}
              hint="Optional"
            >
              <Input
                type="date"
                value={formData.moveInDate}
                onChange={(e) => handleChange('moveInDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </FormField>
          </div>

          <FormField
            label="Additional Notes"
            error={touched.has('additionalNotes') ? errors.additionalNotes : undefined}
            hint={`${formData.additionalNotes.length}/1000 characters`}
          >
            <Textarea
              value={formData.additionalNotes}
              onChange={(e) => handleChange('additionalNotes', e.target.value)}
              onBlur={() => handleBlur('additionalNotes')}
              placeholder="Any other specific requirements, preferences, or notes..."
              rows={4}
              maxLength={1000}
            />
          </FormField>
        </FormSection>
      </FormContainer.Body>

      {/* Form Actions */}
      <FormContainer.Footer>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding Requirement...
            </>
          ) : (
            <>
              <Home className="h-4 w-4 mr-2" />
              Add Requirement
            </>
          )}
        </Button>
      </FormContainer.Footer>
    </FormContainer>
  );
}

