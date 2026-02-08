/**
 * Document List Component
 * Display and manage deal documents
 */

import React, { useState } from 'react';
import { Deal, DealDocument } from '../../types/deals';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PermissionGate } from './PermissionGate';
import {
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface DocumentListProps {
  deal: Deal;
  currentUserId: string;
  onUploadDocument?: () => void;
  onViewDocument?: (document: DealDocument) => void;
  onDownloadDocument?: (document: DealDocument) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  deal,
  currentUserId,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument
}) => {
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter documents
  const filteredDocuments = deal.documents.filter(doc => {
    // Stage filter
    if (filterStage !== 'all' && doc.stage !== filterStage) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all' && doc.status !== filterStatus) {
      return false;
    }

    return true;
  });

  // Group by status
  const requiredDocs = filteredDocuments.filter(d => d.status === 'pending' && d.required);
  const uploadedDocs = filteredDocuments.filter(d => d.status === 'uploaded');
  const verifiedDocs = filteredDocuments.filter(d => d.status === 'verified');

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({filteredDocuments.length})
            </CardTitle>

            <PermissionGate
              deal={deal}
              userId={currentUserId}
              permission="canUploadDocuments"
              showMessage={false}
            >
              <Button onClick={onUploadDocument} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </PermissionGate>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Stage Filter */}
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="offer-accepted">Offer Accepted</SelectItem>
                <SelectItem value="agreement-signing">Agreement Signing</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="payment-processing">Payment Processing</SelectItem>
                <SelectItem value="handover-preparation">Handover Prep</SelectItem>
                <SelectItem value="transfer-registration">Transfer Registration</SelectItem>
                <SelectItem value="final-handover">Final Handover</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-orange-600">{requiredDocs.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Required</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-blue-600">{uploadedDocs.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Uploaded</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-green-600">{verifiedDocs.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Verified</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      <Card>
        <CardContent className="pt-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map(doc => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  deal={deal}
                  currentUserId={currentUserId}
                  onView={onViewDocument}
                  onDownload={onDownloadDocument}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Document Item Component
interface DocumentItemProps {
  document: DealDocument;
  deal: Deal;
  currentUserId: string;
  onView?: (document: DealDocument) => void;
  onDownload?: (document: DealDocument) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  document,
  deal,
  currentUserId,
  onView,
  onDownload
}) => {
  const getStatusColor = (status: DealDocument['status'], required: boolean) => {
    if (status === 'pending' && required) return 'bg-orange-100 text-orange-800';
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: DealDocument['status'], required: boolean) => {
    if (status === 'pending' && required) return <AlertCircle className="h-4 w-4" />;
    switch (status) {
      case 'uploaded': return <Clock className="h-4 w-4" />;
      case 'verified': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStageDisplay = (stage: string) => {
    return stage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const isUploaded = document.status === 'uploaded' || document.status === 'verified';

  return (
    <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left Side */}
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="mt-1">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Document Info */}
          <div className="flex-1 space-y-2">
            {/* Name & Status */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium">{document.name}</h4>
              <Badge className={`${getStatusColor(document.status, document.required)} gap-1 flex-shrink-0`}>
                {getStatusIcon(document.status, document.required)}
                {document.status === 'pending' && document.required ? 'Required' : document.status}
              </Badge>
            </div>

            {/* Type & Stage */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Type: {document.type}</span>
              <span>Stage: {document.stage ? getStageDisplay(document.stage) : 'N/A'}</span>
            </div>

            {/* Upload Info */}
            {isUploaded && (
              <div className="text-xs text-muted-foreground">
                {document.uploadedByName && (
                  <div>Uploaded by: {document.uploadedByName}</div>
                )}
                {document.uploadedAt && (
                  <div>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</div>
                )}
              </div>
            )}

            {/* Verification Info - Removed as verifiedBy/verifiedAt not in type */}
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {isUploaded && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView?.(document)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload?.(document)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </>
          )}

          {document.status === 'pending' && document.required && (
            <PermissionGate
              deal={deal}
              userId={currentUserId}
              permission="canUploadDocuments"
              showMessage={false}
            >
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </PermissionGate>
          )}
        </div>
      </div>
    </div>
  );
};
