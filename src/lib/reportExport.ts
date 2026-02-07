/**
 * Report Export Utilities
 * 
 * Provides comprehensive export functionality for reports
 * Supports PDF, Excel, and CSV formats
 * 
 * @module lib/reportExport
 * @version 1.0.0
 */

import { GeneratedReport, ReportColumn } from '../types/reports';
import { formatPKR } from './currency';
import { formatDate } from './validation';

/**
 * Export formats
 */
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

/**
 * Format cell value based on column type
 */
function formatCellValue(value: any, columnId: string): string {
  if (value === null || value === undefined) return '';
  
  // Check if it's a currency field
  if (columnId.toLowerCase().includes('revenue') || 
      columnId.toLowerCase().includes('commission') ||
      columnId.toLowerCase().includes('value') ||
      columnId.toLowerCase().includes('price') ||
      columnId.toLowerCase().includes('amount')) {
    return formatPKR(Number(value));
  }
  
  // Check if it's a date field
  if (columnId.toLowerCase().includes('date') ||
      columnId.toLowerCase().includes('createdat') ||
      columnId.toLowerCase().includes('updatedat')) {
    return formatDate(value);
  }
  
  // Check if it's a percentage
  if (columnId.toLowerCase().includes('rate') ||
      columnId.toLowerCase().includes('percent')) {
    return `${Number(value).toFixed(1)}%`;
  }
  
  return String(value);
}

/**
 * Export report as CSV
 */
export function exportAsCSV(report: GeneratedReport): void {
  try {
    // Validate data
    if (!report || !report.config || !report.config.columns) {
      throw new Error('Invalid report configuration');
    }
    
    if (!report.data || !Array.isArray(report.data)) {
      throw new Error('Report data is empty or invalid');
    }
    
    const columns = report.config.columns;
    const data = report.data;
    
    // Create CSV header
    const headers = columns.map(col => col.label).join(',');
    
    // Create CSV rows
    const rows = data.map(row => {
      return columns.map(col => {
        const value = formatCellValue(row[col.id], col.id);
        // Escape quotes and wrap in quotes if contains comma
        const escaped = value.replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',');
    });
    
    // Combine header and rows
    const csv = [headers, ...rows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${report.templateName}_${report.id}.csv`);
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to export CSV');
  }
}

/**
 * Export report as Excel (TSV format for simplicity)
 */
export function exportAsExcel(report: GeneratedReport): void {
  try {
    // Validate data
    if (!report || !report.config || !report.config.columns) {
      throw new Error('Invalid report configuration');
    }
    
    if (!report.data || !Array.isArray(report.data)) {
      throw new Error('Report data is empty or invalid');
    }
    
    const columns = report.config.columns;
    const data = report.data;
    
    // Create header row
    const headers = columns.map(col => col.label).join('\t');
    
    // Create data rows
    const rows = data.map(row => {
      return columns.map(col => {
        return formatCellValue(row[col.id], col.id);
      }).join('\t');
    });
    
    // Combine
    const tsv = [headers, ...rows].join('\n');
    
    // Create blob with Excel MIME type
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    downloadBlob(blob, `${report.templateName}_${report.id}.xls`);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to export Excel');
  }
}

/**
 * Export report as JSON
 */
export function exportAsJSON(report: GeneratedReport): void {
  try {
    const exportData = {
      metadata: {
        reportId: report.id,
        templateId: report.templateId,
        templateName: report.templateName,
        generatedAt: report.generatedAt,
        generatedBy: report.generatedBy,
        rowCount: report.summary.totalRows,
      },
      parameters: report.parameters,
      summary: report.summary,
      data: report.data,
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `${report.templateName}_${report.id}.json`);
  } catch (error) {
    console.error('JSON export failed:', error);
    throw new Error('Failed to export JSON');
  }
}

/**
 * Export report as PDF (simplified HTML-based approach)
 */
export function exportAsPDF(report: GeneratedReport): void {
  try {
    // Validate data
    if (!report || !report.config || !report.config.columns) {
      throw new Error('Invalid report configuration');
    }
    
    if (!report.data || !Array.isArray(report.data)) {
      throw new Error('Report data is empty or invalid');
    }
    
    const columns = report.config.columns;
    const data = report.data;
    
    // Create HTML content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.templateName}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 40px;
      color: #1A1D1F;
    }
    h1 {
      color: #C17052;
      font-size: 24px;
      margin-bottom: 8px;
    }
    .metadata {
      color: #666;
      font-size: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #E8E2D5;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background-color: #E8E2D5;
      color: #363F47;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #ddd;
    }
    td {
      padding: 10px 8px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #F9F9F9;
    }
    .summary {
      margin-top: 24px;
      padding: 16px;
      background-color: #E8E2D5;
      border-radius: 4px;
    }
    .summary-item {
      display: inline-block;
      margin-right: 24px;
      font-size: 14px;
    }
    .summary-label {
      color: #666;
      font-size: 12px;
    }
    .summary-value {
      font-weight: 600;
      color: #1A1D1F;
    }
  </style>
</head>
<body>
  <h1>${report.templateName}</h1>
  <div class="metadata">
    <div>Report ID: ${report.id}</div>
    <div>Generated: ${formatDate(report.generatedAt)} by ${report.generatedByName}</div>
    <div>Total Records: ${report.summary.totalRows}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        ${columns.map(col => `<th>${col.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${columns.map(col => `<td>${formatCellValue(row[col.id], col.id)}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  ${report.summary.metrics.length > 0 ? `
    <div class="summary">
      <strong>Summary Metrics:</strong><br><br>
      ${report.summary.metrics.map(metric => `
        <div class="summary-item">
          <div class="summary-label">${metric.label}</div>
          <div class="summary-value">${metric.value}</div>
        </div>
      `).join('')}
    </div>
  ` : ''}
</body>
</html>
    `;
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Don't close automatically - let user close after printing
        }, 500);
      };
    } else {
      throw new Error('Failed to open print window. Please allow pop-ups.');
    }
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF');
  }
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main export function - routes to specific format handler
 */
export function exportReport(report: GeneratedReport, format: ExportFormat): void {
  switch (format) {
    case 'csv':
      exportAsCSV(report);
      break;
    case 'excel':
      exportAsExcel(report);
      break;
    case 'json':
      exportAsJSON(report);
      break;
    case 'pdf':
      exportAsPDF(report);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}