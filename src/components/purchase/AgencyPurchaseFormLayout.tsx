/**
 * Agency Purchase Form V2 - Full Page Wrapper
 * Uses existing AgencyPurchaseForm with full-page layout
 */

import React from 'react';
import { Property, User } from '../../types';
import { FormContainer } from '../ui/form-container';
import { formatPropertyAddress } from '../../lib/utils';
import { AgencyPurchaseForm } from './AgencyPurchaseForm';

interface AgencyPurchaseFormLayoutProps {
  property: Property;
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AgencyPurchaseFormLayout({ property, user, onSuccess, onCancel }: AgencyPurchaseFormLayoutProps) {
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
          />
        </div>
      </FormContainer>
    </div>
  );
}