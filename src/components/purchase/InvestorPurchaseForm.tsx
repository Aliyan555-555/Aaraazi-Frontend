/**
 * Investor Purchase Form - Full Page Wrapper
 * Uses existing InvestorPurchaseForm with full-page layout
 */

import React from 'react';
import { Property, User } from '../../types';
import { FormContainer } from '../ui/form-container';
import { formatPropertyAddress } from '../../lib/utils';
import { InvestorPurchaseFormContent } from './InvestorPurchaseForm.old';
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';

interface InvestorPurchaseFormProps {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

export function InvestorPurchaseForm({ property, user, onSuccess, onCancel, onSubmitFromProperty }: InvestorPurchaseFormProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <FormContainer
        title="Investor Purchase"
        description={formatPropertyAddress(property.address)}
        onBack={onCancel}
        asDiv={true}
      >
        <div className="p-6">
          <InvestorPurchaseFormContent
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
