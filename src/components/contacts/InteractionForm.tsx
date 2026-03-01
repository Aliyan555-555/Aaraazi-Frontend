/**
 * InteractionForm — Same as prototype layout
 * Fields: Interaction Type*, Date*, Subject*, Notes*, Outcome, Related Property
 * React Hook Form + Zod + real API via useInteractions
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Phone, Mail, MessageSquare, Video, Eye, FileText } from 'lucide-react';
import {
  InteractionFormSchema,
  InteractionFormValues,
  interactionFormDefaultValues,
  INTERACTION_TYPE_LABELS,
} from './interaction-form.schema';
import {
  useCreateInteraction,
  useUpdateInteraction,
} from '@/hooks/useInteractions';
import type { Interaction } from '@/services/interactions.service';
import { formatPropertyAddress } from '@/lib/utils';
import type { User } from '@/types';
import type { CRMInteraction } from '@/types/crm';

// Map API/prototype type to form type (uppercase)
const TO_FORM_TYPE: Record<string, InteractionFormValues['type']> = {
  call: 'CALL',
  email: 'EMAIL',
  meeting: 'MEETING',
  note: 'NOTE',
  sms: 'SMS',
  whatsapp: 'WHATSAPP',
  viewing: 'CALL', // map to CALL
  video_call: 'VIDEO_CALL',
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  NOTE: 'NOTE',
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
  VIDEO_CALL: 'VIDEO_CALL',
};

// ============================================================================
// Props
// ============================================================================

interface InteractionFormProps {
  contactId: string;
  user: User;
  /** For API mode: tenant/agency context. When omitted, uses prototype data layer. */
  tenantId?: string;
  agencyId?: string;
  /** Pass existing interaction for edit mode (API Interaction or CRMInteraction) */
  interaction?: Interaction | CRMInteraction;
  onSuccess: () => void;
  onCancel: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const TYPE_ICONS: Record<InteractionFormValues['type'], React.ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Video,
  NOTE: FileText,
  SMS: MessageSquare,
  WHATSAPP: MessageSquare,
  VIDEO_CALL: Video,
};

function toFormValues(interaction: Interaction | CRMInteraction): InteractionFormValues {
  const isApi = 'summary' in interaction;
  const dateVal = interaction.date;
  const dateStr =
    typeof dateVal === 'string'
      ? dateVal.split('T')[0]
      : new Date(dateVal).toISOString().split('T')[0];
  const rawType = (interaction as { type: string }).type;
  const type = (TO_FORM_TYPE[rawType] ?? 'CALL') as InteractionFormValues['type'];
  return {
    type,
    subject: isApi ? (interaction as Interaction).summary : ((interaction as CRMInteraction).subject ?? ''),
    notes: (interaction as { notes?: string }).notes ?? '',
    date: dateStr,
    outcome: (interaction as CRMInteraction).outcome ?? '',
    propertyId: (interaction as CRMInteraction).propertyId ?? '',
  };
}

/** Build notes string for API: notes + optional outcome appended */
function buildNotesForApi(notes: string, outcome?: string): string | undefined {
  const trimmed = notes?.trim();
  const outcomeTrimmed = outcome?.trim();
  if (!trimmed && !outcomeTrimmed) return undefined;
  if (!outcomeTrimmed) return trimmed || undefined;
  if (!trimmed) return `Outcome: ${outcomeTrimmed}`;
  return `${trimmed}\n\nOutcome: ${outcomeTrimmed}`;
}

// ============================================================================
// Component
// ============================================================================

export const InteractionForm: React.FC<InteractionFormProps> = ({
  contactId,
  user,
  tenantId,
  agencyId,
  interaction,
  onSuccess,
  onCancel,
}) => {
  const isEditMode = !!interaction;
  const hasApiContext = !!tenantId && !!agencyId;
  // Placeholder until properties API exists (per plan)
  const properties: Array<{ id: string; title?: string; address?: unknown }> = [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InteractionFormValues>({
    resolver: zodResolver(InteractionFormSchema),
    defaultValues: interaction
      ? toFormValues(interaction)
      : interactionFormDefaultValues,
  });

  const createInteraction = useCreateInteraction();
  const updateInteraction = useUpdateInteraction();

  const onSubmit = async (values: InteractionFormValues) => {
    if (!hasApiContext) {
      console.error('InteractionForm: tenantId and agencyId are required. Log in to save interactions to the database.');
      return;
    }

    const notesForApi = buildNotesForApi(values.notes, values.outcome);

    if (isEditMode && interaction) {
      await updateInteraction.mutateAsync({
        id: interaction.id,
        data: {
          type: values.type,
          direction: 'OUTBOUND',
          summary: values.subject,
          notes: notesForApi,
          date: new Date(values.date).toISOString(),
        },
      });
    } else {
      await createInteraction.mutateAsync({
        type: values.type,
        direction: 'OUTBOUND',
        summary: values.subject,
        notes: notesForApi,
        date: new Date(values.date).toISOString(),
        contactId,
        tenantId: tenantId!,
        agencyId: agencyId!,
      });
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Interaction Type* + Date* */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">
            Interaction Type <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type" aria-invalid={!!errors.type}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(INTERACTION_TYPE_LABELS) as InteractionFormValues['type'][]
                  ).map((key) => {
                    const Icon = TYPE_ICONS[key];
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {INTERACTION_TYPE_LABELS[key]}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">
            Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
            aria-invalid={!!errors.date}
          />
          {errors.date && (
            <p className="text-sm text-red-500">{errors.date.message}</p>
          )}
        </div>
      </div>

      {/* Subject* */}
      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="Brief description of the interaction"
          {...register('subject')}
          aria-invalid={!!errors.subject}
        />
        {errors.subject && (
          <p className="text-sm text-red-500">{errors.subject.message}</p>
        )}
      </div>

      {/* Notes* */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          Notes <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Detailed notes about this interaction..."
          rows={4}
          {...register('notes')}
          aria-invalid={!!errors.notes}
        />
        {errors.notes && (
          <p className="text-sm text-red-500">{errors.notes.message}</p>
        )}
      </div>

      {/* Outcome */}
      <div className="space-y-2">
        <Label htmlFor="outcome">Outcome</Label>
        <Input
          id="outcome"
          placeholder="Result or next steps (optional)"
          {...register('outcome')}
        />
      </div>

      {/* Related Property */}
      <div className="space-y-2">
        <Label htmlFor="propertyId">Related Property</Label>
        <Controller
          name="propertyId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || 'none'}
              onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
            >
              <SelectTrigger id="propertyId">
                <SelectValue placeholder="Select property (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title || formatPropertyAddress(property.address) || 'Untitled Property'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting || !hasApiContext}>
          {!hasApiContext
            ? 'Log in to save'
            : isSubmitting
              ? 'Saving…'
              : isEditMode
                ? 'Update Interaction'
                : 'Log Interaction'}
        </Button>
      </div>
    </form>
  );
};

export default InteractionForm;
