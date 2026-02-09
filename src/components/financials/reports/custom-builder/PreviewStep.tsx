/**
 * PreviewStep Component
 * 
 * Step 5 of custom report builder - Preview report and save template.
 */

import React, { useMemo } from 'react';
import { ReportConfiguration } from '../../../../types/custom-reports';
import { User } from '../../../../types';
import { generateReport } from '../../../../lib/custom-report-builder';
import { Eye, Download } from 'lucide-react';
import { Button } from '../../../ui/button';

interface PreviewStepProps {
  config: Partial<ReportConfiguration>;
  onChange: (updates: Partial<ReportConfiguration>) => void;
  user: User;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({
  config,
  onChange,
  user,
}) => {
  // Generate preview data
  const previewReport = useMemo(() => {
    try {
      if (!config.dataSources || !config.fields || config.fields.length === 0) {
        return null;
      }

      const report = generateReport(
        config as ReportConfiguration,
        user.id,
        user.role
      );

      // Limit to first 10 rows for preview
      const rows = report.data.rows;
      return {
        ...report,
        data: rows.slice(0, 10),
        isLimited: rows.length > 10,
        rowCount: rows.length,
      };
    } catch (error) {
      console.error('Error generating preview:', error);
      return null;
    }
  }, [config, user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-gray-900">Report Preview</h3>
        <p className="text-gray-600">
          Preview your report configuration below. Enter a name and save to create a reusable template.
        </p>
      </div>

      {/* Configuration Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Data Sources</div>
          <div className="text-gray-900">
            {config.dataSources?.length || 0}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Fields Selected</div>
          <div className="text-gray-900">
            {config.fields?.length || 0}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Filters Applied</div>
          <div className="text-gray-900">
            {config.filters?.length || 0}
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {previewReport ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-600" />
              <span className="text-gray-900">
                Preview (showing first 10 rows of {previewReport.rowCount} total)
              </span>
            </div>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Preview
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {previewReport.columns.map(column => (
                    <th
                      key={column.id}
                      className="px-4 py-3 text-left text-gray-900"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewReport.data.map((row, index) => (
                  <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                    {previewReport.columns.map(column => (
                      <td
                        key={column.id}
                        className="px-4 py-3 text-gray-700"
                      >
                        {row[column.id] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <p className="text-gray-600">
            Unable to generate preview. Please check your configuration.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-900 mb-2">Next Steps:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Enter a name for your report template above</li>
          <li>Optionally add a description</li>
          <li>Click "Save Template" to save for future use</li>
          <li>Your template will appear in the Custom Reports section</li>
        </ol>
      </div>
    </div>
  );
};