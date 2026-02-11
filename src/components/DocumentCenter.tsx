/**
 * Document Center Dashboard
 * Main entry point for document generation (Option 1)
 */

import { useState, useEffect } from 'react';
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
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentType | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<GeneratedDocument | null>(null);

  // Load documents on mount (client-only) to avoid SSR localStorage access
  useEffect(() => {
    setDocuments(getGeneratedDocuments());
  }, []);

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
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {doc.documentName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {doc.documentType.replace(/-/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {doc.propertyTitle || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(doc)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Document Generator Modal */}
      {selectedTemplate && (
        <DocumentGeneratorModal
          documentType={selectedTemplate}
          onClose={() => {
            setShowGenerator(false);
            setSelectedTemplate(null);
          }}
          onComplete={handleDocumentGenerated}
        />
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewDocument?.documentName}</DialogTitle>
            <DialogDescription>
              Document preview - {previewDocument?.documentType.replace(/-/g, ' ')}
            </DialogDescription>
          </DialogHeader>
          {previewDocument && (
            <div className="space-y-4 mt-4">
              <div className="bg-white border rounded-lg p-6 space-y-4">
                {previewDocument.clauses.map((clause) => (
                  <div key={clause.id}>
                    <h4 className="font-medium text-gray-900 mb-2">{clause.title}</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{clause.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleDownload(previewDocument)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
