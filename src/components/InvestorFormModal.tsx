import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Investor, User } from '../types';
// [STUBBED] import {
// [STUBBED]   validateCNIC,
// [STUBBED]   validatePakistaniPhone,
// [STUBBED]   validateEmail,
// [STUBBED]   isDuplicateEmail,
// [STUBBED]   formatCNIC,
// [STUBBED]   formatPakistaniPhone
// [STUBBED] } from '../lib/investors';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Building2,
  CreditCard,
  FileCheck,
  Settings,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Landmark,
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';

// ===== STUBS for removed prototype functions =====
const validateCNIC = (..._args: any[]): any => { /* stub - prototype function removed */ };
const validatePakistaniPhone = (..._args: any[]): any => { /* stub - prototype function removed */ };
const validateEmail = (..._args: any[]): any => { /* stub - prototype function removed */ };
const isDuplicateEmail = (..._args: any[]): any => { /* stub - prototype function removed */ };
const formatCNIC = (..._args: any[]): any => { /* stub - prototype function removed */ };
const formatPakistaniPhone = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface InvestorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (investor: Partial<Investor>) => void;
  investor?: Investor | null;
  user: User;
  agents?: User[]; // For relationship manager selection
}

export const InvestorFormModal: React.FC<InvestorFormModalProps> = ({
  open,
  onClose,
  onSave,
  investor,
  user,
  agents = []
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    email: '',
    phone: '',
    investorType: 'individual' as 'individual' | 'company' | 'partnership' | 'trust' | 'corporate' | 'institutional',
    status: 'active' as 'active' | 'inactive' | 'prospective' | 'archived',
    address: '',
    city: '',

    // Legal Info
    nationalId: '',
    taxId: '',
    sourceOfFunds: '',

    // Secondary Contact
    secondaryContactName: '',
    secondaryContactPhone: '',
    secondaryContactEmail: '',
    secondaryContactRelationship: '',

    // Bank Details
    bankAccountTitle: '',
    bankAccountNumber: '',
    bankName: '',
    bankBranchName: '',
    bankIban: '',
    bankSwiftCode: '',

    // KYC
    kycStatus: 'pending' as 'pending' | 'verified' | 'rejected' | 'expired',
    kycVerifiedDate: '',
    kycExpiryDate: '',
    kycNotes: '',

    // Preferences
    prefMinAmount: '',
    prefMaxAmount: '',
    prefPropertyTypes: [] as string[],
    prefLocations: [] as string[],
    prefRiskTolerance: 'medium' as 'low' | 'medium' | 'high',
    prefInvestmentStrategy: 'buy-and-hold' as 'buy-and-hold' | 'flip' | 'rental-income' | 'development',

    // Management
    relationshipManager: '',
    tags: [] as string[],
    notes: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (investor) {
      setFormData({
        name: investor.name || '',
        email: investor.email || '',
        phone: investor.phone || '',
        investorType: investor.investorType || 'individual',
        status: investor.status || 'active',
        address: investor.address || '',
        city: investor.city || '',
        nationalId: investor.nationalId || '',
        taxId: investor.taxId || '',
        sourceOfFunds: investor.sourceOfFunds || '',
        secondaryContactName: investor.secondaryContact?.name || '',
        secondaryContactPhone: investor.secondaryContact?.phone || '',
        secondaryContactEmail: investor.secondaryContact?.email || '',
        secondaryContactRelationship: investor.secondaryContact?.relationship || '',
        bankAccountTitle: investor.bankDetails?.accountTitle || '',
        bankAccountNumber: investor.bankDetails?.accountNumber || '',
        bankName: investor.bankDetails?.bankName || '',
        bankBranchName: investor.bankDetails?.branchName || '',
        bankIban: investor.bankDetails?.iban || '',
        bankSwiftCode: investor.bankDetails?.swiftCode || '',
        kycStatus: investor.kycStatus || 'pending',
        kycVerifiedDate: investor.kycVerifiedDate || '',
        kycExpiryDate: investor.kycExpiryDate || '',
        kycNotes: investor.kycNotes || '',
        prefMinAmount: investor.preferences?.minInvestmentAmount?.toString() || '',
        prefMaxAmount: investor.preferences?.maxInvestmentAmount?.toString() || '',
        prefPropertyTypes: investor.preferences?.preferredPropertyTypes || [],
        prefLocations: investor.preferences?.preferredLocations || [],
        prefRiskTolerance: investor.preferences?.riskTolerance || 'medium',
        prefInvestmentStrategy: (investor.preferences?.investmentStrategy as any) || 'buy-and-hold',
        relationshipManager: investor.relationshipManager || '',
        tags: investor.tags || [],
        notes: investor.notes || ''
      });
    } else {
      // Reset form for new investor
      setFormData({
        name: '',
        email: '',
        phone: '',
        investorType: 'individual',
        status: 'active',
        address: '',
        city: '',
        nationalId: '',
        taxId: '',
        sourceOfFunds: '',
        secondaryContactName: '',
        secondaryContactPhone: '',
        secondaryContactEmail: '',
        secondaryContactRelationship: '',
        bankAccountTitle: '',
        bankAccountNumber: '',
        bankName: '',
        bankBranchName: '',
        bankIban: '',
        bankSwiftCode: '',
        kycStatus: 'pending',
        kycVerifiedDate: '',
        kycExpiryDate: '',
        kycNotes: '',
        prefMinAmount: '',
        prefMaxAmount: '',
        prefPropertyTypes: [],
        prefLocations: [],
        prefRiskTolerance: 'medium',
        prefInvestmentStrategy: 'buy-and-hold',
        relationshipManager: '',
        tags: [],
        notes: ''
      });
    }
    setValidationErrors({});
    setActiveTab('basic');
  }, [investor, open]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic validations
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    } else if (isDuplicateEmail(formData.email, investor?.id)) {
      errors.email = 'Email already exists for another investor';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!validatePakistaniPhone(formData.phone)) {
      errors.phone = 'Invalid Pakistani phone number format';
    }

    // CNIC validation (optional but format check if provided)
    if (formData.nationalId && !validateCNIC(formData.nationalId)) {
      errors.nationalId = 'Invalid CNIC format (should be XXXXX-XXXXXXX-X)';
    }

    // Secondary contact phone validation
    if (formData.secondaryContactPhone && !validatePakistaniPhone(formData.secondaryContactPhone)) {
      errors.secondaryContactPhone = 'Invalid phone number format';
    }

    // Secondary contact email validation
    if (formData.secondaryContactEmail && !validateEmail(formData.secondaryContactEmail)) {
      errors.secondaryContactEmail = 'Invalid email format';
    }

    // Investment amount validation
    if (formData.prefMinAmount && formData.prefMaxAmount) {
      const min = parseFloat(formData.prefMinAmount);
      const max = parseFloat(formData.prefMaxAmount);
      if (min > max) {
        errors.prefMinAmount = 'Minimum cannot be greater than maximum';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    const investorData: Partial<Investor> = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formatPakistaniPhone(formData.phone),
      investorType: formData.investorType,
      status: formData.status,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      nationalId: formData.nationalId ? formatCNIC(formData.nationalId) : undefined,
      taxId: formData.taxId.trim() || undefined,
      sourceOfFunds: formData.sourceOfFunds.trim() || undefined,
    };

    // Secondary Contact
    if (formData.secondaryContactName || formData.secondaryContactPhone) {
      investorData.secondaryContact = {
        name: formData.secondaryContactName.trim(),
        phone: formData.secondaryContactPhone ? formatPakistaniPhone(formData.secondaryContactPhone) : '',
        email: formData.secondaryContactEmail.trim() || undefined,
        relationship: formData.secondaryContactRelationship.trim() || undefined
      };
    }

    // Bank Details
    if (formData.bankAccountTitle || formData.bankAccountNumber) {
      investorData.bankDetails = {
        accountTitle: formData.bankAccountTitle.trim(),
        accountNumber: formData.bankAccountNumber.trim(),
        bankName: formData.bankName.trim(),
        branchName: formData.bankBranchName.trim() || undefined,
        iban: formData.bankIban.trim() || undefined,
        swiftCode: formData.bankSwiftCode.trim() || undefined
      };
    }

    // KYC
    investorData.kycStatus = formData.kycStatus;
    if (formData.kycVerifiedDate) investorData.kycVerifiedDate = formData.kycVerifiedDate;
    if (formData.kycExpiryDate) investorData.kycExpiryDate = formData.kycExpiryDate;
    if (formData.kycNotes) investorData.kycNotes = formData.kycNotes;

    // Preferences
    investorData.preferences = {
      minInvestmentAmount: formData.prefMinAmount ? parseFloat(formData.prefMinAmount) : undefined,
      maxInvestmentAmount: formData.prefMaxAmount ? parseFloat(formData.prefMaxAmount) : undefined,
      preferredPropertyTypes: formData.prefPropertyTypes.length > 0 ? formData.prefPropertyTypes as any : undefined,
      preferredLocations: formData.prefLocations.length > 0 ? formData.prefLocations : undefined,
      riskTolerance: formData.prefRiskTolerance,
      investmentStrategy: formData.prefInvestmentStrategy
    };

    // Management
    investorData.relationshipManager = (formData.relationshipManager && formData.relationshipManager !== 'none') ? formData.relationshipManager : undefined;
    investorData.tags = formData.tags.length > 0 ? formData.tags : undefined;
    investorData.notes = formData.notes.trim() || undefined;

    onSave(investorData);
  };

  const togglePropertyType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      prefPropertyTypes: prev.prefPropertyTypes.includes(type)
        ? prev.prefPropertyTypes.filter(t => t !== type)
        : [...prev.prefPropertyTypes, type]
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const predefinedTags = ['VIP', 'High-Net-Worth', 'Institutional', 'Long-Term', 'Quick-Returns', 'First-Time'];
  const karachiAreas = ['DHA', 'Clifton', 'Gulshan', 'Malir', 'North Nazimabad', 'Bahria Town', 'Scheme 33'];

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            {investor ? 'Edit Investor' : 'Add New Investor'}
          </DialogTitle>
          <DialogDescription>
            {investor
              ? 'Update investor information and preferences'
              : 'Add a new investor with complete profile information'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="basic" className="flex items-center gap-1 text-xs">
              <UserIcon className="w-3 h-3" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-1 text-xs">
              <Landmark className="w-3 h-3" />
              Bank & KYC
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-1 text-xs">
              <Settings className="w-3 h-3" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-1 text-xs">
              <FileCheck className="w-3 h-3" />
              Management
            </TabsTrigger>
          </TabsList>

          {/* BASIC INFO TAB */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">
                  Investor Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ahmed Khan / ABC Investments"
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="investorType">Investor Type</Label>
                <Select value={formData.investorType} onValueChange={(value: any) => setFormData({ ...formData, investorType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="institutional">Institutional</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="trust">Trust</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="prospective">Prospective</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="investor@example.com"
                    className={`pl-10 ${validationErrors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="03XX-XXXXXXX"
                    className={`pl-10 ${validationErrors.phone ? 'border-red-500' : ''}`}
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Karachi"
                />
              </div>

              <div>
                <Label htmlFor="nationalId">CNIC</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="XXXXX-XXXXXXX-X"
                    className={`pl-10 ${validationErrors.nationalId ? 'border-red-500' : ''}`}
                  />
                </div>
                {validationErrors.nationalId && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.nationalId}</p>
                )}
              </div>

              <div>
                <Label htmlFor="taxId">NTN / Tax ID</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="Tax identification number"
                />
              </div>

              <div>
                <Label htmlFor="sourceOfFunds">Source of Funds</Label>
                <Input
                  id="sourceOfFunds"
                  value={formData.sourceOfFunds}
                  onChange={(e) => setFormData({ ...formData, sourceOfFunds: e.target.value })}
                  placeholder="e.g., Business Income, Salary, Inheritance"
                />
              </div>
            </div>

            {/* Secondary Contact */}
            <div className="border-t pt-4 mt-4">
              <h4 className="flex items-center gap-2 mb-3 text-gray-900">
                <Users className="w-4 h-4" />
                Secondary Contact (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="secName">Name</Label>
                  <Input
                    id="secName"
                    value={formData.secondaryContactName}
                    onChange={(e) => setFormData({ ...formData, secondaryContactName: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <Label htmlFor="secPhone">Phone</Label>
                  <Input
                    id="secPhone"
                    value={formData.secondaryContactPhone}
                    onChange={(e) => setFormData({ ...formData, secondaryContactPhone: e.target.value })}
                    placeholder="03XX-XXXXXXX"
                    className={validationErrors.secondaryContactPhone ? 'border-red-500' : ''}
                  />
                  {validationErrors.secondaryContactPhone && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.secondaryContactPhone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="secEmail">Email</Label>
                  <Input
                    id="secEmail"
                    type="email"
                    value={formData.secondaryContactEmail}
                    onChange={(e) => setFormData({ ...formData, secondaryContactEmail: e.target.value })}
                    placeholder="contact@example.com"
                    className={validationErrors.secondaryContactEmail ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="secRelationship">Relationship</Label>
                  <Input
                    id="secRelationship"
                    value={formData.secondaryContactRelationship}
                    onChange={(e) => setFormData({ ...formData, secondaryContactRelationship: e.target.value })}
                    placeholder="e.g., Business Partner, Assistant"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* BANK & KYC TAB */}
          <TabsContent value="bank" className="space-y-4">
            <div>
              <h4 className="flex items-center gap-2 mb-3 text-gray-900">
                <Landmark className="w-4 h-4" />
                Bank Account Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="bankAccountTitle">Account Title</Label>
                  <Input
                    id="bankAccountTitle"
                    value={formData.bankAccountTitle}
                    onChange={(e) => setFormData({ ...formData, bankAccountTitle: e.target.value })}
                    placeholder="Account holder name"
                  />
                </div>
                <div>
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="XXXXXXXXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., HBL, UBL, MCB"
                  />
                </div>
                <div>
                  <Label htmlFor="bankBranchName">Branch Name</Label>
                  <Input
                    id="bankBranchName"
                    value={formData.bankBranchName}
                    onChange={(e) => setFormData({ ...formData, bankBranchName: e.target.value })}
                    placeholder="Branch location"
                  />
                </div>
                <div>
                  <Label htmlFor="bankIban">IBAN</Label>
                  <Input
                    id="bankIban"
                    value={formData.bankIban}
                    onChange={(e) => setFormData({ ...formData, bankIban: e.target.value })}
                    placeholder="PKXX..."
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="bankSwiftCode">SWIFT Code (for international)</Label>
                  <Input
                    id="bankSwiftCode"
                    value={formData.bankSwiftCode}
                    onChange={(e) => setFormData({ ...formData, bankSwiftCode: e.target.value })}
                    placeholder="SWIFT/BIC code"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="flex items-center gap-2 mb-3 text-gray-900">
                <FileCheck className="w-4 h-4" />
                KYC / Compliance
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kycStatus">KYC Status</Label>
                  <Select value={formData.kycStatus} onValueChange={(value: any) => setFormData({ ...formData, kycStatus: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending</Badge>
                      </SelectItem>
                      <SelectItem value="verified">
                        <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>
                      </SelectItem>
                      <SelectItem value="expired">
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">Expired</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Badge variant="outline" className={getKYCStatusColor(formData.kycStatus)}>
                    {formData.kycStatus === 'verified' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                    {formData.kycStatus.charAt(0).toUpperCase() + formData.kycStatus.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label htmlFor="kycVerifiedDate">Verified Date</Label>
                  <Input
                    id="kycVerifiedDate"
                    type="date"
                    value={formData.kycVerifiedDate}
                    onChange={(e) => setFormData({ ...formData, kycVerifiedDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="kycExpiryDate">Expiry Date</Label>
                  <Input
                    id="kycExpiryDate"
                    type="date"
                    value={formData.kycExpiryDate}
                    onChange={(e) => setFormData({ ...formData, kycExpiryDate: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="kycNotes">KYC Notes</Label>
                  <Textarea
                    id="kycNotes"
                    value={formData.kycNotes}
                    onChange={(e) => setFormData({ ...formData, kycNotes: e.target.value })}
                    placeholder="Documents verified, compliance notes, etc."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences" className="space-y-4">
            <div>
              <h4 className="mb-3 text-gray-900">Investment Amount Range</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prefMinAmount">Minimum Amount (PKR)</Label>
                  <Input
                    id="prefMinAmount"
                    type="number"
                    value={formData.prefMinAmount}
                    onChange={(e) => setFormData({ ...formData, prefMinAmount: e.target.value })}
                    placeholder="e.g., 5000000"
                    className={validationErrors.prefMinAmount ? 'border-red-500' : ''}
                  />
                  {validationErrors.prefMinAmount && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.prefMinAmount}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="prefMaxAmount">Maximum Amount (PKR)</Label>
                  <Input
                    id="prefMaxAmount"
                    type="number"
                    value={formData.prefMaxAmount}
                    onChange={(e) => setFormData({ ...formData, prefMaxAmount: e.target.value })}
                    placeholder="e.g., 50000000"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-gray-900">Preferred Property Types</h4>
              <div className="flex flex-wrap gap-2">
                {['house', 'apartment', 'commercial', 'land'].map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${formData.prefPropertyTypes.includes(type)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    onClick={() => togglePropertyType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-gray-900">Preferred Locations (Karachi)</h4>
              <div className="flex flex-wrap gap-2">
                {karachiAreas.map((area) => (
                  <Badge
                    key={area}
                    variant="outline"
                    className={`cursor-pointer transition-colors text-xs ${formData.prefLocations.includes(area)
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        prefLocations: prev.prefLocations.includes(area)
                          ? prev.prefLocations.filter(l => l !== area)
                          : [...prev.prefLocations, area]
                      }));
                    }}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prefRiskTolerance">Risk Tolerance</Label>
                <Select value={formData.prefRiskTolerance} onValueChange={(value: any) => setFormData({ ...formData, prefRiskTolerance: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Conservative</SelectItem>
                    <SelectItem value="medium">Medium - Balanced</SelectItem>
                    <SelectItem value="high">High - Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prefInvestmentStrategy">Investment Strategy</Label>
                <Select value={formData.prefInvestmentStrategy} onValueChange={(value: any) => setFormData({ ...formData, prefInvestmentStrategy: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy-and-hold">Buy and Hold</SelectItem>
                    <SelectItem value="flip">Flip / Quick Resale</SelectItem>
                    <SelectItem value="rental-income">Rental Income</SelectItem>
                    <SelectItem value="development">Development Projects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* MANAGEMENT TAB */}
          <TabsContent value="management" className="space-y-4">
            <div>
              <Label htmlFor="relationshipManager">Relationship Manager</Label>
              <Select value={formData.relationshipManager} onValueChange={(value) => setFormData({ ...formData, relationshipManager: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                  <SelectItem value={user.id}>{user.name} (You)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Assign an agent to manage this investor relationship</p>
            </div>

            <div>
              <h4 className="mb-2 text-gray-900">Tags</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {predefinedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`cursor-pointer transition-colors text-xs ${formData.tags.includes(tag)
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500">Click to add/remove tags for investor segmentation</p>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes about this investor..."
                rows={6}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            {investor ? 'Update Investor' : 'Add Investor'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
