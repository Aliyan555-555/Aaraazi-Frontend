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
// [STUBBED] import { getContacts } from '../lib/data';
import {
  getDefaultClauses,
  saveGeneratedDocument,
  replacePlaceholders,
  generateDocumentName,
  normalizeDetailsForApi,
} from '../lib/documents';
import {
  formatCNICInput,
  sanitizeNameInput,
  sanitizeFinancialInput,
  getFinancialFieldValue,
  validateDocumentDetails,
  getFirstValidationError,
  type DocumentDetailsErrors,
} from '@/lib/documentFormValidation';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';




import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ===== STUBS for removed prototype functions =====
const getContacts = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


/** Payment method options aligned with backend Prisma enum PaymentMethod */
const DOCUMENT_PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
];

/** Property type options aligned with backend Prisma enum PropertyType */
const DOCUMENT_PROPERTY_TYPES: { value: string; label: string }[] = [
  { value: 'HOUSE', label: 'House' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'LAND', label: 'Land' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'FARMHOUSE', label: 'Farmhouse' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'OTHER', label: 'Other' },
];

/** Area/size unit options aligned with backend Prisma enum AreaUnit */
const DOCUMENT_AREA_UNITS: { value: string; label: string }[] = [
  { value: 'SQFT', label: 'Sq. Ft' },
  { value: 'SQMETER', label: 'Sq. Meter' },
  { value: 'SQYARDS', label: 'Sq. Yards' },
  { value: 'MARLA', label: 'Marla' },
  { value: 'KANAL', label: 'Kanal' },
  { value: 'ACRE', label: 'Acre' },
  { value: 'HECTARE', label: 'Hectare' },
];

/** Document types that use each placeholder – used to show only relevant variables in the guide */
const SALES = ['sales-agreement', 'final-sale-deed'] as const;
const RENTAL = ['rental-agreement'] as const;
const PROPERTY = ['property-disclosure'] as const;
const PAYMENT = ['payment-receipt'] as const;
const ALL = [...SALES, ...RENTAL, ...PROPERTY, ...PAYMENT] as const;
type DocTypeForGuide = (typeof ALL)[number];

/** Placeholder variables with which document types they apply to */
const CLAUSE_PLACEHOLDER_GUIDE: {
  variable: string;
  description: string;
  forDocumentTypes: readonly DocTypeForGuide[];
}[] = [
    { variable: '[DATE]', description: 'Current date', forDocumentTypes: ALL },
    { variable: '[SELLER_NAME]', description: 'Seller full name', forDocumentTypes: SALES },
    { variable: '[SELLER_FATHER_NAME]', description: "Seller's father name", forDocumentTypes: SALES },
    { variable: '[SELLER_CNIC]', description: 'Seller CNIC', forDocumentTypes: SALES },
    { variable: '[SELLER_ADDRESS]', description: 'Seller address', forDocumentTypes: SALES },
    { variable: '[BUYER_NAME]', description: 'Buyer full name', forDocumentTypes: SALES },
    { variable: '[BUYER_FATHER_NAME]', description: "Buyer's father name", forDocumentTypes: SALES },
    { variable: '[BUYER_CNIC]', description: 'Buyer CNIC', forDocumentTypes: SALES },
    { variable: '[BUYER_ADDRESS]', description: 'Buyer address', forDocumentTypes: SALES },
    { variable: '[PROPERTY_ADDRESS]', description: 'Property address', forDocumentTypes: [...SALES, ...RENTAL, ...PROPERTY] },
    { variable: '[PROPERTY_TYPE]', description: 'Property type', forDocumentTypes: [...SALES, ...RENTAL, ...PROPERTY] },
    { variable: '[PROPERTY_SIZE]', description: 'Property size', forDocumentTypes: [...SALES, ...RENTAL, ...PROPERTY] },
    { variable: '[PROPERTY_UNIT]', description: 'Size unit (e.g. Sq. Yards)', forDocumentTypes: [...SALES, ...RENTAL, ...PROPERTY] },
    { variable: '[SALE_PRICE]', description: 'Sale price (PKR)', forDocumentTypes: SALES },
    { variable: '[SALE_PRICE_WORDS]', description: 'Sale price in words', forDocumentTypes: SALES },
    { variable: '[TOKEN_MONEY]', description: 'Token money (PKR)', forDocumentTypes: SALES },
    { variable: '[REMAINING_AMOUNT]', description: 'Remaining amount (PKR)', forDocumentTypes: SALES },
    { variable: '[LANDLORD_NAME]', description: 'Landlord name', forDocumentTypes: RENTAL },
    { variable: '[TENANT_NAME]', description: 'Tenant name', forDocumentTypes: RENTAL },
    { variable: '[MONTHLY_RENT]', description: 'Monthly rent (PKR)', forDocumentTypes: RENTAL },
    { variable: '[SECURITY_DEPOSIT]', description: 'Security deposit (PKR)', forDocumentTypes: RENTAL },
    { variable: '[LEASE_PERIOD]', description: 'Lease period', forDocumentTypes: RENTAL },
    { variable: '[START_DATE]', description: 'Start date', forDocumentTypes: RENTAL },
    { variable: '[NOTICE_PERIOD]', description: 'Notice period (days)', forDocumentTypes: RENTAL },
    { variable: '[OWNER_NAME]', description: 'Owner name', forDocumentTypes: PROPERTY },
    { variable: '[OWNERSHIP_STATUS]', description: 'Ownership status', forDocumentTypes: PROPERTY },
    { variable: '[LEGAL_STATUS]', description: 'Legal status', forDocumentTypes: PROPERTY },
    { variable: '[STRUCTURAL_CONDITION]', description: 'Structural condition', forDocumentTypes: PROPERTY },
    { variable: '[PAYER_NAME]', description: 'Payer name', forDocumentTypes: PAYMENT },
    { variable: '[PAYEE_NAME]', description: 'Payee name', forDocumentTypes: PAYMENT },
    { variable: '[PAYMENT_AMOUNT]', description: 'Payment amount (PKR)', forDocumentTypes: PAYMENT },
    { variable: '[PAYMENT_DATE]', description: 'Payment date', forDocumentTypes: PAYMENT },
    { variable: '[RECEIPT_NUMBER]', description: 'Receipt number', forDocumentTypes: PAYMENT },
    { variable: '[PAYMENT_METHOD]', description: 'Payment method', forDocumentTypes: PAYMENT },
    { variable: '[PAYMENT_PURPOSE]', description: 'Payment purpose', forDocumentTypes: PAYMENT },
  ];

function getPlaceholderGuideForDocumentType(documentType: DocumentType) {
  return CLAUSE_PLACEHOLDER_GUIDE.filter((item) =>
    item.forDocumentTypes.includes(documentType as DocTypeForGuide)
  );
}

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
    propertySizeUnit: property.areaUnit || 'SQYARDS',
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
    propertySizeUnit: property.areaUnit || 'SQYARDS',
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
    propertySizeUnit: property.areaUnit || 'SQYARDS',
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
    paymentMethod: 'BANK_TRANSFER',
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
  const [formErrors, setFormErrors] = useState<DocumentDetailsErrors>({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const template = DOCUMENT_TEMPLATES.find(t => t.id === documentType);

  // Stable dependency values to avoid infinite loop (property/transaction/contacts are new refs every render)
  const propertyId = property?.id ?? null;
  const transactionId = transaction?.id ?? null;
  const contactsKey = (contacts ?? []).map((c) => (c as { id?: string }).id).filter(Boolean).join(',');

  // Initialize details and clauses based on document type (run only when document type or linked data identity changes)
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
  }, [documentType, propertyId, transactionId, contactsKey]);

  const progress = (currentStep / 3) * 100;

  const handleNext = () => {
    if (currentStep === 1) {
      const errors = validateDocumentDetails(documentType, details);
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        const first = getFirstValidationError(errors);
        toast.error(first || 'Please fix the errors in the form');
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
    setFormErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setDetails(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate for sales documents
      if (documentType === 'sales-agreement' || documentType === 'final-sale-deed') {
        if (field === 'salePrice' || field === 'tokenMoney') {
          const sale = Number(updated.salePrice) || 0;
          const token = Number(updated.tokenMoney) || 0;
          updated.remainingAmount = sale - token;
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

  const handleClauseTitleChange = (id: string, title: string) => {
    try {
      setClauses(prev =>
        prev.map(clause =>
          clause.id === id ? { ...clause, title } : clause
        )
      );
    } catch (error) {
      logger.error('Error changing clause title:', error);
      toast.error('Error updating clause title');
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
            details: normalizeDetailsForApi(details),
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
            details: normalizeDetailsForApi(details),
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
          details: normalizeDetailsForApi(details),
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
            errors={formErrors}
          />
        )}

        {currentStep === 2 && (
          <Step2EditClauses
            documentType={documentType}
            clauses={clauses}
            onClauseChange={handleClauseChange}
            onClauseTitleChange={handleClauseTitleChange}
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

// Inline field with error display (used in document forms)
function FormFieldWithError({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm mb-2 block">
        {label} {required && '*'}
      </Label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1" role="alert">{error}</p>}
    </div>
  );
}

// Step 1: Context-specific forms
function Step1FillDetails({
  documentType,
  details,
  isReadOnly,
  onChange,
  errors,
}: {
  documentType: DocumentType;
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
  errors: DocumentDetailsErrors;
}) {
  switch (documentType) {
    case 'sales-agreement':
    case 'final-sale-deed':
      return <SalesDocumentForm details={details} isReadOnly={isReadOnly} onChange={onChange} errors={errors} FormField={FormFieldWithError} />;
    case 'rental-agreement':
      return <RentalAgreementForm details={details} isReadOnly={isReadOnly} onChange={onChange} errors={errors} FormField={FormFieldWithError} />;
    case 'property-disclosure':
      return <PropertyDisclosureForm details={details} isReadOnly={isReadOnly} onChange={onChange} errors={errors} FormField={FormFieldWithError} />;
    case 'payment-receipt':
      return <PaymentReceiptForm details={details} isReadOnly={isReadOnly} onChange={onChange} errors={errors} FormField={FormFieldWithError} />;
    default:
      return <div>Unknown document type</div>;
  }
}

// Sales Agreement / Final Sale Deed Form
function SalesDocumentForm({
  details,
  isReadOnly,
  onChange,
  errors,
  FormField,
}: {
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
  errors: DocumentDetailsErrors;
  FormField: typeof FormFieldWithError;
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

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Seller Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Full Name" required error={errors.sellerName}>
            <Input
              value={details.sellerName || ''}
              onChange={(e) => onChange('sellerName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.sellerName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="Father's Name" error={errors.sellerFatherName}>
            <Input
              value={details.sellerFatherName || ''}
              onChange={(e) => onChange('sellerFatherName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.sellerFatherName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="CNIC Number" error={errors.sellerCNIC}>
            <Input
              value={details.sellerCNIC || ''}
              onChange={(e) => onChange('sellerCNIC', formatCNICInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.sellerCNIC ? 'border-red-500' : ''}
              placeholder="12345-1234567-1"
              maxLength={15}
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={details.sellerAddress || ''}
              onChange={(e) => onChange('sellerAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter seller's address"
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Buyer Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Full Name" required error={errors.buyerName}>
            <Input
              value={details.buyerName || ''}
              onChange={(e) => onChange('buyerName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.buyerName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="Father's Name" error={errors.buyerFatherName}>
            <Input
              value={details.buyerFatherName || ''}
              onChange={(e) => onChange('buyerFatherName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.buyerFatherName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="CNIC Number" error={errors.buyerCNIC}>
            <Input
              value={details.buyerCNIC || ''}
              onChange={(e) => onChange('buyerCNIC', formatCNICInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.buyerCNIC ? 'border-red-500' : ''}
              placeholder="12345-1234567-1"
              maxLength={15}
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={details.buyerAddress || ''}
              onChange={(e) => onChange('buyerAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter buyer's address"
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Property Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <FormField label="Property Address" required error={errors.propertyAddress}>
              <Input
                value={details.propertyAddress || ''}
                onChange={(e) => onChange('propertyAddress', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : errors.propertyAddress ? 'border-red-500' : ''}
                placeholder="Enter full property address"
              />
            </FormField>
          </div>
          <FormField label="Property Type">
            <PropertyTypeSelect
              value={details.propertyType || ''}
              onChange={(v) => onChange('propertyType', v)}
              isReadOnly={isReadOnly}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Size">
              <Input
                value={details.propertySize || ''}
                onChange={(e) => onChange('propertySize', e.target.value.replace(/[^0-9.]/g, ''))}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
                placeholder="240"
              />
            </FormField>
            <FormField label="Unit">
              <AreaUnitSelect
                value={details.propertySizeUnit || ''}
                onChange={(v) => onChange('propertySizeUnit', v)}
                isReadOnly={isReadOnly}
              />
            </FormField>
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Financial Details</legend>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <FormField label="Sale Price (PKR)" required error={errors.salePrice}>
            <Input
              type="text"
              inputMode="decimal"
              value={details.salePrice != null && details.salePrice !== '' ? String(details.salePrice) : ''}
              onChange={(e) => {
                const sanitized = sanitizeFinancialInput(e.target.value);
                onChange('salePrice', getFinancialFieldValue(sanitized, details.salePrice));
              }}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.salePrice ? 'border-red-500' : ''}
              placeholder="Positive numbers only"
            />
          </FormField>
          <FormField label="Token Money (PKR)" error={errors.tokenMoney}>
            <Input
              type="text"
              inputMode="decimal"
              value={details.tokenMoney != null && details.tokenMoney !== '' ? String(details.tokenMoney) : ''}
              onChange={(e) => {
                const sanitized = sanitizeFinancialInput(e.target.value);
                onChange('tokenMoney', getFinancialFieldValue(sanitized, details.tokenMoney));
              }}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.tokenMoney ? 'border-red-500' : ''}
              placeholder="Positive numbers only"
            />
          </FormField>
          <div>
            <Label className="text-sm mb-2 block">Remaining (PKR)</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={details.remainingAmount != null ? String(details.remainingAmount) : ''}
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
  onChange,
  errors,
  FormField,
}: {
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
  errors: DocumentDetailsErrors;
  FormField: typeof FormFieldWithError;
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

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Landlord Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Full Name" required error={errors.landlordName}>
            <Input
              value={details.landlordName || ''}
              onChange={(e) => onChange('landlordName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.landlordName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="Father's Name" error={errors.landlordFatherName}>
            <Input
              value={details.landlordFatherName || ''}
              onChange={(e) => onChange('landlordFatherName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.landlordFatherName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="CNIC Number" error={errors.landlordCNIC}>
            <Input
              value={details.landlordCNIC || ''}
              onChange={(e) => onChange('landlordCNIC', formatCNICInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.landlordCNIC ? 'border-red-500' : ''}
              placeholder="12345-1234567-1"
              maxLength={15}
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={details.landlordAddress || ''}
              onChange={(e) => onChange('landlordAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter landlord's address"
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Tenant Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Full Name" required error={errors.tenantName}>
            <Input
              value={details.tenantName || ''}
              onChange={(e) => onChange('tenantName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.tenantName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="Father's Name" error={errors.tenantFatherName}>
            <Input
              value={details.tenantFatherName || ''}
              onChange={(e) => onChange('tenantFatherName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.tenantFatherName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="CNIC Number" error={errors.tenantCNIC}>
            <Input
              value={details.tenantCNIC || ''}
              onChange={(e) => onChange('tenantCNIC', formatCNICInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.tenantCNIC ? 'border-red-500' : ''}
              placeholder="12345-1234567-1"
              maxLength={15}
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={details.tenantAddress || ''}
              onChange={(e) => onChange('tenantAddress', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="Enter tenant's address"
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Property Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <FormField label="Property Address" required error={errors.propertyAddress}>
              <Input
                value={details.propertyAddress || ''}
                onChange={(e) => onChange('propertyAddress', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : errors.propertyAddress ? 'border-red-500' : ''}
                placeholder="Enter property address"
              />
            </FormField>
          </div>
          <FormField label="Property Type">
            <PropertyTypeSelect
              value={details.propertyType || ''}
              onChange={(v) => onChange('propertyType', v)}
              isReadOnly={isReadOnly}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Size">
              <Input
                value={details.propertySize || ''}
                onChange={(e) => onChange('propertySize', e.target.value.replace(/[^0-9.]/g, ''))}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
                placeholder="1200"
              />
            </FormField>
            <FormField label="Unit">
              <AreaUnitSelect
                value={details.propertySizeUnit || ''}
                onChange={(v) => onChange('propertySizeUnit', v)}
                isReadOnly={isReadOnly}
              />
            </FormField>
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Rental Terms</legend>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <FormField label="Monthly Rent (PKR)" required error={errors.monthlyRent}>
            <Input
              type="text"
              inputMode="decimal"
              value={details.monthlyRent != null && details.monthlyRent !== '' ? String(details.monthlyRent) : ''}
              onChange={(e) => {
                const sanitized = sanitizeFinancialInput(e.target.value);
                onChange('monthlyRent', getFinancialFieldValue(sanitized, details.monthlyRent));
              }}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.monthlyRent ? 'border-red-500' : ''}
              placeholder="Positive numbers only"
            />
          </FormField>
          <FormField label="Security Deposit (PKR)" error={errors.securityDeposit}>
            <Input
              type="text"
              inputMode="decimal"
              value={details.securityDeposit != null && details.securityDeposit !== '' ? String(details.securityDeposit) : ''}
              onChange={(e) => {
                const sanitized = sanitizeFinancialInput(e.target.value);
                onChange('securityDeposit', getFinancialFieldValue(sanitized, details.securityDeposit));
              }}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.securityDeposit ? 'border-red-500' : ''}
              placeholder="Positive numbers only"
            />
          </FormField>
          <FormField label="Lease Period">
            <Input
              value={details.leasePeriod || ''}
              onChange={(e) => onChange('leasePeriod', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : ''}
              placeholder="1 Year"
            />
          </FormField>
        </div>
      </fieldset>
    </div>
  );
}

// Property Disclosure Form
function PropertyDisclosureForm({
  details,
  isReadOnly,
  onChange,
  errors,
  FormField,
}: {
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
  errors: DocumentDetailsErrors;
  FormField: typeof FormFieldWithError;
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

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Property Owner Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Owner Name" required error={errors.ownerName}>
            <Input
              value={details.ownerName || ''}
              onChange={(e) => onChange('ownerName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.ownerName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="CNIC Number" error={errors.ownerCNIC}>
            <Input
              value={details.ownerCNIC || ''}
              onChange={(e) => onChange('ownerCNIC', formatCNICInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.ownerCNIC ? 'border-red-500' : ''}
              placeholder="12345-1234567-1"
              maxLength={15}
            />
          </FormField>
          <div className="col-span-2">
            <FormField label="Owner Address">
              <Input
                value={details.ownerAddress || ''}
                onChange={(e) => onChange('ownerAddress', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
                placeholder="Enter owner's address"
              />
            </FormField>
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Property Information</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <FormField label="Property Address" required error={errors.propertyAddress}>
              <Input
                value={details.propertyAddress || ''}
                onChange={(e) => onChange('propertyAddress', e.target.value)}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : errors.propertyAddress ? 'border-red-500' : ''}
                placeholder="Enter property address"
              />
            </FormField>
          </div>
          <FormField label="Property Type">
            <PropertyTypeSelect
              value={details.propertyType || ''}
              onChange={(v) => onChange('propertyType', v)}
              isReadOnly={isReadOnly}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Size">
              <Input
                value={details.propertySize || ''}
                onChange={(e) => onChange('propertySize', e.target.value.replace(/[^0-9.]/g, ''))}
                readOnly={isReadOnly}
                className={isReadOnly ? 'bg-gray-100' : ''}
                placeholder="240"
              />
            </FormField>
            <FormField label="Unit">
              <AreaUnitSelect
                value={details.propertySizeUnit || ''}
                onChange={(v) => onChange('propertySizeUnit', v)}
                isReadOnly={isReadOnly}
              />
            </FormField>
          </div>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Legal & Structural Status</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Ownership Status">
            <Input
              value={details.ownershipStatus || ''}
              onChange={(e) => onChange('ownershipStatus', e.target.value)}
              placeholder="e.g., Freehold, Leasehold"
            />
          </FormField>
          <FormField label="Legal Status">
            <Input
              value={details.legalStatus || ''}
              onChange={(e) => onChange('legalStatus', e.target.value)}
              placeholder="e.g., Clear, Disputed"
            />
          </FormField>
          <div className="col-span-2">
            <FormField label="Structural Condition">
              <Textarea
                value={details.structuralCondition || ''}
                onChange={(e) => onChange('structuralCondition', e.target.value)}
                placeholder="Describe the structural condition of the property"
                rows={3}
              />
            </FormField>
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// Stable property type dropdown – normalizes value to avoid Radix Select update loops
function PropertyTypeSelect({
  value,
  onChange,
  isReadOnly,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}) {
  const validValues = DOCUMENT_PROPERTY_TYPES.map((p) => p.value);
  const byLabel = value && DOCUMENT_PROPERTY_TYPES.find((p) => p.label.toLowerCase() === String(value).toLowerCase());
  const normalizedValue =
    value && validValues.includes(value) ? value : byLabel ? byLabel.value : '_none';

  const handleChange = (v: string) => {
    const next = v === '_none' ? '' : v;
    if (next !== value) onChange(next);
  };

  return (
    <Select
      value={normalizedValue}
      onValueChange={handleChange}
      disabled={isReadOnly}
    >
      <SelectTrigger className={isReadOnly ? 'bg-gray-100' : ''}>
        <SelectValue placeholder="Select property type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_none">Select property type</SelectItem>
        {DOCUMENT_PROPERTY_TYPES.map(({ value: optValue, label }) => (
          <SelectItem key={optValue} value={optValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Stable area unit dropdown – normalizes value to avoid Radix Select update loops
function AreaUnitSelect({
  value,
  onChange,
  isReadOnly,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}) {
  const validValues = DOCUMENT_AREA_UNITS.map((u) => u.value);
  const byLabel = value && DOCUMENT_AREA_UNITS.find((u) => u.label.toLowerCase() === String(value).toLowerCase());
  const normalizedValue =
    value && validValues.includes(value) ? value : byLabel ? byLabel.value : '_none';

  const handleChange = (v: string) => {
    const next = v === '_none' ? '' : v;
    if (next !== value) onChange(next);
  };

  return (
    <Select
      value={normalizedValue}
      onValueChange={handleChange}
      disabled={isReadOnly}
    >
      <SelectTrigger className={isReadOnly ? 'bg-gray-100' : ''}>
        <SelectValue placeholder="Select unit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_none">Select unit</SelectItem>
        {DOCUMENT_AREA_UNITS.map(({ value: optValue, label }) => (
          <SelectItem key={optValue} value={optValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Stable payment method dropdown – normalizes value to avoid Radix Select update loops
function PaymentMethodSelect({
  value,
  onChange,
  isReadOnly,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}) {
  const validValues = DOCUMENT_PAYMENT_METHODS.map((m) => m.value);
  const normalizedValue =
    value && validValues.includes(value) ? value : '_none';

  const handleChange = (v: string) => {
    const next = v === '_none' ? '' : v;
    if (next !== value) onChange(next);
  };

  return (
    <Select
      value={normalizedValue}
      onValueChange={handleChange}
      disabled={isReadOnly}
    >
      <SelectTrigger className={isReadOnly ? 'bg-gray-100' : ''}>
        <SelectValue placeholder="Select payment method" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_none">Select payment method</SelectItem>
        {DOCUMENT_PAYMENT_METHODS.map(({ value: optValue, label }) => (
          <SelectItem key={optValue} value={optValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Payment Receipt Form
function PaymentReceiptForm({
  details,
  isReadOnly,
  onChange,
  errors,
  FormField,
}: {
  details: DocumentDetails;
  isReadOnly: boolean;
  onChange: (field: keyof DocumentDetails, value: any) => void;
  errors: DocumentDetailsErrors;
  FormField: typeof FormFieldWithError;
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

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Receipt Information</legend>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <FormField label="Receipt Number" required error={errors.receiptNumber}>
            <Input
              value={details.receiptNumber || ''}
              onChange={(e) => onChange('receiptNumber', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.receiptNumber ? 'border-red-500' : ''}
              placeholder="e.g. RCP-12345"
            />
          </FormField>
          <FormField label="Payment Date" required error={errors.paymentDate}>
            <Input
              type="date"
              value={details.paymentDate || ''}
              onChange={(e) => onChange('paymentDate', e.target.value)}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.paymentDate ? 'border-red-500' : ''}
            />
          </FormField>
          <FormField label="Payment Amount (PKR)" required error={errors.paymentAmount}>
            <Input
              type="text"
              inputMode="decimal"
              value={details.paymentAmount != null && details.paymentAmount !== '' ? String(details.paymentAmount) : ''}
              onChange={(e) => {
                const sanitized = sanitizeFinancialInput(e.target.value);
                onChange('paymentAmount', getFinancialFieldValue(sanitized, details.paymentAmount));
              }}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.paymentAmount ? 'border-red-500' : ''}
              placeholder="Positive numbers only"
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Payer & Payee Details</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Payer Name" required error={errors.payerName}>
            <Input
              value={details.payerName || ''}
              onChange={(e) => onChange('payerName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.payerName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
          <FormField label="Payee Name" required error={errors.payeeName}>
            <Input
              value={details.payeeName || ''}
              onChange={(e) => onChange('payeeName', sanitizeNameInput(e.target.value))}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-100' : errors.payeeName ? 'border-red-500' : ''}
              placeholder="Letters and spaces only"
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded-lg p-4">
        <legend className="px-2 text-gray-900">Payment Details</legend>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Payment Method">
            <PaymentMethodSelect
              value={details.paymentMethod}
              onChange={(value) => onChange('paymentMethod', value)}
              isReadOnly={isReadOnly}
            />
          </FormField>
          <FormField label="Payment Purpose">
            <Input
              value={details.paymentPurpose || ''}
              onChange={(e) => onChange('paymentPurpose', e.target.value)}
              placeholder="e.g., Token money for property"
            />
          </FormField>
        </div>
      </fieldset>
    </div>
  );
}

// Step 2: Edit Clauses (same for all document types)
function Step2EditClauses({
  documentType,
  clauses,
  onClauseChange,
  onClauseTitleChange,
  onClauseDelete,
  onAddClause,
  onDragEnd,
  sensors
}: {
  documentType: DocumentType;
  clauses: DocumentClause[];
  onClauseChange: (id: string, content: string) => void;
  onClauseTitleChange: (id: string, title: string) => void;
  onClauseDelete: (id: string) => void;
  onAddClause: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors: any;
}) {
  const placeholderGuide = getPlaceholderGuideForDocumentType(documentType);
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
      {/* Expandable variables guide – document-specific placeholders only */}
      <details className="group rounded-lg border border-amber-200 bg-amber-50/80">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100/80 [&::-webkit-details-marker]:hidden">
          <span>
            Variables for this document
            {placeholderGuide.length > 0 && (
              <> (e.g. {placeholderGuide.slice(0, 2).map(({ variable }) => variable).join(', ')})</>
            )}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
        </summary>
        <div className="border-t border-amber-200 px-4 pb-4 pt-3">
          <p className="mb-3 text-sm text-amber-900">
            Type these in your clause text; they will be replaced with details from Step 1 when the PDF is generated.
          </p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_1fr_auto_1fr]">
            {placeholderGuide.map(({ variable, description }) => (
              <React.Fragment key={variable}>
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-medium text-amber-800">
                  {variable}
                </code>
                <span className="text-amber-800">{description}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </details>

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
                onClauseTitleChange={onClauseTitleChange}
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
  onClauseTitleChange,
  onClauseDelete
}: {
  clause: DocumentClause;
  onClauseChange: (id: string, content: string) => void;
  onClauseTitleChange: (id: string, title: string) => void;
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label className="sr-only">Clause Title</Label>
              <Input
                value={clause.title}
                onChange={(e) => onClauseTitleChange(clause.id, e.target.value)}
                className="font-semibold text-gray-900 border-gray-200 bg-white hover:border-blue-400 focus:border-blue-500 transition-colors h-9"
                placeholder="Clause Title"
              />
            </div>
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

  const handleDownload = async () => {
    const element = document.getElementById('document-preview-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${documentType}-${Date.now()}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="space-y-4">

      {/* Document Preview */}
      <Card id="document-preview-content" className="p-8 bg-white max-w-4xl mx-auto" style={{ fontFamily: 'serif' }}>
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