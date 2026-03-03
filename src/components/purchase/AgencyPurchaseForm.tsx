/**
 * Agency Purchase Form - Full Page Wrapper
 * Uses existing AgencyPurchaseForm with full-page layout
 */

import React from 'react';
import { Property, User } from '../../types';
import { FormContainer } from '../ui/form-container';
import { formatPropertyAddress } from '../../lib/utils';
import { AgencyPurchaseFormContent } from './AgencyPurchaseForm.old';
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';

interface AgencyPurchaseFormProps {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

export function AgencyPurchaseForm({ property, user, onSuccess, onCancel, onSubmitFromProperty }: AgencyPurchaseFormProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <FormContainer
        title="Agency Purchase"
        description={formatPropertyAddress(property.address)}
        onBack={onCancel}
        asDiv={true}
      >
        <div className="p-6">
          <AgencyPurchaseFormContent
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
