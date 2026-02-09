/**
 * RunCustomReportModal Component
 * 
 * Modal to run a saved custom report template and display results.
 * Allows export to CSV/PDF.
 * 
 * Design System V4.1 Compliant
 */

import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { CustomReportTemplate, CustomGeneratedReport } from '../../../../types/custom-reports';
import { User } from '../../../../types';
import { generateReport, incrementReportGeneration } from '../../../../lib/custom-report-builder';
import { addReportHistoryEntry } from '../../../../lib/report-history';
import { exportToCSV } from '../../../../lib/exportUtils';
import { Download, FileText, Table, Loader2, BarChart3, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { ReportChart } from './ReportChart';
import { ReportDistributionModal } from './ReportDistributionModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';

interface RunCustomReportModalProps {
  open: boolean;
  onClose: () => void;
  template: CustomReportTemplate | null;
  user: User;
}

export const RunCustomReportModal: React.FC<RunCustomReportModalProps> = ({
  open,
  onClose,
  template,
  user,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);

  // Generate report data
  const report = useMemo(() => {
    if (!template) return null;

    try {
      const startTime = performance.now();
      const generated = generateReport(template.config, user.id, user.role);
      const executionTime = performance.now() - startTime;

      // Update generation count
      incrementReportGeneration(template.id);

      // Add to history
      addReportHistoryEntry(generated, 'manual', executionTime);

      return generated;
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
      return null;
    }
  }, [template, user]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!report || !template) return;

    setIsExporting(true);
    try {
      // Transform report data to CSV format
      const csvData = report.data.rows.map(row => {
        const transformedRow: any = {};
        report.columns.forEach(col => {
          transformedRow[col.label] = row[col.id];
        });
        return transformedRow;
      });

      exportToCSV(csvData, `${template.name}_${new Date().toISOString().split('T')[0]}`);
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF (placeholder)
  const handleExportPDF = () => {
    toast.info('PDF export coming soon!');
  };

  if (!template || !report) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <div>{template.name}</div>
                {template.description && (
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Report Stats */}
          <div className="grid grid-cols-4 gap-4 py-4 border-y">
            <div className="text-center">
              <div className="text-2xl text-gray-900">{report.data.rowCount}</div>
              <div className="text-sm text-gray-500">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-gray-900">{report.columns.length}</div>
              <div className="text-sm text-gray-500">Columns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-gray-900">{template.config.dataSources.length}</div>
              <div className="text-sm text-gray-500">Data Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-gray-900">{template.config.filters?.length || 0}</div>
              <div className="text-sm text-gray-500">Filters</div>
            </div>
          </div>

          {/* Report Content with Tabs */}
          <Tabs defaultValue="table" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="table"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
                <Table className="h-4 w-4 mr-2" />
                Table View
              </TabsTrigger>
              {template.config.chart?.enabled && (
                <TabsTrigger
                  value="chart"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Chart View
                </TabsTrigger>
              )}
            </TabsList>

            {/* Table View */}
            <TabsContent value="table" className="flex-1 overflow-auto border rounded-lg mt-4">
              <table className="w-full">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    {report.columns.map(column => (
                      <th
                        key={column.id}
                        className="px-4 py-3 text-left text-gray-900 whitespace-nowrap"
                        style={{ textAlign: column.align || 'left' }}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.data.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={report.columns.length}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No data matches the specified filters
                      </td>
                    </tr>
                  ) : (
                    report.data.rows.map((row, index) => (
                      <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                        {report.columns.map(column => (
                          <td
                            key={column.id}
                            className="px-4 py-3 text-gray-700 whitespace-nowrap"
                            style={{ textAlign: column.align || 'left' }}
                          >
                            {row[column.id] !== null && row[column.id] !== undefined
                              ? String(row[column.id])
                              : '-'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TabsContent>

            {/* Chart View */}
            {template.config.chart?.enabled && (
              <TabsContent value="chart" className="flex-1 mt-4">
                <div className="h-96 border rounded-lg p-6 bg-white">
                  <ReportChart
                    data={report.data.rows}
                    columns={report.columns}
                    chartConfig={template.config.chart}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>

          {/* Footer Actions */}
          <DialogFooter className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-500">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={isExporting || report.data.rows.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={report.data.rows.length === 0}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDistributionModalOpen(true)}
                disabled={report.data.rows.length === 0}
              >
                <Mail className="h-4 w-4 mr-2" />
                Distribute
              </Button>
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReportDistributionModal
        open={isDistributionModalOpen}
        onClose={() => setIsDistributionModalOpen(false)}
        reportData={report.data.rows}
        template={template}
        user={user}
      />
    </>
  );
};