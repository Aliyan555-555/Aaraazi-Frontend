import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { FormSection } from './ui/form-section';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { Contact, ContactType, ContactCategory, ContactStatus } from '@/types/schema';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { useAuthStore } from '@/store/useAuthStore';
import type { CreateContactDto, UpdateContactDto } from '@/services/contacts.service';

import { ContactFormValues, contactFormSchema } from '@/validations';

// ==================== PROPS ====================

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (contact: Contact) => void;
  agentId: string;
  defaultType?: 'buyer' | 'seller' | 'tenant' | 'landlord' | 'investor' | 'vendor' | 'external-broker';
  editingContact?: Contact | null;
}

// ==================== MAIN COMPONENT ====================

export function ContactFormModal({
  isOpen,
  onClose,
  onSuccess,
  agentId,
  defaultType,
  editingContact,
}: ContactFormModalProps) {
  // Store & Hooks
  const { tenantId, agencyId } = useAuthStore();
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();

  // Helper to map backend enum to UI type string
  const getInitialType = (): ContactFormValues['type'] => {
    if (editingContact) {
      const { category, type } = editingContact;
      if (category === ContactCategory.BUYER) return 'buyer';
      if (category === ContactCategory.SELLER) return 'seller';
      if (category === ContactCategory.TENANT) return 'tenant';
      if (category === ContactCategory.LANDLORD) return 'landlord';
      if (category === ContactCategory.EXTERNAL_BROKER) return 'external-broker';
      if (type === ContactType.INVESTOR) return 'investor';
      if (type === ContactType.VENDOR) return 'vendor';
    }
    return defaultType || 'buyer'; // Start with a valid default to avoid validation error initially if user doesn't touch it
  };

  // Helper to safely parse preferences
  const getInitialPreferences = () => {
    if (!editingContact) return { notes: '', company: '' };
    try {
      const prefs = typeof editingContact.preferences === 'string'
        ? JSON.parse(editingContact.preferences)
        : (editingContact.preferences as any) || {};
      return {
        notes: prefs.notes || '',
        company: prefs.company || '',
      };
    } catch {
      return { notes: '', company: '' };
    }
  };

  // Form definition
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      type: defaultType || 'buyer',
      company: '',
      address: '',
      notes: '',
    },
  });

  // Reset/Populate form when modal opens or editingContact changes
  useEffect(() => {
    if (isOpen) {
      const prefs = getInitialPreferences();
      form.reset({
        name: editingContact?.name || '',
        phone: editingContact?.phone || '',
        email: editingContact?.email || '',
        type: getInitialType(),
        company: prefs.company,
        address: editingContact?.address || '',
        notes: prefs.notes,
      });
    } else {
      form.reset(); // Clear on close
    }
  }, [isOpen, editingContact, defaultType, form]);

  // Map UI type to Backend Enum
  const mapTypeToEnums = (uiType: string): { type: ContactType; category: ContactCategory } => {
    switch (uiType) {
      case 'buyer': return { type: ContactType.CLIENT, category: ContactCategory.BUYER };
      case 'seller': return { type: ContactType.CLIENT, category: ContactCategory.SELLER };
      case 'tenant': return { type: ContactType.CLIENT, category: ContactCategory.TENANT };
      case 'landlord': return { type: ContactType.CLIENT, category: ContactCategory.LANDLORD };
      case 'investor': return { type: ContactType.INVESTOR, category: ContactCategory.BOTH };
      case 'vendor': return { type: ContactType.VENDOR, category: ContactCategory.BOTH };
      case 'external-broker': return { type: ContactType.CLIENT, category: ContactCategory.EXTERNAL_BROKER };
      default: return { type: ContactType.CLIENT, category: ContactCategory.BOTH };
    }
  };

  const onSubmit = async (data: ContactFormValues) => {
    if (!tenantId || !agencyId) {
      toast.error('Session error: Missing tenant/agency context');
      return;
    }

    try {
      const { type: formType, company, notes, ...restFormData } = data;
      const { type, category } = mapTypeToEnums(formType);

      // Store extended fields in preferences JSON
      const preferences = JSON.stringify({ notes, company });

      // Clean email: if empty string, send undefined to avoid backend validation error
      const cleanedEmail = restFormData.email === '' ? undefined : restFormData.email;

      if (editingContact) {
        // Update Payload
        const payload: UpdateContactDto = {
          name: restFormData.name,
          phone: restFormData.phone,
          email: cleanedEmail, // Using cleaned email
          address: restFormData.address,
          type,
          category,
          preferences,
        };

        const updated = await updateContactMutation.mutateAsync({
          id: editingContact.id,
          data: payload
        });

        if (onSuccess) onSuccess(updated as any);
        toast.success("Contact updated successfully");
        onClose();
      } else {
        // Create Payload
        const payload: CreateContactDto = {
          name: restFormData.name,
          phone: restFormData.phone,
          email: cleanedEmail, // Using cleaned email
          address: restFormData.address,
          type,
          category,
          tenantId,
          agencyId,
          agentId: agentId || undefined,
          status: ContactStatus.ACTIVE,
          preferences,
          isShared: false
        };

        const created = await createContactMutation.mutateAsync(payload);

        if (onSuccess) onSuccess(created as any);
        toast.success("Contact added successfully");
        onClose();
      }

    } catch (error: any) {
      console.error('Error saving contact:', error);

      // Advanced Error Validation & Handling
      // The apiClient interceptor returns the error data directly, stripping axios response wrapper
      // Structure: { message, statusCode, error, ... }
      if (error && (error.message || error.statusCode)) {
        const { message, statusCode, error: errorType } = error;
        let handled = false;

        // 1. Handle Array of validation messages (e.g. from Class-validator 400 Bad Request)
        if (Array.isArray(message)) {
          message.forEach((msg: string) => {
            const lowerMsg = msg.toLowerCase();
            if (lowerMsg.includes('email')) {
              form.setError('email', { type: 'manual', message: msg });
              handled = true;
            }
            if (lowerMsg.includes('phone')) {
              form.setError('phone', { type: 'manual', message: msg });
              handled = true;
            }
            if (lowerMsg.includes('name')) {
              form.setError('name', { type: 'manual', message: msg });
              handled = true;
            }
          });

          if (!handled) {
            toast.error("Validation failed. Please check the form for errors.");
          }
          return;
        }

        // 2. Handle String messages (e.g. Custom Exceptions, 409 Conflict)
        if (typeof message === 'string') {
          const lowerMsg = message.toLowerCase();

          // Conflict checks (Duplicate Phone/Email)
          if (statusCode === 409 || lowerMsg.includes('exists') || lowerMsg.includes('duplicate')) {
            if (lowerMsg.includes('phone')) {
              form.setError('phone', { type: 'manual', message: "This phone number is already registered." });
              return;
            }
            if (lowerMsg.includes('email')) {
              form.setError('email', { type: 'manual', message: "This email address is already registered." });
              return;
            }
          }

          // Other field-specific errors
          if (lowerMsg.includes('phone')) {
            form.setError('phone', { type: 'manual', message: message });
            return;
          }
          if (lowerMsg.includes('email')) {
            form.setError('email', { type: 'manual', message: message });
            return;
          }

          // Generic error fallback
          toast.error(message || "An error occurred while saving the contact.");
          return;
        }
      }

      // Fallback for network errors or unexpected formats
      toast.error('Failed to save contact. Please try again.');
    }
  };

  const isSubmitting = form.formState.isSubmitting || createContactMutation.isPending || updateContactMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !isSubmitting && !val && onClose()}>
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <FormSection title="Contact Information">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="03001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        {/* Ensure value is string for input */}
                        <Input placeholder="john@example.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Name Ltd." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Complete address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this contact..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}