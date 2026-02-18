/**
 * Investor Purchase Form V2 - Full Page Wrapper
 * Uses existing InvestorPurchaseForm with full-page layout
 */

import React from 'react';
import { Property, User } from '../../types';
import { FormContainer } from '../ui/form-container';
import { formatPropertyAddress } from '../../lib/utils';
import { InvestorPurchaseForm } from './InvestorPurchaseForm';
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';

interface InvestorPurchaseFormV2Props {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

<<<<<<< Updated upstream:src/components/purchase/InvestorPurchaseFormV2.tsx
<<<<<<< Updated upstream:src/components/purchase/InvestorPurchaseFormV2.tsx
export function InvestorPurchaseFormV2({ property, user, onSuccess, onCancel }: InvestorPurchaseFormV2Props) {
=======
export function InvestorPurchaseFormLayout({ property, user, onSuccess, onCancel, onSubmitFromProperty }: InvestorPurchaseFormLayoutProps) {
>>>>>>> Stashed changes:src/components/purchase/InvestorPurchaseFormLayout.tsx
=======


export function InvestorPurchaseFormLayout({ property, user, onSuccess, onCancel, onSubmitFromProperty }: InvestorPurchaseFormLayoutProps) {

>>>>>>> Stashed changes:src/components/purchase/InvestorPurchaseFormLayout.tsx
  return (
    <div className="min-h-screen bg-gray-50">
      <FormContainer
        title="Investor Purchase"
        description={formatPropertyAddress(property)}
        onBack={onCancel}
        asDiv={true}
      >
        <div className="p-6">
          <InvestorPurchaseForm 
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