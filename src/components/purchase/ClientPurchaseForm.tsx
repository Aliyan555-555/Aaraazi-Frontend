import React from 'react';
import { Property, User } from '../../types';
import { FormContainer } from '../ui/form-container';
import { formatPropertyAddress } from '../../lib/utils';
import { ClientPurchaseFormContent } from './ClientPurchaseForm.old';
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';

interface ClientPurchaseFormProps {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

export function ClientPurchaseForm({ property, user, onSuccess, onCancel, onSubmitFromProperty }: ClientPurchaseFormProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <FormContainer
        title="Client Purchase"
        description={formatPropertyAddress(property.address)}
        onBack={onCancel}
        asDiv={true}
      >
        <div className="p-6">
          <ClientPurchaseFormContent
            property={property}
            user={user}
            onSuccess={onSuccess}
            onCancel={onCancel}
            onSubmitFromProperty={onSubmitFromProperty}
          />
        </div>
      </FormContainer>
    </div>
  );
}
