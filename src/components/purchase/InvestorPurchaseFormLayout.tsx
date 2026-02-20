/**
 * Investor Purchase Form V2 - Full Page Wrapper
 * Uses existing InvestorPurchaseForm with full-page layout
 */

import React from 'react';
import { Property, User } from '../../types';
import { FormContainer } from '../ui/form-container';
import { formatPropertyAddress } from '../../lib/utils';
import { InvestorPurchaseForm } from './InvestorPurchaseForm';

interface InvestorPurchaseFormLayoutProps {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvestorPurchaseFormLayout({ property, user, onSuccess, onCancel }: InvestorPurchaseFormLayoutProps) {
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
          />
        </div>
      </FormContainer>
    </div>
  );
}