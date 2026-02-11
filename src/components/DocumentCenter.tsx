"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, FileCheck, Home, AlertCircle, Receipt, Download, Trash2, Plus, Eye } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { DocumentGeneratorModal } from './DocumentGeneratorModal';
import { getGeneratedDocuments, deleteGeneratedDocument } from '../lib/documents';
import { DOCUMENT_TEMPLATES, DocumentType, GeneratedDocument } from '../types/documents';
import { useDocumentsApi } from '@/modules/documents';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

const iconMap = {
  FileText,
  FileCheck,
  Home,
  AlertCircle,
  Receipt
};

export function DocumentCenter() {
  const { tenantId, agencyId } = useAuthStore();
  const [localDocuments, setLocalDocuments] = useState<GeneratedDocument[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentType | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<GeneratedDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      agencyId: agencyId ?? undefined,
      tenantId: tenantId ?? undefined,
      limit: 100,
    }),
    [agencyId, tenantId]
  );

  const { documents: apiDocuments, downloadPdf, remove: removeApi, refetch } = useDocumentsApi(queryParams);

  const apiIds = useMemo(() => new Set(apiDocuments.map((d) => d.id)), [apiDocuments]);

  // Merge API docs (first) with local-only docs; avoid duplicates by id
  const documents = useMemo(() => {
    const seen = new Set<string>();
    const out: GeneratedDocument[] = [];
    apiDocuments.forEach((d) => {
      seen.add(d.id);
      out.push(d);
    });
    localDocuments.forEach((d) => {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        out.push(d);
      }
    });
    return out;
  }, [apiDocuments, localDocuments]);

  useEffect(() => {
    setLocalDocuments(getGeneratedDocuments());
  }, []);

  const handleTemplateClick = (templateId: DocumentType) => {
    setSelectedTemplate(templateId);
    setShowGenerator(true);
  };

  const handleDocumentGenerated = useCallback(() => {
    setLocalDocuments(getGeneratedDocuments());
    refetch();
    setShowGenerator(false);
    setSelectedTemplate(null);
  }, [refetch]);

  const handleCloseGenerator = useCallback(() => {
    setShowGenerator(false);
    setSelectedTemplate(null);
  }, []);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    if (apiIds.has(documentId)) {
      const ok = await removeApi(documentId);
        if (ok) toast.success('Document deleted');
        else toast.error('Failed to delete document');
      return;
    }
    try {
      deleteGeneratedDocument(documentId);
      setLocalDocuments(getGeneratedDocuments());
      toast.success('Document deleted successfully');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async (document: GeneratedDocument) => {
    if (apiIds.has(document.id)) {
      setDownloadingId(document.id);
      try {
        const ok = await downloadPdf(document.id, `${document.documentName.replace(/\s+/g, '-')}.pdf`);
        if (ok) toast.success('PDF downloaded');
        else toast.error('Download failed');
      } finally {
        setDownloadingId(null);
      }
      return;
    }
    toast.info('Save this document to the server first to download a white-label PDF, or use Print from the preview.');
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
                              disabled={downloadingId === doc.id}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              {downloadingId === doc.id ? 'Generating…' : 'Download PDF'}
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

      {/* Single Dialog in tree: open state and content change, no mount/unmount of Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && handleCloseGenerator()}>
        <DialogContent className="!max-w-[85vw] w-[85vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {selectedTemplate && (
            <DocumentGeneratorModal
              key={selectedTemplate}
              documentType={selectedTemplate}
              onClose={handleCloseGenerator}
              onComplete={handleDocumentGenerated}
              asContent
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - only mount when open to avoid Radix ref/presence update loops */}
      {showPreview && previewDocument && (
        <Dialog open={true} onOpenChange={(open) => !open && setShowPreview(false)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewDocument.documentName}</DialogTitle>
              <DialogDescription>
                Document preview - {previewDocument.documentType.replace(/-/g, ' ')}
              </DialogDescription>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
