/**
 * ContactFormModal — Production-grade contact create/edit form.
 * Uses API via useCreateContact/useUpdateContact, Zod validation, no lib/data.
 */

'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import {
  ContactFormSchema,
  contactFormDefaultValues,
  type ContactFormValues,
} from '@/validations/contacts';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import {
  mapApiContactToFormValues,
  mapFormValuesToCreateDto,
  mapFormValuesToUpdateDto,
} from './contacts/mappers/contact.mappers';
import { Loader2, UserPlus } from 'lucide-react';
import type { Contact } from '@/types/schema';

// ============================================================================
// Type definitions
// ============================================================================

export interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (contact: Contact) => void;
  agentId: string;
  tenantId?: string;
  agencyId?: string;
  defaultType?: 'buyer' | 'seller' | 'tenant' | 'landlord' | 'investor' | 'vendor' | 'external-broker';
  editingContact?: Contact | null;
}

// ============================================================================
// Component
// ============================================================================

export function ContactFormModal({
  isOpen,
  onClose,
  onSuccess,
  agentId,
  tenantId,
  agencyId,
  defaultType,
  editingContact,
}: ContactFormModalProps) {
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: contactFormDefaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const hasApiContext = !!tenantId && !!agencyId;

  useEffect(() => {
    if (isOpen) {
      reset(mapApiContactToFormValues(editingContact ?? null, defaultType));
    }
  }, [isOpen, editingContact, defaultType, reset]);

  const onSubmit = async (data: ContactFormValues) => {
    if (!hasApiContext) {
      return;
    }
    try {
      if (editingContact) {
        const dto = mapFormValuesToUpdateDto(data);
        const updated = await updateContact.mutateAsync({ id: editingContact.id, data: dto });
        onSuccess?.(updated);
      } else {
        const dto = mapFormValuesToCreateDto(data, tenantId!, agencyId!, agentId);
        const created = await createContact.mutateAsync(dto);
        onSuccess?.(created);
      }
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset(contactFormDefaultValues);
      onClose();
    }
  };

  const notesValue = watch('notes') ?? '';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
          <DialogDescription>
            {editingContact
              ? 'Update contact information'
              : 'Create a new contact'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="contact-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          data-testid="contact-form"
          noValidate
        >
          <FormSection title="Contact Information">
            <FormField label="Full Name" required error={errors.name?.message}>
              <Input
                type="text"
                id="contact-name"
                placeholder="Ahmed Ali"
                data-testid="input-name"
                aria-required="true"
                {...register('name')}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Phone Number" required error={errors.phone?.message} hint="Pakistani format: 03XXXXXXXXXX">
                <Input
                  type="tel"
                  id="contact-phone"
                  placeholder="03001234567"
                  inputMode="numeric"
                  data-testid="input-phone"
                  aria-required="true"
                  {...register('phone')}
                />
              </FormField>
              <FormField label="Email" error={errors.email?.message} hint="Optional">
                <Input
                  type="email"
                  id="contact-email"
                  placeholder="ahmed@example.com"
                  data-testid="input-email"
                  {...register('email')}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Contact Type" required error={errors.type?.message}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="contact-type" data-testid="select-type" onBlur={field.onBlur} aria-required="true">
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
                  )}
                />
              </FormField>
              <FormField label="Company" hint="Optional">
                <Input
                  id="contact-company"
                  placeholder="Company Name Ltd."
                  data-testid="input-company"
                  {...register('company')}
                />
              </FormField>
            </div>

            <FormField label="Address" hint="Optional">
              <Input
                id="contact-address"
                placeholder="Street, Area, City"
                data-testid="input-address"
                {...register('address')}
              />
            </FormField>

            <FormField label="Notes" error={errors.notes?.message} hint={`${notesValue.length}/500 characters`}>
              <Textarea
                id="contact-notes"
                placeholder="Additional notes about this contact..."
                rows={3}
                maxLength={500}
                data-testid="input-notes"
                {...register('notes')}
              />
            </FormField>
          </FormSection>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} data-testid="btn-cancel">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !hasApiContext}
              data-testid="btn-submit"
            >
              {!hasApiContext ? (
                'Log in to save'
              ) : isSubmitting ? (
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
