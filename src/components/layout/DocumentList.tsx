/**
 * DocumentList - Reusable document display and management
 * 
 * Features:
 * - File type icons
 * - Download/preview actions
 * - Upload functionality
 * - Categories/tags
 * - File size display
 * - Date uploaded
 * - User attribution
 * 
 * Usage:
 * <DocumentList
 *   documents={documents}
 *   canUpload={user.role === 'admin'}
 *   onUpload={handleUpload}
 *   onDownload={handleDownload}
 *   onPreview={handlePreview}
 *   onDelete={handleDelete}
 * />
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  FileText,
  File,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  Upload,
  Calendar,
  User,
  FileSpreadsheet,
  FileCode,
  Archive,
} from 'lucide-react';

export interface Document {
  id: string;
  name: string;
  type: string; // 'pdf', 'doc', 'docx', 'jpg', 'png', 'xlsx', etc.
  size: number; // in bytes
  uploadedDate: string;
  uploadedBy: string;
  category?: string;
  tags?: string[];
  url?: string;
}

export interface DocumentListProps {
  documents: Document[];
  title?: string;
  canUpload?: boolean;
  canDelete?: boolean;
  onUpload?: (files: FileList) => void;
  onDownload?: (document: Document) => void;
  onPreview?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function DocumentList({
  documents,
  title = 'Documents',
  canUpload = false,
  canDelete = false,
  onUpload,
  onDownload,
  onPreview,
  onDelete,
  emptyMessage = 'No documents uploaded yet',
  className = '',
}: DocumentListProps) {
  const [uploadKey, setUploadKey] = useState(0);

  // Get icon based on file type
  const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase();

    if (lowerType === 'pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    if (['doc', 'docx'].includes(lowerType)) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(lowerType)) {
      return <ImageIcon className="h-5 w-5 text-purple-600" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(lowerType)) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    }
    if (['zip', 'rar', '7z'].includes(lowerType)) {
      return <Archive className="h-5 w-5 text-orange-600" />;
    }
    if (['html', 'css', 'js', 'json', 'xml'].includes(lowerType)) {
      return <FileCode className="h-5 w-5 text-indigo-600" />;
    }
    return <File className="h-5 w-5 text-gray-600" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpload) {
      onUpload(e.target.files);
      // Reset input to allow uploading the same file again
      setUploadKey((prev) => prev + 1);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-[#030213]">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canUpload && onUpload && (
          <div>
            <input
              key={uploadKey}
              type="file"
              id="document-upload"
              className="hidden"
              onChange={handleFileChange}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            <Button
              size="sm"
              onClick={() => document.getElementById('document-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="divide-y divide-gray-200">
        {documents.length === 0 ? (
          <div className="p-8 text-center">
            <File className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* File Icon */}
                <div className="flex-shrink-0 mt-1">{getFileIcon(doc.type)}</div>

                {/* Document Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#030213] truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="uppercase">{doc.type}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(doc.uploadedDate)}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{doc.uploadedBy}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {onPreview && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPreview(doc)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onDownload && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDownload(doc)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(doc.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Category & Tags */}
                  {(doc.category || (doc.tags && doc.tags.length > 0)) && (
                    <div className="flex items-center gap-2 mt-2">
                      {doc.category && (
                        <Badge variant="secondary" className="text-xs">
                          {doc.category}
                        </Badge>
                      )}
                      {doc.tags &&
                        doc.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
