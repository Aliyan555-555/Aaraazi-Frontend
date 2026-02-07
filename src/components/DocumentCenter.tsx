/**
 * Document Center Dashboard
 * Main entry point for document generation (Option 1)
 */

import { useState } from 'react';
import { FileText, FileCheck, Home, AlertCircle, Receipt, Download, Trash2, Plus, Eye, Printer } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { DocumentGeneratorModal } from './DocumentGeneratorModal';
import { getGeneratedDocuments, deleteGeneratedDocument } from '../lib/documents';
import { DOCUMENT_TEMPLATES, DocumentType, GeneratedDocument } from '../types/documents';
import { toast } from 'sonner';
import { formatPKR } from '../lib/currency';

const iconMap = {
  FileText,
  FileCheck,
  Home,
  AlertCircle,
  Receipt
};

export function DocumentCenter() {
  const [documents, setDocuments] = useState<GeneratedDocument[]>(getGeneratedDocuments());
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentType | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<GeneratedDocument | null>(null);

  const handleTemplateClick = (templateId: DocumentType) => {
    setSelectedTemplate(templateId);
    setShowGenerator(true);
  };

  const handleDocumentGenerated = () => {
    setDocuments(getGeneratedDocuments());
    setShowGenerator(false);
    setSelectedTemplate(null);
  };

  const handleDelete = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        deleteGeneratedDocument(documentId);
        setDocuments(getGeneratedDocuments());
        toast.success('Document deleted successfully');
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const handleDownload = (document: GeneratedDocument) => {
    // In a real implementation, this would generate and download the PDF
    toast.info('Download functionality will be implemented with PDF generation');
  };

  const handlePreview = (document: GeneratedDocument) => {
    setPreviewDocument(document);
    setShowPreview(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl text-gray-900">Document Center</h1>
        <p className="text-gray-600 mt-1">
          Generate legal documents from templates or view recently created documents
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Template Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl text-gray-900">Create New Document from Template</h2>
            <p className="text-gray-600 mt-1">
              Select a template to start creating a new document
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {DOCUMENT_TEMPLATES.map((template) => {
              const Icon = iconMap[template.icon as keyof typeof iconMap];
              
              return (
                <Card
                  key={template.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500"
                  onClick={() => handleTemplateClick(template.id)}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateClick(template.id);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Documents Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl text-gray-900">Recently Generated Documents</h2>
            <p className="text-gray-600 mt-1">
              View and manage your previously created documents
            </p>
          </div>

          <Card>
            {documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Your generated documents will appear here.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Get started by selecting a template above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-900">
                        Document Name
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900">
                        Date Created
                      </th>
                      <th className="px-6 py-3 text-left text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents.map((doc) => {
                      const template = DOCUMENT_TEMPLATES.find(t => t.id === doc.documentType);
                      const Icon = template ? iconMap[template.icon as keyof typeof iconMap] : FileText;
                      
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-gray-900">
                                  {doc.documentName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {doc.details.buyerName && `Buyer: ${doc.details.buyerName}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {template?.name || doc.documentType}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {doc.propertyTitle || doc.details.propertyAddress || '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(doc.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(doc)}
                                title="Preview Document"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(doc.id)}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Document Generator Modal */}
      {showGenerator && selectedTemplate && (
        <DocumentGeneratorModal
          documentType={selectedTemplate}
          onClose={() => {
            setShowGenerator(false);
            setSelectedTemplate(null);
          }}
          onComplete={handleDocumentGenerated}
        />
      )}

      {/* Document Preview Modal */}
      {showPreview && previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => {
            setShowPreview(false);
            setPreviewDocument(null);
          }}
        />
      )}
    </div>
  );
}

// Helper function to replace placeholders with actual values
function replacePlaceholders(text: string, details: any): string {
  let result = text;
  
  // Replace all placeholders with actual values
  const replacements: Record<string, any> = {
    '[DATE]': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    '[SELLER_NAME]': details.sellerName || details.landlordName || details.ownerName || details.payeeName || '[Not Provided]',
    '[SELLER_FATHER_NAME]': details.sellerFatherName || details.landlordFatherName || '[Not Provided]',
    '[SELLER_CNIC]': details.sellerCNIC || details.landlordCNIC || details.ownerCNIC || '[Not Provided]',
    '[SELLER_ADDRESS]': details.sellerAddress || details.landlordAddress || details.ownerAddress || '[Not Provided]',
    '[BUYER_NAME]': details.buyerName || details.tenantName || details.payerName || '[Not Provided]',
    '[BUYER_FATHER_NAME]': details.buyerFatherName || details.tenantFatherName || '[Not Provided]',
    '[BUYER_CNIC]': details.buyerCNIC || details.tenantCNIC || '[Not Provided]',
    '[BUYER_ADDRESS]': details.buyerAddress || details.tenantAddress || '[Not Provided]',
    '[PROPERTY_ADDRESS]': details.propertyAddress || '[Not Provided]',
    '[PROPERTY_SIZE]': details.propertySize || '[Not Provided]',
    '[PROPERTY_UNIT]': details.propertySizeUnit || 'sq. ft.',
    '[PROPERTY_TYPE]': details.propertyType || '[Not Provided]',
    '[SALE_PRICE]': details.salePrice ? formatPKR(details.salePrice) : '[Not Provided]',
    '[TOKEN_MONEY]': details.tokenMoney ? formatPKR(details.tokenMoney) : '[Not Provided]',
    '[REMAINING_AMOUNT]': details.remainingAmount ? formatPKR(details.remainingAmount) : '[Not Provided]',
    '[MONTHLY_RENT]': details.monthlyRent ? formatPKR(details.monthlyRent) : '[Not Provided]',
    '[SECURITY_DEPOSIT]': details.securityDeposit ? formatPKR(details.securityDeposit) : '[Not Provided]',
    '[LEASE_PERIOD]': details.leasePeriod || '[Not Provided]',
    '[PAYMENT_AMOUNT]': details.paymentAmount ? formatPKR(details.paymentAmount) : '[Not Provided]',
    '[PAYMENT_DATE]': details.paymentDate || new Date().toLocaleDateString(),
    '[RECEIPT_NUMBER]': details.receiptNumber || '[Not Provided]',
    '[PAYMENT_METHOD]': details.paymentMethod || '[Not Provided]',
    '[START_DATE]': '[Start Date]',
    '[NOTICE_PERIOD]': '30'
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  return result;
}

// Document Preview Modal Component
function DocumentPreviewModal({
  document,
  onClose
}: {
  document: GeneratedDocument;
  onClose: () => void;
}) {
  const template = DOCUMENT_TEMPLATES.find(t => t.id === document.documentType);

  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog...');
  };

  const handleDownload = () => {
    toast.info('PDF download will be implemented with full PDF generation');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="!max-w-[85vw] w-[85vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-8 py-6 border-b border-gray-200">
          <DialogTitle className="text-xl text-gray-900">
            {document.documentName}
          </DialogTitle>
          <DialogDescription>
            Preview of generated document - Created on {new Date(document.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8">
          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
            <div>
              <h3 className="text-gray-900">Document Preview</h3>
              <p className="text-sm text-gray-600">Read-only view of the generated document</p>
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
                {document.clauses.map((clause) => (
                  <div key={clause.id} className="space-y-2">
                    <h3 className="text-gray-900 font-semibold">{clause.title}</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {replacePlaceholders(clause.content, document.details)}
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
                      {document.details.sellerName || document.details.landlordName || document.details.ownerName || document.details.payeeName || '[Party 1]'}
                    </p>
                    <p className="text-sm text-gray-600">Signature</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-900 w-48 mb-2"></div>
                    <p className="text-sm text-gray-700">
                      {document.details.buyerName || document.details.tenantName || document.details.payerName || '[Party 2]'}
                    </p>
                    <p className="text-sm text-gray-600">Signature</p>
                  </div>
                </div>

                {document.documentType !== 'payment-receipt' && (
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
                  Date: {new Date(document.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="px-8 py-6 border-t border-gray-200 flex items-center justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
