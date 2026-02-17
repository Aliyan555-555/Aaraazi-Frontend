/**
 * Client Purchase Form V2 - Full Page Wrapper
 * Uses existing ClientPurchaseForm with full-page layout
 */

import React from 'react';
import { Property, User } from '../../types';
import { FormContainer } from '../ui/form-container';
import { formatPropertyAddress } from '../../lib/utils';
import { ClientPurchaseForm } from './ClientPurchaseForm';
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';

interface ClientPurchaseFormV2Props {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

<<<<<<< Updated upstream:src/components/purchase/ClientPurchaseFormV2.tsx
export function ClientPurchaseFormV2({ property, user, onSuccess, onCancel }: ClientPurchaseFormV2Props) {
=======
export function ClientPurchaseFormLayout({ property, user, onSuccess, onCancel, onSubmitFromProperty }: ClientPurchaseFormLayoutProps) {
>>>>>>> Stashed changes:src/components/purchase/ClientPurchaseFormLayout.tsx
  return (
    <div className="min-h-screen bg-gray-50">
      <FormContainer
        title="Client Purchase"
        description={formatPropertyAddress(property)}
        onBack={onCancel}
        asDiv={true}
      >
        <div className="p-6">
          <ClientPurchaseForm 
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