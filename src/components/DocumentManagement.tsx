import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import {
  FileText,
  Download,
  Plus,
  Search,
  Calendar,
  User,
  Home,
  Receipt,
  MapPin,
  Edit,
  Eye,
  Trash2,
  Share2
} from 'lucide-react';
import { User as UserType } from '../types';
import { toast } from 'sonner';

interface DocumentManagementProps {
  user: UserType;
}

interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'date';
    required: boolean;
  }>;
}

interface ManagedDocument {
  id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'sent';
  data: Record<string, any>;
  tags: string[];
  createdBy: string;
}

const quickTemplates: DocumentTemplate[] = [
  {
    id: 'rental-agreement',
    title: 'Rental Agreement',
    description: 'Standard residential rental lease agreement',
    icon: Home,
    category: 'agreement',
    fields: [
      { name: 'landlordName', label: 'Landlord Name', type: 'text', required: true },
      { name: 'tenantName', label: 'Tenant Name', type: 'text', required: true },
      { name: 'propertyAddress', label: 'Property Address', type: 'textarea', required: true },
      { name: 'monthlyRent', label: 'Monthly Rent Amount', type: 'number', required: true },
      { name: 'securityDeposit', label: 'Security Deposit', type: 'number', required: true },
      { name: 'leaseStartDate', label: 'Lease Start Date', type: 'date', required: true },
      { name: 'leaseEndDate', label: 'Lease End Date', type: 'date', required: true }
    ]
  },
  {
    id: 'sale-agreement',
    title: 'Sale Agreement',
    description: 'Property purchase and sale agreement',
    icon: FileText,
    category: 'agreement',
    fields: [
      { name: 'sellerName', label: 'Seller Name', type: 'text', required: true },
      { name: 'buyerName', label: 'Buyer Name', type: 'text', required: true },
      { name: 'propertyAddress', label: 'Property Address', type: 'textarea', required: true },
      { name: 'salePrice', label: 'Sale Price', type: 'number', required: true },
      { name: 'closingDate', label: 'Closing Date', type: 'date', required: true }
    ]
  },
  {
    id: 'payment-receipt',
    title: 'Payment Receipt',
    description: 'Receipt for rent and property payments',
    icon: Receipt,
    category: 'receipt',
    fields: [
      { name: 'payerName', label: 'Payer Name', type: 'text', required: true },
      { name: 'payeeName', label: 'Payee Name', type: 'text', required: true },
      { name: 'amount', label: 'Payment Amount', type: 'number', required: true },
      { name: 'paymentDate', label: 'Payment Date', type: 'date', required: true },
      { name: 'paymentMethod', label: 'Payment Method', type: 'text', required: true }
    ]
  },
  {
    id: 'property-disclosure',
    title: 'Property Disclosure',
    description: 'Property condition and disclosure statement',
    icon: MapPin,
    category: 'disclosure',
    fields: [
      { name: 'propertyAddress', label: 'Property Address', type: 'textarea', required: true },
      { name: 'ownerName', label: 'Property Owner Name', type: 'text', required: true },
      { name: 'yearBuilt', label: 'Year Built', type: 'number', required: true },
      { name: 'knownDefects', label: 'Known Defects or Issues', type: 'textarea', required: true },
      { name: 'disclosureDate', label: 'Disclosure Date', type: 'date', required: true }
    ]
  }
];

const generateDocumentContent = (template: DocumentTemplate, data: Record<string, any>): string => {
  let content = `${template.title.toUpperCase()}\n\n`;

  template.fields.forEach(field => {
    const value = data[field.name] || '[Not provided]';
    content += `${field.label}: ${value}\n`;
  });

  content += `\nGenerated on: ${new Date().toLocaleDateString()}\n`;
  content += `Created by: ${data.createdBy || 'System'}\n`;

  return content;
};

const loadDocuments = (): ManagedDocument[] => {
  const stored = localStorage.getItem('estatemanager_documents');
  if (stored) {
    return JSON.parse(stored);
  }

  const defaultDocs: ManagedDocument[] = [
    {
      id: '1',
      title: 'Rental Agreement - 123 Main St',
      templateId: 'rental-agreement',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      status: 'completed',
      tags: ['residential', 'lease'],
      createdBy: 'John Smith',
      data: {
        landlordName: 'John Smith',
        tenantName: 'Jane Doe',
        propertyAddress: '123 Main St, Anytown, ST 12345',
        monthlyRent: 2500,
        securityDeposit: 2500,
        leaseStartDate: '2024-02-01',
        leaseEndDate: '2025-02-01'
      }
    }
  ];

  localStorage.setItem('estatemanager_documents', JSON.stringify(defaultDocs));
  return defaultDocs;
};

const saveDocuments = (documents: ManagedDocument[]) => {
  localStorage.setItem('estatemanager_documents', JSON.stringify(documents));
};

export const DocumentManagement: React.FC<DocumentManagementProps> = ({ user }) => {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<{ template: DocumentTemplate; data: Record<string, any> } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    setDocuments(loadDocuments());
  }, []);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleGenerateDocument = () => {
    if (!selectedTemplate) return;

    // Validate required fields
    const missingFields = selectedTemplate.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    const newDocument: ManagedDocument = {
      id: Date.now().toString(),
      title: `${selectedTemplate.title} - ${formData.propertyAddress || 'New Document'}`,
      templateId: selectedTemplate.id,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      status: 'completed',
      tags: ['generated'],
      createdBy: user.name,
      data: { ...formData, createdBy: user.name }
    };

    const updatedDocuments = [newDocument, ...documents];
    setDocuments(updatedDocuments);
    saveDocuments(updatedDocuments);

    // Show dynamic document preview (actual content, not demo)
    setPreviewPayload({ template: selectedTemplate, data: newDocument.data });
    setIsPreviewOpen(true);

    // Reset form
    setIsDialogOpen(false);
    setFormData({});
    setSelectedTemplate(null);

    toast.success('Document generated successfully!');
  };

  const handleDownloadDocument = (managedDoc: ManagedDocument) => {
    const template = quickTemplates.find(t => t.id === managedDoc.templateId);
    if (!template) {
      toast.error('Template not found');
      return;
    }

    const content = generateDocumentContent(template, managedDoc.data);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${managedDoc.title}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Document downloaded successfully!');
  };

  const handlePreviewDocument = (managedDoc: ManagedDocument) => {
    const template = quickTemplates.find(t => t.id === managedDoc.templateId);
    if (!template) {
      toast.error('Template not found');
      return;
    }

    setPreviewPayload({ template, data: managedDoc.data });
    setIsPreviewOpen(true);
  };

  const handleDeleteDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    saveDocuments(updatedDocuments);
    toast.success('Document deleted successfully!');
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      sent: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Document Management</h1>
          <p className="text-gray-600">Create and manage property documents</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Templates
          </CardTitle>
          <CardDescription>
            Generate professional documents instantly with pre-built templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsDialogOpen(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{template.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {template.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document History ({filteredDocuments.length})
          </CardTitle>
          <CardDescription>
            Previously generated documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p>No documents found</p>
              <p className="text-sm">Create your first document using the templates above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{doc.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created: {doc.createdAt}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          By: {doc.createdBy}
                        </div>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {doc.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewDocument(doc)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Document Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.icon && <selectedTemplate.icon className="h-5 w-5" />}
              {selectedTemplate?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedTemplate(null);
                  setFormData({});
                }}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateDocument}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog – actual dynamic PDF-style preview */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => { if (!open) setPreviewPayload(null); setIsPreviewOpen(open); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription>
              Preview of the generated document (actual content)
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 border rounded-lg">
            <div className="p-6 bg-white" style={{ fontFamily: 'serif' }}>
              {previewPayload ? (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="text-center border-b-2 border-gray-900 pb-4">
                    <h1 className="text-2xl uppercase tracking-wide text-gray-900 font-bold">
                      {previewPayload.template.title.toUpperCase()}
                    </h1>
                  </div>
                  <div className="space-y-4">
                    {previewPayload.template.fields.map((field) => (
                      <div key={field.name} className="space-y-1">
                        <h3 className="text-gray-900 font-semibold text-sm">{field.label}</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {previewPayload.data[field.name] ?? '[Not provided]'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-12 pt-8 border-t border-gray-300">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="border-b border-gray-900 w-48 mb-2" />
                        <p className="text-sm text-gray-600">Party 1 / Authorized Signatory</p>
                      </div>
                      <div>
                        <div className="border-b border-gray-900 w-48 mb-2" />
                        <p className="text-sm text-gray-600">Party 2 / Witness</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 text-right text-sm text-gray-600">
                    <p>Generated on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p>Created by: {previewPayload.data.createdBy || '—'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No preview data.</p>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setPreviewPayload(null); setIsPreviewOpen(false); }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};