/**
 * Purchase Cycle Form - Full Page with Type Selection
 * 
 * Design System COMPLIANT:
 * - Type selection step (Agency/Investor/Client)
 * - Delegates to specific sub-forms based on type
 * - Full-page layout with back button (not a modal)
 * 
 * FLOW:
 * 1. Select purchaser type
 * 2. Complete type-specific form
 */

import React, { useState } from 'react';
import { Property, User, PurchaserType } from '../types';
import { FormContainer } from './ui/form-container';
import { Button } from './ui/button';
import { formatPropertyAddress } from '../lib/utils';
import {
  Building2,
  Users as UsersIcon,
  UserCheck
} from 'lucide-react';
import { AgencyPurchaseForm } from './purchase/AgencyPurchaseForm';
import { InvestorPurchaseForm } from './purchase/InvestorPurchaseForm';
import { ClientPurchaseForm } from './purchase/ClientPurchaseForm';
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';

interface PurchaseCycleFormProps {
  property: Property;
  user: User;
  onBack: () => void;
  onSuccess: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

export function PurchaseCycleForm({
  property,
  user,
  onBack,
  onSuccess,
  onSubmitFromProperty,
}: PurchaseCycleFormProps) {
  const [selectedType, setSelectedType] = useState<PurchaserType | null>(null);

  const handleTypeSelect = (type: PurchaserType) => {
    setSelectedType(type);
  };

  const handleBackToSelection = () => {
    setSelectedType(null);
  };

  // Type Selection View
  if (!selectedType) {
    return (
      <div className="min-h-screen bg-gray-50">
        <FormContainer
          title="Start Purchase Cycle"
          description={formatPropertyAddress(property)}
          onBack={onBack}
        >
          <div className="space-y-6 p-6">
            {/* Info Card */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Who is purchasing this property?</strong> Select the type of purchaser to proceed with the appropriate workflow and commission structure.
              </p>
            </div>

            {/* Purchaser Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Agency Purchase */}
              <button
                onClick={() => handleTypeSelect('agency')}
                className="group relative p-6 bg-background border-2 border-border rounded-lg hover:border-primary hover:shadow-lg transition-all text-left"
              >
                <div className="flex flex-col items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Agency Purchase</h3>
                    <p className="text-sm text-muted-foreground">
                      Your agency is buying this property to hold as inventory for resale or rental
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    • No commission split<br />
                    • Direct ownership<br />
                    • Inventory tracking
                  </div>
                </div>
              </button>

              {/* Investor Purchase */}
              <button
                onClick={() => handleTypeSelect('investor')}
                className="group relative p-6 bg-background border-2 border-border rounded-lg hover:border-primary hover:shadow-lg transition-all text-left"
              >
                <div className="flex flex-col items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <UsersIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Investor Purchase</h3>
                    <p className="text-sm text-muted-foreground">
                      One or more investors are buying through your agency
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    • Commission earned<br />
                    • Investor tracking<br />
                    • Share management
                  </div>
                </div>
              </button>

              {/* Client Purchase */}
              <button
                onClick={() => handleTypeSelect('client')}
                className="group relative p-6 bg-background border-2 border-border rounded-lg hover:border-primary hover:shadow-lg transition-all text-left"
              >
                <div className="flex flex-col items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Client Purchase</h3>
                    <p className="text-sm text-muted-foreground">
                      You're helping a client buy this property
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    • Commission earned<br />
                    • Buyer representation<br />
                    • Deal facilitation
                  </div>
                </div>
              </button>
            </div>
          </div>
        </FormContainer>
      </div>
    );
  }

  // Form View - Render type-specific form
  return (
    <>
      {selectedType === 'agency' && (
        <AgencyPurchaseForm
          property={property}
          user={user}
          onSuccess={onSuccess}
          onCancel={handleBackToSelection}
          onSubmitFromProperty={onSubmitFromProperty}
        />
      )}
      {selectedType === 'investor' && (
        <InvestorPurchaseForm
          property={property}
          user={user}
          onSuccess={onSuccess}
          onCancel={handleBackToSelection}
          onSubmitFromProperty={onSubmitFromProperty}
        />
      )}
      {selectedType === 'client' && (
        <ClientPurchaseForm
          property={property}
          user={user}
          onSuccess={onSuccess}
          onCancel={handleBackToSelection}
          onSubmitFromProperty={onSubmitFromProperty}
        />
      )}
    </>
  );
}

