/**
 * Purchase Cycle Form V2 - Full Page with Type Selection
 * 
 * DESIGN SYSTEM V4.1 COMPLIANT:
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
<<<<<<< Updated upstream:src/components/PurchaseCycleFormV2.tsx
import { AgencyPurchaseFormV2 } from './purchase/AgencyPurchaseFormV2';
import { InvestorPurchaseFormV2 } from './purchase/InvestorPurchaseFormV2';
import { ClientPurchaseFormV2 } from './purchase/ClientPurchaseFormV2';
=======
import { AgencyPurchaseFormLayout } from './purchase/AgencyPurchaseFormLayout';
import { InvestorPurchaseFormLayout } from './purchase/InvestorPurchaseFormLayout';
import { ClientPurchaseFormLayout } from './purchase/ClientPurchaseFormLayout';
import type { CreatePurchaseCycleFromPropertyPayload } from '@/lib/api/purchase-cycles';
<<<<<<< Updated upstream:src/components/PurchaseCycleFormV2.tsx
>>>>>>> Stashed changes:src/components/PurchaseCycleForm.tsx

interface PurchaseCycleFormV2Props {
=======
interface PurchaseCycleFormProps {
>>>>>>> Stashed changes:src/components/PurchaseCycleForm.tsx
  property: Property;
  user: User;
  onBack: () => void;
  onSuccess: () => void;
  onSubmitFromProperty?: (data: CreatePurchaseCycleFromPropertyPayload) => Promise<{ id: string } | null>;
}

export function PurchaseCycleFormV2({
  property,
  user,
  onBack,
  onSuccess,
<<<<<<< Updated upstream:src/components/PurchaseCycleFormV2.tsx
<<<<<<< Updated upstream:src/components/PurchaseCycleFormV2.tsx
}: PurchaseCycleFormV2Props) {
=======
  onSubmitFromProperty,
}: PurchaseCycleFormProps) {
>>>>>>> Stashed changes:src/components/PurchaseCycleForm.tsx
=======

  onSubmitFromProperty,
}: PurchaseCycleFormProps) {
>>>>>>> Stashed changes:src/components/PurchaseCycleForm.tsx
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
        <AgencyPurchaseFormV2
          property={property}
          user={user}
          onSuccess={onSuccess}
          onCancel={handleBackToSelection}
          onSubmitFromProperty={onSubmitFromProperty}
        />
      )}
      {selectedType === 'investor' && (
        <InvestorPurchaseFormV2
          property={property}
          user={user}
          onSuccess={onSuccess}
          onCancel={handleBackToSelection}
          onSubmitFromProperty={onSubmitFromProperty}
        />
      )}
      {selectedType === 'client' && (
        <ClientPurchaseFormV2
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
