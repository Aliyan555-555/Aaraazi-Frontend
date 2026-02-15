"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FileText, FileCheck, Home, AlertCircle, Receipt, Download, Trash2, Plus, Eye, Upload, Filter, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { DocumentGeneratorModal } from './DocumentGeneratorModal';
import { getGeneratedDocuments, deleteGeneratedDocument, replacePlaceholders } from '../lib/documents';
import { DOCUMENT_TEMPLATES, DocumentType, GeneratedDocument } from '../types/documents';
import { useDocuments, useDeleteDocument, useUploadDocument, useDownloadPdf } from '@/hooks/useDocuments';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

const iconMap = {
  FileText,
  FileCheck,
  Home,
  AlertCircle,
  Receipt
};

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  GENERATED: 'bg-blue-100 text-blue-800',
  SENT: 'bg-purple-100 text-purple-800',
  SIGNED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-yellow-100 text-yellow-800',
};

export function DocumentCenter() {
  const { tenantId, agencyId } = useAuthStore();
  const [localDocuments, setLocalDocuments] = useState<GeneratedDocument[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentType | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<GeneratedDocument | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryParams = useMemo(
    () => ({
      agencyId: agencyId ?? undefined,
      tenantId: tenantId ?? undefined,
      limit: 100,
    }),
    [agencyId, tenantId]
  );

  // Use professional Zustand hooks
  const { documents: apiDocuments, refetch } = useDocuments(queryParams);
  const { deleteDocument } = useDeleteDocument();
  const { uploadDocument, isLoading: uploadingFile } = useUploadDocument();
  const { downloadPdf, downloadingId } = useDownloadPdf();

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
      try {
        await deleteDocument(documentId);
      } catch (error) {
        // Error already handled in hook
        console.error('Delete failed:', error);
      }
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
      try {
        await downloadPdf(document.id, `${document.documentName.replace(/\s+/g, '-')}.pdf`);
      } catch (error) {
        // Error already handled in hook
        console.error('Download failed:', error);
      }
      return;
    }
    toast.info('Save this document to the server first to download a white-label PDF, or use Print from the preview.');
  };

  const handlePreview = (document: GeneratedDocument) => {
    setPreviewDocument(document);
    setShowPreview(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenantId || !agencyId) return;

    try {
      await uploadDocument(file, {
        documentName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        documentType: 'CUSTOM',
        agencyId,
        tenantId,
      });
      refetch();
    } catch (error) {
      // Error already handled in hook
      console.error('Upload failed:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredDocuments = useMemo(() => {
    if (statusFilter === 'all') return documents;
    return documents.filter(doc => doc.status === statusFilter);
  }, [documents, statusFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)));
    } else {
      setSelectedDocuments(new Set());
    }
  };

  const handleSelectDocument = (docId: string, checked: boolean) => {
    const newSelected = new Set(selectedDocuments);
    if (checked) {
      newSelected.add(docId);
    } else {
      newSelected.delete(docId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedDocuments.size} document(s)?`)) return;

    setBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const docId of selectedDocuments) {
      try {
        if (apiIds.has(docId)) {
          await deleteDocument(docId);
        } else {
          deleteGeneratedDocument(docId);
          setLocalDocuments(getGeneratedDocuments());
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    setBulkDeleting(false);
    setSelectedDocuments(new Set());

    if (successCount > 0) {
      toast.success(`${successCount} document(s) deleted successfully`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} document(s)`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl text-gray-900">Document Center</h1>
            <p className="text-gray-600 mt-1">
              Generate legal documents from templates or upload existing files
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile || !tenantId || !agencyId}
            >
              {uploadingFile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </div>
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
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl text-gray-900">Recently Generated Documents</h2>
              <p className="text-gray-600 mt-1">
                View and manage your previously created documents
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="GENERATED">Generated</option>
                <option value="SENT">Sent</option>
                <option value="SIGNED">Signed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <Card>
            {filteredDocuments.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {statusFilter === 'all'
                    ? 'Your generated documents will appear here.'
                    : `No documents with status "${statusFilter}"`}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {statusFilter === 'all'
                    ? 'Get started by selecting a template above or uploading a document.'
                    : 'Try selecting a different status filter.'}
                </p>
              </div>
            ) : (
              <>
                {selectedDocuments.size > 0 && (
                  <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                    <span className="text-sm text-blue-900 font-medium">
                      {selectedDocuments.size} document(s) selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                    >
                      {bulkDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Selected
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-gray-900">
                          Document Name
                        </th>
                        <th className="px-6 py-3 text-left text-gray-900">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-gray-900">
                          Status
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
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.has(doc.id)}
                              onChange={(e) => handleSelectDocument(doc.id, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 text-gray-900 font-medium">
                            {doc.documentName}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {doc.documentType.replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[doc.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                              {doc.status}
                            </span>
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
                                disabled={!!downloadingId}
                              >
                                {downloadingId === doc.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-1" />
                                    Download PDF
                                  </>
                                )}
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
              </>
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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{previewDocument.documentName}</DialogTitle>
              <DialogDescription>
                Document preview - {previewDocument.documentType.replace(/_/g, ' ')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden mt-4">
              {previewDocument.pdfUrl ? (
                <div className="h-full">
                  <iframe
                    src={previewDocument.pdfUrl.startsWith('http') ? previewDocument.pdfUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${previewDocument.pdfUrl}`}
                    className="w-full h-[600px] border rounded-lg"
                    title="Document Preview"
                  />
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[600px] flex justify-center">
                  <div className="bg-white border rounded-lg shadow-sm p-8 max-w-4xl w-full" style={{ fontFamily: 'serif' }}>
                    <div className="space-y-6">
                      <div className="text-center border-b-2 border-gray-900 pb-4">
                        <h1 className="text-2xl uppercase tracking-wide text-gray-900 font-bold">
                          {(DOCUMENT_TEMPLATES.find(t => t.id === previewDocument.documentType))?.name?.toUpperCase() ?? previewDocument.documentType.replace(/_/g, ' ').toUpperCase()}
                        </h1>
                      </div>
                      {previewDocument.clauses && previewDocument.clauses.length > 0 ? (
                        previewDocument.clauses
                          .slice()
                          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                          .map((clause) => (
                            <div key={clause.id} className="space-y-2">
                              <h3 className="text-gray-900 font-semibold">{clause.title}</h3>
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                                {replacePlaceholders(clause.content, previewDocument.details)}
                              </p>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          No preview available. Generate or download the PDF to view the document.
                        </p>
                      )}
                      <div className="mt-12 pt-8 border-t border-gray-300">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <div className="border-b border-gray-900 w-48 mb-2" />
                            <p className="text-sm text-gray-700">
                              {previewDocument.details?.sellerName || previewDocument.details?.landlordName || previewDocument.details?.ownerName || previewDocument.details?.payeeName || '[Party 1]'}
                            </p>
                            <p className="text-sm text-gray-600">Signature</p>
                          </div>
                          <div>
                            <div className="border-b border-gray-900 w-48 mb-2" />
                            <p className="text-sm text-gray-700">
                              {previewDocument.details?.buyerName || previewDocument.details?.tenantName || previewDocument.details?.payerName || '[Party 2]'}
                            </p>
                            <p className="text-sm text-gray-600">Signature</p>
                          </div>
                        </div>
                        {previewDocument.documentType !== 'payment-receipt' && (
                          <div className="mt-8 grid grid-cols-2 gap-8">
                            <div>
                              <div className="border-b border-gray-900 w-48 mb-2" />
                              <p className="text-sm text-gray-600">Witness 1</p>
                            </div>
                            <div>
                              <div className="border-b border-gray-900 w-48 mb-2" />
                              <p className="text-sm text-gray-600">Witness 2</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-8 text-right">
                        <p className="text-sm text-gray-600">
                          Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleDownload(previewDocument)}
                disabled={!!downloadingId}
              >
                {downloadingId === previewDocument.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
