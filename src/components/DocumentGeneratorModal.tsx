"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Property, Transaction, Contact } from '../types';
import { DocumentType, DocumentClause, DocumentDetails, DOCUMENT_TEMPLATES } from '../types/documents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { FileText, Download, X, ChevronLeft, ChevronRight, Check, Plus, GripVertical, Trash2, Printer } from 'lucide-react';
import { formatPKR } from '../lib/currency';
import { formatPropertyAddress } from '../lib/utils';
import { getContacts } from '../lib/data';
import {
  getDefaultClauses,
  saveGeneratedDocument,
  replacePlaceholders,
  generateDocumentName
} from '../lib/documents';
import { GeneratedDocument } from '../types/documents';
import { createDocument } from '@/lib/api/documents';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { logger } from '../lib/logger';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  documentType: DocumentType;
  onClose: () => void;
  onComplete: () => void;
  property?: Property;
  transaction?: Transaction;
  contacts?: Contact[];
  /** When true, render only inner content (no Dialog wrapper). Parent must wrap in Dialog. */
  asContent?: boolean;
}

type Step = 1 | 2 | 3;

/**
 * Auto-fill logic for Sales Agreement and Final Sale Deed
 */
function autoFillSalesDocument(
  property?: Property,
  transaction?: Transaction,
  contacts?: Contact[]
): Partial<DocumentDetails> {
  if (!property) return {};

  const seller = contacts?.find(c => c.id === property.currentOwnerId);
  const buyer = contacts?.find(c => c.id === (transaction as any)?.buyerId);

  return {
    sellerName: seller?.name || property.agentName || '',
    sellerFatherName: (seller as any)?.fatherName || '',
    sellerCNIC: (seller as any)?.cnic || '',
    sellerAddress: (seller as any)?.address || '',
    buyerName: buyer?.name || (transaction as any)?.buyerName || '',
    buyerFatherName: (buyer as any)?.fatherName || '',
    buyerCNIC: (buyer as any)?.cnic || '',
    buyerAddress: (buyer as any)?.address || '',
    propertyAddress: property.address || '',
    propertyType: property.propertyType || '',
    propertySize: property.area?.toString() || '',
    propertySizeUnit: property.areaUnit || 'Sq. Yards',
    salePrice: (transaction as any)?.agreedPrice || property.price || 0,
    tokenMoney: (transaction as any)?.tokenMoney || 0,
    remainingAmount: ((transaction as any)?.agreedPrice || property.price || 0) - ((transaction as any)?.tokenMoney || 0),
  };
}

/**
 * Auto-fill logic for Rental Agreement
 */
function autoFillRentalAgreement(
  property?: Property,
  transaction?: Transaction,
  contacts?: Contact[]
): Partial<DocumentDetails> {
  if (!property) return {};

  const landlord = contacts?.find(c => c.id === property.currentOwnerId);
  const tenant = contacts?.find(c => c.id === (transaction as any)?.buyerId); // buyerId represents tenant in rental context

  return {
    landlordName: landlord?.name || property.agentName || '',
    landlordFatherName: (landlord as any)?.fatherName || '',
    landlordCNIC: (landlord as any)?.cnic || '',
    landlordAddress: (landlord as any)?.address || '',
    tenantName: tenant?.name || '',
    tenantFatherName: (tenant as any)?.fatherName || '',
    tenantCNIC: (tenant as any)?.cnic || '',
    tenantAddress: (tenant as any)?.address || '',
    propertyAddress: property.address || '',
    propertyType: property.propertyType || '',
    propertySize: property.area?.toString() || '',
    propertySizeUnit: property.areaUnit || 'Sq. Yards',
    monthlyRent: property.rentAmount || 0,
    securityDeposit: property.securityDeposit || (property.rentAmount || 0) * 2 || 0,
    leasePeriod: '1 Year',
  };
}

/**
 * Auto-fill logic for Property Disclosure
 */
function autoFillPropertyDisclosure(
  property?: Property,
  contacts?: Contact[]
): Partial<DocumentDetails> {
  if (!property) return {};

  const owner = contacts?.find(c => c.id === property.currentOwnerId);

  return {
    ownerName: owner?.name || property.agentName || '',
    ownerCNIC: (owner as any)?.cnic || '',
    ownerAddress: (owner as any)?.address || '',
    propertyAddress: property.address || '',
    propertyType: property.propertyType || '',
    propertySize: property.area?.toString() || '',
    propertySizeUnit: property.areaUnit || 'Sq. Yards',
    ownershipStatus: 'Freehold', // Could be derived from property data
    legalStatus: 'Clear', // Could be derived from property data
  };
}

/**
 * Auto-fill logic for Payment Receipt
 */
function autoFillPaymentReceipt(
  property?: Property,
  transaction?: Transaction,
  contacts?: Contact[]
): Partial<DocumentDetails> {
  if (!transaction) return {};

  const payer = contacts?.find(c => c.id === (transaction as any)?.buyerId);
  const payee = contacts?.find(c => c.id === property?.currentOwnerId);

  return {
    receiptNumber: `RCP-${Date.now()}`,
    payerName: payer?.name || '',
    payeeName: payee?.name || property?.agentName || '',
    paymentAmount: (transaction as any)?.tokenMoney || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    paymentPurpose: `Token money for ${property?.address || 'property'}`,
  };
}

export function DocumentGeneratorModal({
  documentType,
  onClose,
  onComplete,
  property,
  transaction,
  contacts = [],
  asContent = false
}: Props) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [details, setDetails] = useState<DocumentDetails>({} as DocumentDetails);
  const [clauses, setClauses] = useState<DocumentClause[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const template = DOCUMENT_TEMPLATES.find(t => t.id === documentType);

  // Initialize details and clauses based on document type
  useEffect(() => {
    try {
      // Load default clauses
      const defaultClauses = getDefaultClauses(documentType);
      setClauses(defaultClauses);

      // Auto-fill based on document type
      let autoFilledDetails: Partial<DocumentDetails> = {};

      if (property) {
        switch (documentType) {
          case 'sales-agreement':
          case 'final-sale-deed':
            autoFilledDetails = autoFillSalesDocument(property, transaction, contacts);
            break;
          case 'rental-agreement':
            autoFilledDetails = autoFillRentalAgreement(property, transaction, contacts);
            break;
          case 'property-disclosure':
            autoFilledDetails = autoFillPropertyDisclosure(property, contacts);
            break;
          case 'payment-receipt':
            autoFilledDetails = autoFillPaymentReceipt(property, transaction, contacts);
            break;
        }

        setDetails(prev => ({ ...prev, ...autoFilledDetails } as DocumentDetails));

        // Set read-only if we have significant data
        const hasData = Object.values(autoFilledDetails).some(val => val && val !== 0);
        setIsReadOnly(hasData);
      }

      setIsInitialized(true);
    } catch (error) {
      logger.error('Error initializing modal:', error);
      toast.error('Error initializing document generator');
    }
  }, [documentType, property, transaction, contacts]);

  const progress = (currentStep / 3) * 100;

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate based on document type
      const isValid = validateStep1(documentType, details);
      if (!isValid) {
        toast.error('Please fill in all required fields');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleFieldChange = (field: keyof DocumentDetails, value: any) => {
    setDetails(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate for sales documents
      if (documentType === 'sales-agreement' || documentType === 'final-sale-deed') {
        if (field === 'salePrice' || field === 'tokenMoney') {
          updated.remainingAmount = (updated.salePrice || 0) - (updated.tokenMoney || 0);
        }
      }

      return updated;
    });
  };

  const handleClauseChange = (id: string, content: string) => {
    try {
      setClauses(prev =>
        prev.map(clause =>
          clause.id === id ? { ...clause, content } : clause
        )
      );
    } catch (error) {
      logger.error('Error changing clause:', error);
      toast.error('Error updating clause');
    }
  };

  const handleClauseDelete = (id: string) => {
    try {
      setClauses(prev => prev.filter(clause => clause.id !== id));
      toast.success('Clause removed');
    } catch (error) {
      logger.error('Error deleting clause:', error);
      toast.error('Error removing clause');
    }
  };

  const handleAddClause = () => {
    try {
      const customClauseCount = clauses.filter(c => c.isCustom).length + 1;
      const uniqueId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newClause: DocumentClause = {
        id: uniqueId,
        title: `Custom Clause ${customClauseCount}`,
        content: 'Enter your custom clause text here...',
        isCustom: true,
        order: clauses.length + 1
      };

      setClauses(prev => [...prev, newClause]);
      toast.success('Custom clause added');
    } catch (error) {
      logger.error('Error adding clause:', error);
      toast.error('Error adding clause');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    try {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = clauses.findIndex((c) => c.id === active.id);
      const newIndex = clauses.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reordered = arrayMove(clauses, oldIndex, newIndex);
      const updated = reordered.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      setClauses(updated);
      toast.success('Clause reordered');
    } catch (error) {
      logger.error('Error reordering clauses:', error);
      toast.error('Error reordering clauses');
    }
  };

  const { tenantId, agencyId } = useAuthStore();

  const handleComplete = async () => {
    try {
      const documentName = generateDocumentName(
        documentType,
        details.propertyAddress || '',
        details.buyerName || details.tenantName || details.payerName || ''
      );

      if (tenantId && agencyId) {
        try {
          const created = await createDocument({
            documentType,
            documentName,
            details,
            clauses,
            agencyId,
            tenantId,
            propertyId: property?.id,
            transactionId: transaction?.id,
            contactId: undefined,
          });
          saveGeneratedDocument({
            ...created,
            propertyTitle: property?.title,
          } as GeneratedDocument);
          toast.success('Document saved and ready for PDF download');
        } catch (apiError) {
          logger.error('API save failed, saving locally', apiError);
          const localDoc: GeneratedDocument = {
            id: `doc-${Date.now()}`,
            documentType,
            documentName,
            propertyId: property?.id,
            propertyTitle: property?.title,
            transactionId: transaction?.id,
            details,
            clauses,
            createdAt: new Date().toISOString(),
            createdBy: 'current-user',
          };
          saveGeneratedDocument(localDoc);
          toast.success('Document generated (save to server failed; use Print for PDF)');
        }
      } else {
        const localDoc: GeneratedDocument = {
          id: `doc-${Date.now()}`,
          documentType,
          documentName,
          propertyId: property?.id,
          propertyTitle: property?.title,
          transactionId: transaction?.id,
          details,
          clauses,
          createdAt: new Date().toISOString(),
          createdBy: 'current-user',
        };
        saveGeneratedDocument(localDoc);
        toast.success('Document generated successfully!');
      }
      onComplete();
    } catch (error) {
      logger.error('Error generating document:', error);
      toast.error('Failed to generate document');
    }
  };

  const innerContent = (
    <>
      <DialogHeader className="px-8 py-6 border-b border-gray-200">
        <DialogTitle className="text-xl text-gray-900">
          {template?.name || 'Document Generator'}
        </DialogTitle>
        <DialogDescription>
          Fill in the details, customize clauses, and preview the document before generating
        </DialogDescription>

        {/* Progress Indicator */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className={currentStep === 1 ? 'text-blue-600' : 'text-gray-600'}>
                1. Fill Details
              </span>
              <span className={currentStep === 2 ? 'text-blue-600' : 'text-gray-600'}>
                2. Edit Clauses
              </span>
              <span className={currentStep === 3 ? 'text-blue-600' : 'text-gray-600'}>
                3. Preview
              </span>
            </div>
          </div>
        </div>
      </DialogHeader>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {currentStep === 1 && (
          <Step1FillDetails
            documentType={documentType}
            details={details}
            isReadOnly={isReadOnly}
            onChange={handleFieldChange}
          />
        )}

        {currentStep === 2 && (
          <Step2EditClauses
            clauses={clauses}
            onClauseChange={handleClauseChange}
            onClauseDelete={handleClauseDelete}
            onAddClause={handleAddClause}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          />
        )}

        {currentStep === 3 && (
          <Step3Preview
            documentType={documentType}
            details={details}
            clauses={clauses}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-gray-200 flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        <div>
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              <Check className="w-4 h-4 mr-2" />
              Generate Document
            </Button>
          )}
        </div>
      </div>
    </>
  );

  if (asContent) {
    return <>{innerContent}</>;
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="!max-w-[85vw] w-[85vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        {innerContent}
      </DialogContent>
    </Dialog>
  );
}

// Validation helper
function validateStep1(documentType: DocumentType, details: DocumentDetails): boolean {
  switch (documentType) {
    case 'sales-agreement':
    case 'final-sale-deed':
      return !!(details.sellerName && details.buyerName && details.propertyAddress && details.salePrice);
    case 'rental-agreement':
      return !!(details.landlordName && details.tenantName && details.propertyAddress && details.monthlyRent);
    case 'property-disclosure':
      return !!(details.ownerName && details.propertyAddress);
    case 'payment-receipt':
      return !!(details.payerName && details.payeeName && details.paymentAmount && details.receiptNumber);
    default:
      return true;
  }
}

// Step 1: Context-specific forms
function Step1FillDetails({
  documentType,
  details,
  isReadOnly,
  onChange
}: {
  documentType: DocumentType;
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
}) {
  // Render form based on document type
  switch (documentType) {
    case 'sales-agreement':
    case 'final-sale-deed':
      return <SalesDocumentForm details={details} isReadOnly={isReadOnly} onChange={onChange} />;
    case 'rental-agreement':
      return <RentalAgreementForm details={details} isReadOnly={isReadOnly} onChange={onChange} />;
    case 'property-disclosure':
      return <PropertyDisclosureForm details={details} isReadOnly={isReadOnly} onChange={onChange} />;
    case 'payment-receipt':
      return <PaymentReceiptForm details={details} isReadOnly={isReadOnly} onChange={onChange} />;
    default:
      return <div>Unknown document type</div>;
  }
}

// Sales Agreement / Final Sale Deed Form
function SalesDocumentForm({
  details,
  isReadOnly,
  onChange
}: {
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Smart Auto-fill:</strong> Details automatically filled from property deal. Fields are read-only.
          </p>
        </div>
      )}

      {/* Seller Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Seller Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Full Name *</Label>
            <Input
              value={details.sellerName || ''}
              onChange={(e) => onChange('sellerName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter seller's full name"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Father's Name</Label>
            <Input
              value={details.sellerFatherName || ''}
              onChange={(e) => onChange('sellerFatherName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter father's name"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">CNIC Number</Label>
            <Input
              value={details.sellerCNIC || ''}
              onChange={(e) => onChange('sellerCNIC', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="12345-1234567-1"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Address</Label>
            <Input
              value={details.sellerAddress || ''}
              onChange={(e) => onChange('sellerAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter seller's address"
            />
          </div>
        </div>
      </fieldset>

      {/* Buyer Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Buyer Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Full Name *</Label>
            <Input
              value={details.buyerName || ''}
              onChange={(e) => onChange('buyerName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter buyer's full name"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Father's Name</Label>
            <Input
              value={details.buyerFatherName || ''}
              onChange={(e) => onChange('buyerFatherName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter father's name"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">CNIC Number</Label>
            <Input
              value={details.buyerCNIC || ''}
              onChange={(e) => onChange('buyerCNIC', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="12345-1234567-1"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Address</Label>
            <Input
              value={details.buyerAddress || ''}
              onChange={(e) => onChange('buyerAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter buyer's address"
            />
          </div>
        </div>
      </fieldset>

      {/* Property Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Property Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <Label className="text-sm mb-2 block">Property Address *</Label>
            <Input
              value={details.propertyAddress || ''}
              onChange={(e) => onChange('propertyAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter full property address"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Property Type</Label>
            <Input
              value={details.propertyType || ''}
              onChange={(e) => onChange('propertyType', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="e.g., House, Apartment"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm mb-2 block">Size</Label>
              <Input
                value={details.propertySize || ''}
                onChange={(e) => onChange('propertySize', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
                placeholder="240"
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Unit</Label>
              <Input
                value={details.propertySizeUnit || 'Sq. Yards'}
                onChange={(e) => onChange('propertySizeUnit', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Financial Details */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Financial Details</legend>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Sale Price (PKR) *</Label>
            <Input
              type="number"
              value={details.salePrice || ''}
              onChange={(e) => onChange('salePrice', parseFloat(e.target.value) || 0)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Token Money (PKR)</Label>
            <Input
              type="number"
              value={details.tokenMoney || ''}
              onChange={(e) => onChange('tokenMoney', parseFloat(e.target.value) || 0)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Remaining (PKR)</Label>
            <Input
              type="number"
              value={details.remainingAmount || ''}
              readOnly
              className="bg-gray-100"
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// Rental Agreement Form
function RentalAgreementForm({
  details,
  isReadOnly,
  onChange
}: {
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Smart Auto-fill:</strong> Rental details automatically filled from property data.
          </p>
        </div>
      )}

      {/* Landlord Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Landlord Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Full Name *</Label>
            <Input
              value={details.landlordName || ''}
              onChange={(e) => onChange('landlordName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter landlord's name"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Father's Name</Label>
            <Input
              value={details.landlordFatherName || ''}
              onChange={(e) => onChange('landlordFatherName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter father's name"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">CNIC Number</Label>
            <Input
              value={details.landlordCNIC || ''}
              onChange={(e) => onChange('landlordCNIC', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="12345-1234567-1"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Address</Label>
            <Input
              value={details.landlordAddress || ''}
              onChange={(e) => onChange('landlordAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter landlord's address"
            />
          </div>
        </div>
      </fieldset>

      {/* Tenant Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Tenant Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Full Name *</Label>
            <Input
              value={details.tenantName || ''}
              onChange={(e) => onChange('tenantName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter tenant's name"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Father's Name</Label>
            <Input
              value={details.tenantFatherName || ''}
              onChange={(e) => onChange('tenantFatherName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter father's name"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">CNIC Number</Label>
            <Input
              value={details.tenantCNIC || ''}
              onChange={(e) => onChange('tenantCNIC', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="12345-1234567-1"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Address</Label>
            <Input
              value={details.tenantAddress || ''}
              onChange={(e) => onChange('tenantAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter tenant's address"
            />
          </div>
        </div>
      </fieldset>

      {/* Property Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Property Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <Label className="text-sm mb-2 block">Property Address *</Label>
            <Input
              value={details.propertyAddress || ''}
              onChange={(e) => onChange('propertyAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter property address"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Property Type</Label>
            <Input
              value={details.propertyType || ''}
              onChange={(e) => onChange('propertyType', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="e.g., Apartment, House"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm mb-2 block">Size</Label>
              <Input
                value={details.propertySize || ''}
                onChange={(e) => onChange('propertySize', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
                placeholder="1200"
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Unit</Label>
              <Input
                value={details.propertySizeUnit || 'Sq. Ft'}
                onChange={(e) => onChange('propertySizeUnit', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Rental Terms */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Rental Terms</legend>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Monthly Rent (PKR) *</Label>
            <Input
              type="number"
              value={details.monthlyRent || ''}
              onChange={(e) => onChange('monthlyRent', parseFloat(e.target.value) || 0)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Security Deposit (PKR)</Label>
            <Input
              type="number"
              value={details.securityDeposit || ''}
              onChange={(e) => onChange('securityDeposit', parseFloat(e.target.value) || 0)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Lease Period</Label>
            <Input
              value={details.leasePeriod || ''}
              onChange={(e) => onChange('leasePeriod', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="1 Year"
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// Property Disclosure Form
function PropertyDisclosureForm({
  details,
  isReadOnly,
  onChange
}: {
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Smart Auto-fill:</strong> Property details automatically filled.
          </p>
        </div>
      )}

      {/* Owner Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Property Owner Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Owner Name *</Label>
            <Input
              value={details.ownerName || ''}
              onChange={(e) => onChange('ownerName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter owner's name"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">CNIC Number</Label>
            <Input
              value={details.ownerCNIC || ''}
              onChange={(e) => onChange('ownerCNIC', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="12345-1234567-1"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-sm mb-2 block">Owner Address</Label>
            <Input
              value={details.ownerAddress || ''}
              onChange={(e) => onChange('ownerAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter owner's address"
            />
          </div>
        </div>
      </fieldset>

      {/* Property Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Property Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <Label className="text-sm mb-2 block">Property Address *</Label>
            <Input
              value={details.propertyAddress || ''}
              onChange={(e) => onChange('propertyAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter property address"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Property Type</Label>
            <Input
              value={details.propertyType || ''}
              onChange={(e) => onChange('propertyType', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="e.g., Residential, Commercial"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm mb-2 block">Size</Label>
              <Input
                value={details.propertySize || ''}
                onChange={(e) => onChange('propertySize', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
                placeholder="240"
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Unit</Label>
              <Input
                value={details.propertySizeUnit || 'Sq. Yards'}
                onChange={(e) => onChange('propertySizeUnit', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Legal & Structural Status */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Legal & Structural Status</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Ownership Status</Label>
            <Input
              value={details.ownershipStatus || ''}
              onChange={(e) => onChange('ownershipStatus', e.target.value)}
              placeholder="e.g., Freehold, Leasehold"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Legal Status</Label>
            <Input
              value={details.legalStatus || ''}
              onChange={(e) => onChange('legalStatus', e.target.value)}
              placeholder="e.g., Clear, Disputed"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-sm mb-2 block">Structural Condition</Label>
            <Textarea
              value={details.structuralCondition || ''}
              onChange={(e) => onChange('structuralCondition', e.target.value)}
              placeholder="Describe the structural condition of the property"
              rows={3}
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// Payment Receipt Form
function PaymentReceiptForm({
  details,
  isReadOnly,
  onChange
}: {
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Smart Auto-fill:</strong> Payment details automatically filled from transaction.
          </p>
        </div>
      )}

      {/* Receipt Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Receipt Information</legend>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Receipt Number *</Label>
            <Input
              value={details.receiptNumber || ''}
              onChange={(e) => onChange('receiptNumber', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="RCP-12345"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Payment Date *</Label>
            <Input
              type="date"
              value={details.paymentDate || ''}
              onChange={(e) => onChange('paymentDate', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Payment Amount (PKR) *</Label>
            <Input
              type="number"
              value={details.paymentAmount || ''}
              onChange={(e) => onChange('paymentAmount', parseFloat(e.target.value) || 0)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="0"
            />
          </div>
        </div>
      </fieldset>

      {/* Payer & Payee Information */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Payer & Payee Details</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Payer Name *</Label>
            <Input
              value={details.payerName || ''}
              onChange={(e) => onChange('payerName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Person making payment"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Payee Name *</Label>
            <Input
              value={details.payeeName || ''}
              onChange={(e) => onChange('payeeName', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Person receiving payment"
            />
          </div>
        </div>
      </fieldset>

      {/* Payment Details */}
      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Payment Details</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Payment Method</Label>
            <Input
              value={details.paymentMethod || ''}
              onChange={(e) => onChange('paymentMethod', e.target.value)}
              placeholder="e.g., Bank Transfer, Cash, Cheque"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Payment Purpose</Label>
            <Input
              value={details.paymentPurpose || ''}
              onChange={(e) => onChange('paymentPurpose', e.target.value)}
              placeholder="e.g., Token money for property"
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// Step 2: Edit Clauses (same for all document types)
function Step2EditClauses({
  clauses,
  onClauseChange,
  onClauseDelete,
  onAddClause,
  onDragEnd,
  sensors
}: {
  clauses: DocumentClause[];
  onClauseChange: (id: string, content: string) => void;
  onClauseDelete: (id: string) => void;
  onAddClause: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: any;
}) {
  if (clauses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            No clauses loaded. Please try refreshing.
          </p>
        </div>
        <Button onClick={onAddClause} variant="outline" className="w-full border-dashed border-2">
          <Plus className="w-4 h-4 mr-2" />
          Add First Clause
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Clause Editor:</strong> Drag the grip icon to reorder, click to edit text, or delete clauses you don't need.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={clauses.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {clauses.map((clause) => (
              <SortableClauseItem
                key={clause.id}
                clause={clause}
                onClauseChange={onClauseChange}
                onClauseDelete={onClauseDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button onClick={onAddClause} variant="outline" className="w-full border-dashed border-2">
        <Plus className="w-4 h-4 mr-2" />
        Add New Clause
      </Button>
    </div>
  );
}

// Sortable Clause Item
function SortableClauseItem({
  clause,
  onClauseChange,
  onClauseDelete
}: {
  clause: DocumentClause;
  onClauseChange: (id: string, content: string) => void;
  onClauseDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: clause.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 ${isDragging ? 'shadow-lg z-50' : ''} ${clause.isCustom ? 'border-blue-300 border-2' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="mt-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-gray-900">{clause.title}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClauseDelete(clause.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Textarea
            value={clause.content}
            onChange={(e) => onClauseChange(clause.id, e.target.value)}
            rows={4}
            className="resize-y"
          />
        </div>
      </div>
    </Card>
  );
}

// Step 3: Preview (same for all document types)
function Step3Preview({
  documentType,
  details,
  clauses
}: {
  documentType: DocumentType;
  details: DocumentDetails;
  clauses: DocumentClause[];
}) {
  const template = DOCUMENT_TEMPLATES.find(t => t.id === documentType);

  const handlePrint = () => window.print();
  const handleDownload = () => toast.info('PDF download will be implemented');

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="text-gray-900">Document Preview</h3>
          <p className="text-sm text-gray-600">Review before finalizing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Document Preview */}
      <Card className="p-8 bg-white max-w-4xl mx-auto" style={{ fontFamily: 'serif' }}>
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center border-b-2 border-gray-900 pb-4">
            <h1 className="text-2xl uppercase tracking-wide text-gray-900 font-bold">
              {template?.name.toUpperCase()}
            </h1>
          </div>

          {/* Clauses */}
          <div className="space-y-4">
            {clauses.map((clause) => (
              <div key={clause.id} className="space-y-2">
                <h3 className="text-gray-900 font-semibold">{clause.title}</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {replacePlaceholders(clause.content, details)}
                </p>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="mt-12 pt-8 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="border-b border-gray-900 w-48 mb-2"></div>
                <p className="text-sm text-gray-700">
                  {details.sellerName || details.landlordName || details.ownerName || details.payeeName || '[Party 1]'}
                </p>
                <p className="text-sm text-gray-600">Signature</p>
              </div>
              <div>
                <div className="border-b border-gray-900 w-48 mb-2"></div>
                <p className="text-sm text-gray-700">
                  {details.buyerName || details.tenantName || details.payerName || '[Party 2]'}
                </p>
                <p className="text-sm text-gray-600">Signature</p>
              </div>
            </div>

            {documentType !== 'payment-receipt' && (
              <div className="mt-8 grid grid-cols-2 gap-8">
                <div>
                  <div className="border-b border-gray-900 w-48 mb-2"></div>
                  <p className="text-sm text-gray-600">Witness 1</p>
                </div>
                <div>
                  <div className="border-b border-gray-900 w-48 mb-2"></div>
                  <p className="text-sm text-gray-600">Witness 2</p>
                </div>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="mt-8 text-right">
            <p className="text-sm text-gray-600">
              Date: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}