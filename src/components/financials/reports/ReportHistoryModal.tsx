import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Eye, Download, Trash2, FileText, Calendar, User, Search } from 'lucide-react';
import { ReportViewerData } from './ReportViewer';

interface ReportHistoryModalProps {
  open: boolean;
  onClose: () => void;
  templateName?: string;
  reports: ReportViewerData[];
  onViewReport: (report: ReportViewerData) => void;
  onDeleteReport: (reportId: string) => void;
}

/**
 * ReportHistoryModal Component
 * 
 * Shows history of generated reports with ability to view and delete.
 * Can be filtered to show all reports or just reports for a specific template.
 */
export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({
  open,
  onClose,
  templateName,
  reports,
  onViewReport,
  onDeleteReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Filter by template if specified
    if (templateName) {
      filtered = filtered.filter(r => r.templateName === templateName);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.templateName.toLowerCase().includes(query) ||
        r.generatedBy.toLowerCase().includes(query) ||
        new Date(r.dateFrom).toLocaleDateString().includes(query) ||
        new Date(r.dateTo).toLocaleDateString().includes(query)
      );
    }

    // Sort by generated date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }, [reports, templateName, searchQuery]);

  const handleDelete = (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this report from history?')) {
      onDeleteReport(reportId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {templateName ? `${templateName} - History` : 'All Reports History'}
          </DialogTitle>
          <DialogDescription>
            {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} generated
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reports by name, date, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reports List */}
        <div className="space-y-2 overflow-y-auto max-h-[500px]">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No reports found</p>
              {searchQuery && (
                <Button
                  variant="link"
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewReport(report)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="text-gray-900">{report.templateName}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' - '}
                          {new Date(report.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {report.generatedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-gray-500 mr-4">
                    <div>Generated</div>
                    <div>
                      {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' '}
                      {new Date(report.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewReport(report);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDelete(report.id, e)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
