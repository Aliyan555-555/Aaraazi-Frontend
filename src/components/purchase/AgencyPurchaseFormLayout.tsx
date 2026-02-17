import React from 'react';
import { Property, User } from '../../types';
import { FormContainer } from '../ui/form-container';
import { formatPropertyAddress } from '../../lib/utils';
import { AgencyPurchaseForm } from './AgencyPurchaseForm';
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';

interface AgencyPurchaseFormLayoutProps {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

// <<<<<<< HEAD:src/components/purchase/AgencyPurchaseFormLayout.tsx
// export function AgencyPurchaseFormLayout({ property, user, onSuccess, onCancel }: AgencyPurchaseFormLayoutProps) {
// =======
// <<<<<<< Updated upstream:src/components/purchase/AgencyPurchaseFormV2.tsx
// export function AgencyPurchaseFormV2({ property, user, onSuccess, onCancel }: AgencyPurchaseFormV2Props) {
// =======
export function AgencyPurchaseFormLayout({ property, user, onSuccess, onCancel, onSubmitFromProperty }: AgencyPurchaseFormLayoutProps) {
// >>>>>>> Stashed changes:src/components/purchase/AgencyPurchaseFormLayout.tsx
// >>>>>>> aaraazi/properties:src/components/purchase/AgencyPurchaseFormV2.tsx
  return (
    <div className="min-h-screen bg-gray-50">
      <FormContainer
        title="Agency Purchase"
        description={formatPropertyAddress(property)}
        onBack={onCancel}
        asDiv={true}
      >
        <div className="p-6">
          <AgencyPurchaseForm 
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