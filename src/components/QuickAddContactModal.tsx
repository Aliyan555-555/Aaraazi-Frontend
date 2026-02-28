/**
 * QuickAddContactModal — Professional Grade
 *
 * Upgraded from the prototype localStorage version to:
 *  ✅ React Hook Form + Zod strict validation
 *  ✅ Real API via useCreateContact (POST /contacts)
 *  ✅ Pakistani phone validation
 */

'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
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
import { Phone, Mail, User as UserIcon } from 'lucide-react';
import {
  ContactFormSchema,
  contactFormDefaultValues,
  type ContactFormValues,
} from '@/validations/contacts';
import { useCreateContact } from '@/hooks/useContacts';
import { mapFormValuesToCreateDto } from './contacts/mappers/contact.mappers';

// ============================================================================
// Props
// ============================================================================

export interface QuickAddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (contactId: string) => void;
  tenantId: string;
  agencyId: string;
  agentId?: string;
  defaultType?: ContactFormValues['type'];
}

const CONTACT_TYPE_OPTIONS: { value: ContactFormValues['type']; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'investor', label: 'Investor' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'external-broker', label: 'External Broker' },
];

// ============================================================================
// Component
// ============================================================================

export function QuickAddContactModal({
  isOpen,
  onClose,
  onSuccess,
  tenantId,
  agencyId,
  agentId,
  defaultType = 'buyer',
}: QuickAddContactModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: { ...contactFormDefaultValues, type: defaultType },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const createContact = useCreateContact();

  function handleClose() {
    reset({ ...contactFormDefaultValues, type: defaultType });
    onClose();
  }

  const onSubmit = async (data: ContactFormValues) => {
    const dto = mapFormValuesToCreateDto(data, tenantId, agencyId, agentId);
    const result = await createContact.mutateAsync(dto);
    onSuccess?.(result.id);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Quick Add Contact
          </DialogTitle>
          <DialogDescription>
            Capture a new contact quickly. Full details can be added later.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 mt-2"
          noValidate
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="qa-name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="qa-name"
              placeholder="e.g. Ahmed Khan"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="qa-phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="qa-phone"
                  className="pl-9"
                  placeholder="03XXXXXXXXX"
                  {...register('phone')}
                  aria-invalid={!!errors.phone}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qa-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="qa-email"
                  type="email"
                  className="pl-9"
                  placeholder="optional"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Contact Type */}
          <div className="space-y-1.5">
            <Label htmlFor="qa-type">
              Contact Type <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="qa-type" aria-invalid={!!errors.type}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="qa-address">Address</Label>
            <Input
              id="qa-address"
              placeholder="e.g. DHA Phase 5, Karachi"
              {...register('address')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="qa-notes">Notes</Label>
            <Textarea
              id="qa-notes"
              placeholder="Any important notes…"
              rows={2}
              {...register('notes')}
              aria-invalid={!!errors.notes}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Adding…' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default QuickAddContactModal;
