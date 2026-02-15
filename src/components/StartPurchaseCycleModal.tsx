/**
 * Start Purchase Cycle Modal V2 - Multi-Step Form with Type Selection
 * 
 * DESIGN SYSTEM V4.1 COMPLIANT:
 * - Type selection first (Agency/Investor/Client)
 * - Multi-step forms for each type
 * - FormContainer + FormSection + FormField
 * - Complete validation per step
 * - PKR formatting
 * 
 * FLOW:
 * 1. Select purchaser type (Agency, Investor, Client)
 * 2. Multi-step form based on type (3-4 steps each)
 */

import React, { useState } from 'react';
import { Property, User, PurchaserType } from '../types';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { FormContainer } from './ui/form-container';
import { Button } from './ui/button';
import { formatPropertyAddress } from '../lib/utils';
import { 
  TrendingDown, 
  Building2, 
  Users as UsersIcon, 
  UserCheck, 
  DollarSign, 
  Handshake 
} from 'lucide-react';
import { AgencyPurchaseFormLayout } from './purchase/AgencyPurchaseFormLayout';
import { InvestorPurchaseFormLayout } from './purchase/InvestorPurchaseFormLayout';
import { ClientPurchaseFormLayout } from './purchase/ClientPurchaseFormLayout';

interface StartPurchaseCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  user: User;
  onSuccess: () => void;
}

export default function StartPurchaseCycleModal({
  isOpen,
  onClose,
  property,
  user,
  onSuccess,
}: StartPurchaseCycleModalProps) {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedType, setSelectedType] = useState<PurchaserType | null>(null);

  const handleTypeSelect = (type: PurchaserType) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleBack = () => {
    setStep('select');
    setSelectedType(null);
  };

  const handleClose = () => {
    setStep('select');
    setSelectedType(null);
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  // Type Selection View
  if (step === 'select') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {/* Accessibility - Hidden title and description */}
          <DialogTitle className="sr-only">Start Purchase Cycle</DialogTitle>
          <DialogDescription className="sr-only">
            Select purchaser type for {formatPropertyAddress(property)}
          </DialogDescription>
          
          <FormContainer
            title="Start Purchase Cycle"
            description={formatPropertyAddress(property)}
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
                  className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left bg-background hover:bg-accent"
                >
                  <div className="absolute top-4 right-4 p-3 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>

                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="font-medium">Agency Purchase</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Agency is buying this property as an investment to hold or resell
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Investment tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>ROI calculation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>No commission</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Investor Purchase */}
                <button
                  onClick={() => handleTypeSelect('investor')}
                  className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left bg-background hover:bg-accent"
                >
                  <div className="absolute top-4 right-4 p-3 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <UsersIcon className="h-6 w-6 text-purple-600" />
                  </div>

                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
                      <Handshake className="h-6 w-6 text-purple-600" />
                    </div>

                    <div>
                      <h3 className="font-medium">Investor Purchase</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Facilitating a purchase for an investor client
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Facilitation fee</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Investor ownership</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Simple workflow</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Client Purchase (Buyer Representation) */}
                <button
                  onClick={() => handleTypeSelect('client')}
                  className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all p-6 text-left bg-background hover:bg-accent"
                >
                  <div className="absolute top-4 right-4 p-3 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>

                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
                      <TrendingDown className="h-6 w-6 text-green-600" />
                    </div>

                    <div>
                      <h3 className="font-medium">Client Purchase</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Representing a buyer client in purchasing this property
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Buyer representation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Commission structure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Full workflow</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Comparison Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Feature</th>
                      <th className="text-center p-3">Agency</th>
                      <th className="text-center p-3">Investor</th>
                      <th className="text-center p-3">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-3">Who Owns?</td>
                      <td className="text-center p-3 text-muted-foreground">Agency</td>
                      <td className="text-center p-3 text-muted-foreground">Investor</td>
                      <td className="text-center p-3 text-muted-foreground">Client</td>
                    </tr>
                    <tr className="border-t bg-muted/30">
                      <td className="p-3">Commission?</td>
                      <td className="text-center p-3 text-muted-foreground">No</td>
                      <td className="text-center p-3 text-muted-foreground">Facilitation Fee</td>
                      <td className="text-center p-3 text-muted-foreground">Yes (2%)</td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3">Purpose</td>
                      <td className="text-center p-3 text-muted-foreground">Investment</td>
                      <td className="text-center p-3 text-muted-foreground">Facilitation</td>
                      <td className="text-center p-3 text-muted-foreground">Representation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </FormContainer>
        </DialogContent>
      </Dialog>
    );
  }

  // Form View (based on selected type)
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Accessibility - Hidden title and description */}
        <DialogTitle className="sr-only">{selectedType} Purchase</DialogTitle>
        <DialogDescription className="sr-only">
          Complete {selectedType} purchase for {formatPropertyAddress(property)}
        </DialogDescription>
        
        {/* Back Button and Header */}
        <div className="flex items-start gap-3 pb-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8 mt-1 flex-shrink-0"
          >
            <TrendingDown className="h-4 w-4 rotate-180" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold capitalize">
              {selectedType} Purchase
            </h2>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {formatPropertyAddress(property)}
            </p>
          </div>
        </div>

        {/* Type-Specific Forms (use their own layout) */}
        <div className="pt-2">
          {selectedType === 'agency' && (
            <AgencyPurchaseFormLayout
              property={property}
              user={user}
              onSuccess={handleSuccess}
              onCancel={handleBack}
            />
          )}
          {selectedType === 'investor' && (
            <InvestorPurchaseFormLayout
              property={property}
              user={user}
              onSuccess={handleSuccess}
              onCancel={handleBack}
            />
          )}
          {selectedType === 'client' && (
            <ClientPurchaseFormLayout
              property={property}
              user={user}
              onSuccess={handleSuccess}
              onCancel={handleBack}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}