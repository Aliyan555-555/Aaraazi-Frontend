/**
 * Create/Edit Investor Modal - Multi-Step Form V2
 * Design System V4.1 Compliant - Wizard Style
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import {
  createInvestor,
  updateInvestor,
  validateCNIC,
  validatePakistaniPhone,
  validateEmail,
  isDuplicateEmail,
  isDuplicatePhone,
  isDuplicateCNIC,
  formatCNIC,
  formatPakistaniPhone
} from '../lib/investors';
import { Investor } from '../types';
import { toast } from 'sonner';

interface CreateInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvestor?: Investor | null;
  onInvestorCreated?: () => void;
}

interface FormData {
  // Personal Information
  name: string;
  cnic: string;
  email: string;
  phone: string;
  address: string;
  city: string;

  // Investment Profile
  investorType: 'individual' | 'company' | 'partnership' | 'trust';
  totalInvestmentCapacity: string;
  investmentHorizon: 'short-term' | 'medium-term' | 'long-term';
  riskProfile: 'conservative' | 'moderate' | 'aggressive';

  // Investment Preferences
  minimumInvestmentAmount: string;
  maximumInvestmentAmount: string;
  preferredPropertyTypes: string[];
  preferredLocations: string[];

  // Banking Information
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;

  // Additional Information
  previousInvestments: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  cnic?: string;
  email?: string;
  phone?: string;
  address?: string;
  totalInvestmentCapacity?: string;
  minimumInvestmentAmount?: string;
  maximumInvestmentAmount?: string;
  iban?: string;
}

// Property Type Options
const PROPERTY_TYPES = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Mixed-Use', label: 'Mixed-Use' },
  { value: 'Land', label: 'Land' },
];

// Location Options (Karachi specific)
const LOCATIONS = [
  { value: 'DHA', label: 'DHA' },
  { value: 'Clifton', label: 'Clifton' },
  { value: 'Gulshan-e-Iqbal', label: 'Gulshan-e-Iqbal' },
  { value: 'North Nazimabad', label: 'North Nazimabad' },
  { value: 'Bahria Town', label: 'Bahria Town' },
  { value: 'Malir', label: 'Malir' },
  { value: 'Saddar', label: 'Saddar' },
  { value: 'PECHS', label: 'PECHS' },
];

// Multi-step form steps
const STEPS = [
  { id: 1, title: 'Personal Info', description: 'Basic details' },
  { id: 2, title: 'Investment Profile', description: 'Investor classification' },
  { id: 3, title: 'Preferences', description: 'Investment preferences' },
  { id: 4, title: 'Banking & Notes', description: 'Additional details' },
];

export default function CreateInvestorModal({
  isOpen,
  onClose,
  editingInvestor,
  onInvestorCreated
}: CreateInvestorModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    cnic: '',
    email: '',
    phone: '',
    address: '',
    city: 'Karachi',
    investorType: 'individual',
    totalInvestmentCapacity: '',
    investmentHorizon: 'medium-term',
    riskProfile: 'moderate',
    minimumInvestmentAmount: '',
    maximumInvestmentAmount: '',
    preferredPropertyTypes: [],
    preferredLocations: [],
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    previousInvestments: '',
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate progress
  const progress = (currentStep / STEPS.length) * 100;

  // Load investor data when editing
  useEffect(() => {
    if (editingInvestor) {
      setFormData({
        name: editingInvestor.name || '',
        cnic: editingInvestor.cnic || '',
        email: editingInvestor.email || '',
        phone: editingInvestor.phone || '',
        address: editingInvestor.address || '',
        city: editingInvestor.city || 'Karachi',
        investorType: editingInvestor.investorType || 'individual',
        totalInvestmentCapacity: editingInvestor.totalInvestmentCapacity?.toString() || '',
        investmentHorizon: editingInvestor.investmentHorizon || 'medium-term',
        riskProfile: editingInvestor.riskProfile || 'moderate',
        minimumInvestmentAmount: editingInvestor.minimumInvestmentAmount?.toString() || '',
        maximumInvestmentAmount: editingInvestor.maximumInvestmentAmount?.toString() || '',
        preferredPropertyTypes: editingInvestor.preferredPropertyTypes || [],
        preferredLocations: editingInvestor.preferredLocations || [],
        bankName: editingInvestor.bankName || '',
        accountTitle: editingInvestor.accountTitle || '',
        accountNumber: editingInvestor.accountNumber || '',
        iban: editingInvestor.iban || '',
        previousInvestments: editingInvestor.previousInvestments || '',
        notes: editingInvestor.notes || ''
      });
    } else {
      // Reset form
      setFormData({
        name: '',
        cnic: '',
        email: '',
        phone: '',
        address: '',
        city: 'Karachi',
        investorType: 'individual',
        totalInvestmentCapacity: '',
        investmentHorizon: 'medium-term',
        riskProfile: 'moderate',
        minimumInvestmentAmount: '',
        maximumInvestmentAmount: '',
        preferredPropertyTypes: [],
        preferredLocations: [],
        bankName: '',
        accountTitle: '',
        accountNumber: '',
        iban: '',
        previousInvestments: '',
        notes: ''
      });
    }
    setErrors({});
    setCurrentStep(1);
  }, [editingInvestor, isOpen]);

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      // Personal Information validation
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required';
      } else if (formData.name.trim().length < 3) {
        newErrors.name = 'Name must be at least 3 characters';
      }

      if (formData.cnic) {
        if (!validateCNIC(formData.cnic)) {
          newErrors.cnic = 'Invalid CNIC format (e.g., 12345-1234567-1)';
        } else if (isDuplicateCNIC(formData.cnic, editingInvestor?.id)) {
          newErrors.cnic = 'This CNIC is already registered';
        }
      }

      if (formData.email) {
        if (!validateEmail(formData.email)) {
          newErrors.email = 'Invalid email format';
        } else if (isDuplicateEmail(formData.email, editingInvestor?.id)) {
          newErrors.email = 'This email is already registered';
        }
      }

      if (formData.phone) {
        if (!validatePakistaniPhone(formData.phone)) {
          newErrors.phone = 'Invalid phone format (e.g., 03001234567)';
        } else if (isDuplicatePhone(formData.phone, editingInvestor?.id)) {
          newErrors.phone = 'This phone number is already registered';
        }
      }

      if (!formData.email && !formData.phone) {
        newErrors.email = 'Provide at least email or phone';
        newErrors.phone = 'Provide at least email or phone';
      }
    }

    if (step === 2) {
      // Investment Profile validation
      if (formData.totalInvestmentCapacity) {
        const capacity = parseFloat(formData.totalInvestmentCapacity);
        if (isNaN(capacity) || capacity <= 0) {
          newErrors.totalInvestmentCapacity = 'Must be a positive number';
        }
      }
    }

    if (step === 3) {
      // Investment Preferences validation
      if (formData.minimumInvestmentAmount) {
        const min = parseFloat(formData.minimumInvestmentAmount);
        if (isNaN(min) || min <= 0) {
          newErrors.minimumInvestmentAmount = 'Must be a positive number';
        }
      }

      if (formData.maximumInvestmentAmount) {
        const max = parseFloat(formData.maximumInvestmentAmount);
        if (isNaN(max) || max <= 0) {
          newErrors.maximumInvestmentAmount = 'Must be a positive number';
        }

        const min = parseFloat(formData.minimumInvestmentAmount);
        if (!isNaN(min) && max < min) {
          newErrors.maximumInvestmentAmount = 'Must be greater than minimum';
        }
      }
    }

    if (step === 4) {
      // Banking validation
      if (formData.iban) {
        const ibanClean = formData.iban.replace(/\s/g, '');
        if (!/^PK\d{2}[A-Z]{4}\d{16}$/.test(ibanClean)) {
          newErrors.iban = 'Invalid IBAN format (e.g., PK36SCBL0000001123456702)';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error('Validation Error', {
        description: 'Please fix the errors before proceeding'
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all steps before submission
    let allValid = true;
    for (let i = 1; i <= STEPS.length; i++) {
      if (!validateStep(i)) {
        allValid = false;
        setCurrentStep(i);
        toast.error('Validation Error', {
          description: `Please fix errors in step ${i}: ${STEPS[i - 1].title}`
        });
        break;
      }
    }

    if (!allValid) return;

    setIsSubmitting(true);

    try {
      const investorData: Partial<Investor> = {
        name: formData.name.trim(),
        cnic: formData.cnic ? formatCNIC(formData.cnic) : undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone ? formatPakistaniPhone(formData.phone) : undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        investorType: formData.investorType,
        riskProfile: formData.riskProfile,
        investmentHorizon: formData.investmentHorizon,
        totalInvestmentCapacity: formData.totalInvestmentCapacity ? parseFloat(formData.totalInvestmentCapacity) : undefined,
        minimumInvestmentAmount: formData.minimumInvestmentAmount ? parseFloat(formData.minimumInvestmentAmount) : undefined,
        maximumInvestmentAmount: formData.maximumInvestmentAmount ? parseFloat(formData.maximumInvestmentAmount) : undefined,
        preferredPropertyTypes: formData.preferredPropertyTypes.length > 0 ? formData.preferredPropertyTypes : undefined,
        preferredLocations: formData.preferredLocations.length > 0 ? formData.preferredLocations : undefined,
        bankName: formData.bankName.trim() || undefined,
        accountTitle: formData.accountTitle.trim() || undefined,
        accountNumber: formData.accountNumber.trim() || undefined,
        iban: formData.iban.trim() || undefined,
        previousInvestments: formData.previousInvestments.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };

      if (editingInvestor) {
        updateInvestor(editingInvestor.id, investorData);
        toast.success('Investor Updated', {
          description: `${investorData.name} has been updated successfully`
        });
      } else {
        const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        createInvestor(investorData, currentUser.id || 'system', currentUser.name || 'System');
        toast.success('Investor Created', {
          description: `${investorData.name} has been added to the registry`
        });
      }

      if (onInvestorCreated) {
        onInvestorCreated();
      }
      onClose();
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to save investor. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  };

  const togglePropertyType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferredPropertyTypes: prev.preferredPropertyTypes.includes(type)
        ? prev.preferredPropertyTypes.filter(t => t !== type)
        : [...prev.preferredPropertyTypes, type]
    }));
  };

  const toggleLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.includes(location)
        ? prev.preferredLocations.filter(l => l !== location)
        : [...prev.preferredLocations, location]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {editingInvestor ? 'Edit Investor' : 'Add New Investor'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].description}
              </DialogDescription>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 ${step.id === currentStep
                      ? 'text-[var(--color-primary)] font-medium'
                      : step.id < currentStep
                        ? 'text-green-600'
                        : ''
                    }`}
                >
                  {step.id < currentStep && <Check className="w-3 h-3" />}
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-1">
          <div className="py-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg text-[var(--color-primary)] mb-1">Personal Information</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Enter the investor's basic contact details
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Full Name <span className="text-[var(--color-destructive)]">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Enter full name"
                      className={errors.name ? 'border-[var(--color-destructive)]' : ''}
                    />
                    {errors.name && (
                      <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnic">CNIC</Label>
                    <Input
                      id="cnic"
                      value={formData.cnic}
                      onChange={(e) => handleChange('cnic', e.target.value)}
                      placeholder="12345-1234567-1"
                      maxLength={15}
                      className={errors.cnic ? 'border-[var(--color-destructive)]' : ''}
                    />
                    {errors.cnic && (
                      <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.cnic}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Format: XXXXX-XXXXXXX-X
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-[var(--color-destructive)]">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="investor@example.com"
                      className={errors.email ? 'border-[var(--color-destructive)]' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone <span className="text-[var(--color-destructive)]">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="03001234567"
                      maxLength={13}
                      className={errors.phone ? 'border-[var(--color-destructive)]' : ''}
                    />
                    {errors.phone && (
                      <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Complete address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Karachi"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <p className="text-blue-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>At least one contact method (email or phone) is required</span>
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Investment Profile */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg text-[var(--color-primary)] mb-1">Investment Profile</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Define investor classification and investment capacity
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investorType">Investor Type</Label>
                    <Select
                      value={formData.investorType}
                      onValueChange={(value: any) => handleChange('investorType', value)}
                    >
                      <SelectTrigger id="investorType">
                        <SelectValue placeholder="Select investor type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="trust">Trust</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Legal structure of the investor
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalInvestmentCapacity">Total Investment Capacity (PKR)</Label>
                    <Input
                      id="totalInvestmentCapacity"
                      type="number"
                      value={formData.totalInvestmentCapacity}
                      onChange={(e) => handleChange('totalInvestmentCapacity', e.target.value)}
                      placeholder="5000000"
                      className={errors.totalInvestmentCapacity ? 'border-[var(--color-destructive)]' : ''}
                    />
                    {errors.totalInvestmentCapacity && (
                      <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.totalInvestmentCapacity}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Total amount available for investment
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investmentHorizon">Investment Horizon</Label>
                    <Select
                      value={formData.investmentHorizon}
                      onValueChange={(value: any) => handleChange('investmentHorizon', value)}
                    >
                      <SelectTrigger id="investmentHorizon">
                        <SelectValue placeholder="Select horizon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short-term">Short-term (1-2 years)</SelectItem>
                        <SelectItem value="medium-term">Medium-term (3-5 years)</SelectItem>
                        <SelectItem value="long-term">Long-term (5+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Expected investment duration
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riskProfile">Risk Profile</Label>
                    <Select
                      value={formData.riskProfile}
                      onValueChange={(value: any) => handleChange('riskProfile', value)}
                    >
                      <SelectTrigger id="riskProfile">
                        <SelectValue placeholder="Select risk profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative - Low risk tolerance</SelectItem>
                        <SelectItem value="moderate">Moderate - Balanced approach</SelectItem>
                        <SelectItem value="aggressive">Aggressive - High risk tolerance</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Risk tolerance level
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    💡 <strong>Tip:</strong> Understanding the investor's profile helps match them with suitable properties and investment opportunities.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Investment Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg text-[var(--color-primary)] mb-1">Investment Preferences</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Set investment criteria and property preferences
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimumInvestmentAmount">Minimum Investment Amount (PKR)</Label>
                    <Input
                      id="minimumInvestmentAmount"
                      type="number"
                      value={formData.minimumInvestmentAmount}
                      onChange={(e) => handleChange('minimumInvestmentAmount', e.target.value)}
                      placeholder="500000"
                      className={errors.minimumInvestmentAmount ? 'border-[var(--color-destructive)]' : ''}
                    />
                    {errors.minimumInvestmentAmount && (
                      <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.minimumInvestmentAmount}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Minimum per property
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maximumInvestmentAmount">Maximum Investment Amount (PKR)</Label>
                    <Input
                      id="maximumInvestmentAmount"
                      type="number"
                      value={formData.maximumInvestmentAmount}
                      onChange={(e) => handleChange('maximumInvestmentAmount', e.target.value)}
                      placeholder="2000000"
                      className={errors.maximumInvestmentAmount ? 'border-[var(--color-destructive)]' : ''}
                    />
                    {errors.maximumInvestmentAmount && (
                      <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.maximumInvestmentAmount}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Maximum per property (optional)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Preferred Property Types</Label>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Select all property types the investor is interested in
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {PROPERTY_TYPES.map(type => (
                      <div
                        key={type.value}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.preferredPropertyTypes.includes(type.value)
                            ? 'border-[var(--color-primary)] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => togglePropertyType(type.value)}
                      >
                        <Checkbox
                          id={`property-${type.value}`}
                          checked={formData.preferredPropertyTypes.includes(type.value)}
                          onCheckedChange={() => togglePropertyType(type.value)}
                        />
                        <Label
                          htmlFor={`property-${type.value}`}
                          className="cursor-pointer flex-1"
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Preferred Locations</Label>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Select preferred areas in Karachi
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {LOCATIONS.map(location => (
                      <div
                        key={location.value}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.preferredLocations.includes(location.value)
                            ? 'border-[var(--color-primary)] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => toggleLocation(location.value)}
                      >
                        <Checkbox
                          id={`location-${location.value}`}
                          checked={formData.preferredLocations.includes(location.value)}
                          onCheckedChange={() => toggleLocation(location.value)}
                        />
                        <Label
                          htmlFor={`location-${location.value}`}
                          className="cursor-pointer flex-1"
                        >
                          {location.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Banking & Additional Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg text-[var(--color-primary)] mb-1">Banking & Additional Details</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Optional banking information and notes
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-[var(--color-primary)]">Banking Information</h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    All banking fields are optional but helpful for transactions
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => handleChange('bankName', e.target.value)}
                        placeholder="e.g., Meezan Bank"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountTitle">Account Title</Label>
                      <Input
                        id="accountTitle"
                        value={formData.accountTitle}
                        onChange={(e) => handleChange('accountTitle', e.target.value)}
                        placeholder="Account holder name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={(e) => handleChange('accountNumber', e.target.value)}
                        placeholder="0123456789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="iban">IBAN</Label>
                      <Input
                        id="iban"
                        value={formData.iban}
                        onChange={(e) => handleChange('iban', e.target.value)}
                        placeholder="PK36SCBL0000001123456702"
                        className={errors.iban ? 'border-[var(--color-destructive)]' : ''}
                      />
                      {errors.iban && (
                        <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.iban}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium text-[var(--color-primary)]">Additional Information</h4>

                  <div className="space-y-2">
                    <Label htmlFor="previousInvestments">Previous Investment Experience</Label>
                    <Textarea
                      id="previousInvestments"
                      value={formData.previousInvestments}
                      onChange={(e) => handleChange('previousInvestments', e.target.value)}
                      placeholder="Describe any previous real estate investments..."
                      rows={3}
                    />
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Brief description of past experience (optional)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Any additional notes about this investor..."
                      rows={4}
                      maxLength={1000}
                    />
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {formData.notes.length}/1000 characters
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <div className="text-sm text-[var(--color-text-secondary)]">
            Step {currentStep} of {STEPS.length}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingInvestor
                    ? 'Update Investor'
                    : 'Create Investor'
                }
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
