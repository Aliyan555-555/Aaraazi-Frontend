/**
 * Contact Form Modal - Clean Implementation with Form Design Standards ✅
 * 
 * Modal form for quick contact addition with:
 * - Dialog component for modal display
 * - FormSection + FormField for consistency
 * - Complete validation
 * - Quick add workflow
 * - Context-aware contact types
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { FormSection } from './ui/form-section';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { updateContact } from '../lib/data';
import {
  required,
  email,
  pakistanPhone,
  maxLength,
  validateForm,
  hasErrors,
  type FormErrors,
} from '../lib/formValidation';
import { addContact } from '../lib/data';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { ContactType, ContactCategory } from '@/types/schema';
import type { Contact } from '@/types/contacts';

// ==================== TYPE DEFINITIONS ====================

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  type: 'buyer' | 'seller' | 'tenant' | 'landlord' | 'investor' | 'vendor' | 'external-broker' | '';
  company: string;
  address: string;
  notes: string;
}

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (contact: Contact) => void;
  agentId: string;
  defaultType?: 'buyer' | 'seller' | 'tenant' | 'landlord' | 'investor' | 'vendor' | 'external-broker';
  editingContact?: Contact | null;
}

const LEAD_SOURCES = [
  'Website',
  'Facebook',
  'Instagram',
  'WhatsApp',
  'Phone Call',
  'Walk-in',
  'Referral',
  'Property Portal',
  'Other',
];

// ==================== MAIN COMPONENT ====================

export function ContactFormModal({
  isOpen,
  onClose,
  onSuccess,
  agentId,
  defaultType,
  editingContact,
}: ContactFormModalProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: editingContact?.name || '',
    phone: editingContact?.phone || '',
    email: editingContact?.email || '',
    type: (editingContact?.type ?? defaultType ?? '') as ContactFormData['type'],
    company: editingContact?.company || '',
    address: editingContact?.address || '',
    notes: editingContact?.notes || '',
  });

  const [errors, setErrors] = useState<FormErrors<ContactFormData>>({});
  const [touched, setTouched] = useState<Set<keyof ContactFormData>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form when modal opens or editingContact changes
  useEffect(() => {
    if (isOpen) {
      const categoryAsType = editingContact?.category as ContactFormData['type'];
      setFormData({
        name: editingContact?.name || '',
        phone: editingContact?.phone || '',
        email: editingContact?.email || '',
        type: categoryAsType || defaultType || '',
        company: editingContact?.company || '',
        address: editingContact?.address || '',
        notes: editingContact?.notes || '',
      });
      setErrors({});
      setTouched(new Set());
    }
  }, [isOpen, editingContact?.id, defaultType]);

  // Handle field change
  const handleChange = (field: keyof ContactFormData, value: string) => {
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
  const handleBlur = (field: keyof ContactFormData) => {
    setTouched((prev) => new Set([...prev, field]));

    // Validate this field
    const validator = validationRules[field];
    if (validator) {
      const error = validator(formData[field]);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    }
  };

  // Validation rules
  const validationRules = {
    name: (value: string) => required(value, 'Name'),
    phone: (value: string) => required(value, 'Phone') || pakistanPhone(value),
    email: (value: string) => (value ? email(value) : undefined),
    type: (value: string) => required(value, 'Contact type'),
    company: (value: string) => undefined,
    address: (value: string) => undefined,
    notes: (value: string) => (value ? maxLength(value, 500, 'Notes') : undefined),
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateForm(formData, validationRules);

    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      toast.error('Please fix the errors in the form');
      setTouched(new Set(Object.keys(formData) as Array<keyof ContactFormData>));
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingContact) {
        // Update existing contact: form "type" is category (buyer/seller/...); map to schema enums
        const { type: formType, ...restFormData } = formData;
        const categoryMap: Record<string, ContactCategory> = {
          buyer: ContactCategory.BUYER,
          seller: ContactCategory.SELLER,
          tenant: ContactCategory.TENANT,
          landlord: ContactCategory.LANDLORD,
          investor: ContactCategory.BOTH,
          vendor: ContactCategory.BOTH,
          'external-broker': ContactCategory.EXTERNAL_BROKER,
        };
        const typeMap: Record<string, ContactType> = {
          investor: ContactType.INVESTOR,
          vendor: ContactType.VENDOR,
          buyer: ContactType.CLIENT,
          seller: ContactType.CLIENT,
          tenant: ContactType.CLIENT,
          landlord: ContactType.CLIENT,
          'external-broker': ContactType.CLIENT,
        };
        const payload: Record<string, unknown> = {
          ...restFormData,
          updatedAt: new Date().toISOString(),
        };
        if (String(formType ?? '').trim() !== '') {
          payload.category = categoryMap[formType as keyof typeof categoryMap] ?? ContactCategory.BOTH;
          payload.type = typeMap[formType as keyof typeof typeMap] ?? ContactType.CLIENT;
        }
        updateContact(editingContact.id, payload as Parameters<typeof updateContact>[1]);
        toast.success('Contact updated successfully!');

        if (onSuccess) {
          onSuccess({ ...editingContact, ...payload });
        }
      } else {
        // Add new contact: map form type to category + type enums
        const { type: formType, ...restFormData } = formData;
        const categoryMap: Record<string, ContactCategory> = {
          buyer: ContactCategory.BUYER,
          seller: ContactCategory.SELLER,
          tenant: ContactCategory.TENANT,
          landlord: ContactCategory.LANDLORD,
          investor: ContactCategory.BOTH,
          vendor: ContactCategory.BOTH,
          'external-broker': ContactCategory.EXTERNAL_BROKER,
        };
        const typeMap: Record<string, ContactType> = {
          investor: ContactType.INVESTOR,
          vendor: ContactType.VENDOR,
          buyer: ContactType.CLIENT,
          seller: ContactType.CLIENT,
          tenant: ContactType.CLIENT,
          landlord: ContactType.CLIENT,
          'external-broker': ContactType.CLIENT,
        };
        const now = new Date().toISOString();
        const payload: Record<string, unknown> = {
          ...restFormData,
          id: `contact_${Date.now()}`,
          agentId,
          createdBy: agentId,
          source: 'Direct Entry',
          createdAt: now,
          updatedAt: now,
          status: 'active',
        };
        if (String(formType ?? '').trim() !== '') {
          payload.category = categoryMap[formType as keyof typeof categoryMap] ?? ContactCategory.BOTH;
          payload.type = typeMap[formType as keyof typeof typeMap] ?? ContactType.CLIENT;
        }
        const newContact = addContact(payload as unknown as Parameters<typeof addContact>[0]);
        toast.success('Contact added successfully!');

        if (onSuccess) {
          onSuccess(newContact);
        }
      }

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        type: defaultType || '',
        company: '',
        address: '',
        notes: '',
      });
      setErrors({});
      setTouched(new Set());

      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error(`Failed to ${editingContact ? 'update' : 'add'} contact. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        type: defaultType || '',
        company: '',
        address: '',
        notes: '',
      });
      setErrors({});
      setTouched(new Set());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
          <DialogDescription>
            {editingContact ? 'Update contact information' : 'Create a new contact in your CRM'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <FormSection title="Contact Information">
            <FormField
              label="Full Name"
              required
              error={touched.has('name') ? errors.name : undefined}
            >
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="John Doe"
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Phone Number"
                required
                error={touched.has('phone') ? errors.phone : undefined}
              >
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  placeholder="03001234567"
                />
              </FormField>

              <FormField
                label="Email"
                error={touched.has('email') ? errors.email : undefined}
                hint="Optional"
              >
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="john@example.com"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Contact Type"
                required
                error={touched.has('type') ? errors.type : undefined}
              >
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                >
                  <SelectTrigger onBlur={() => handleBlur('type')}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="landlord">Landlord</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="external-broker">External Broker</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Company" hint="Optional">
                <Input
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Company Name Ltd."
                />
              </FormField>
            </div>

            <FormField label="Address" hint="Optional">
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Complete address"
              />
            </FormField>

            <FormField
              label="Notes"
              error={touched.has('notes') ? errors.notes : undefined}
              hint={`${formData.notes.length}/500 characters`}
            >
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                onBlur={() => handleBlur('notes')}
                placeholder="Additional notes about this contact..."
                rows={3}
                maxLength={500}
              />
            </FormField>
          </FormSection>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingContact ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}