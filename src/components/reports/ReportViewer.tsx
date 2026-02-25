/**
 * ReportViewer Component
 * 
 * Displays generated report data with multiple visualization options
 * Supports table, charts, and export capabilities
 * 
 * @version 2.0.0 - Added interactive charts (Recharts)
 */

import React, { useState, useMemo } from 'react';
import {
  Download,
  Share2,
  Star,
  RefreshCw,
  Table,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Filter,
  LineChart as LineChartIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table as DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { GeneratedReport, VisualizationType } from '../../types/reports';
import { formatPKR } from '../../lib/currency';
// [STUBBED] import { formatDate } from '../../lib/validation';
import { toast } from 'sonner';
import { exportReport } from '../../lib/reportExport';

// ===== STUBS for removed prototype functions =====
const formatDate = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====


interface ReportViewerProps {
  report: GeneratedReport;
  onClose: () => void;
  onRegenerate?: () => void;
}

export default function ReportViewer({ report, onClose, onRegenerate }: ReportViewerProps) {
  const [activeVisualization, setActiveVisualization] = useState<VisualizationType>('table');

  // Handle export
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    try {
      exportReport(report, format);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle share
  const handleShare = () => {
    // TODO: Implement sharing
    toast.success('Share functionality coming soon');
  };

  // Format cell value based on column type
  const formatCellValue = (value: any, columnId: string): string => {
    if (value === null || value === undefined) return '-';

    // Check if it's a currency field
    if (columnId.toLowerCase().includes('revenue') ||
      columnId.toLowerCase().includes('commission') ||
      columnId.toLowerCase().includes('value') ||
      columnId.toLowerCase().includes('price')) {
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

    // Default: return as string
    return String(value);
  };

  // Prepare data for charts
  const chartData = useMemo(() => {
    if (!report.data.columns || !report.data.rows || report.data.rows.length === 0) return [];

    // Find dimension and metric columns
    const dimensionCol = report.config.dimensions?.[0];
    const metricCols = report.config.metrics || [];

    if (!dimensionCol || metricCols.length === 0) {
      // Fallback: use first non-ID column as dimension, rest as metrics
      const columns = report.data.columns.filter(c => !c.id.toLowerCase().includes('id'));
      if (columns.length < 2) return [];

      return report.data.rows.map(row => {
        const dataPoint: any = {};
        columns.forEach(col => {
          dataPoint[col.label] = row[col.id];
        });
        return dataPoint;
      });
    }

    // Use configured dimensions and metrics
    return report.data.rows.map(row => {
      const dataPoint: any = {
        name: String(row[dimensionCol.field] || 'Unknown')
      };

      metricCols.forEach(metric => {
        dataPoint[metric.label] = Number(row[metric.field]) || 0;
      });

      return dataPoint;
    });
  }, [report.data.columns, report.data.rows, report.config.dimensions, report.config.metrics]);

  // Chart color palette
  const CHART_COLORS = [
    '#C17052', // Terracotta (primary)
    '#2D6A54', // Forest green
    '#8B9DC3', // Slate blue
    '#E8B87E', // Warm gold
    '#7C9885', // Sage green
    '#B88A7D', // Clay
    '#5A7A8C', // Steel blue
    '#D4A59A', // Dusty rose
  ];

  // Get metric keys for charts
  const metricKeys = useMemo(() => {
    if (!report.config.metrics) return [];
    return report.config.metrics.map(m => m.label);
  }, [report.config.metrics]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 border shadow-lg">
          <p className="font-medium mb-2" style={{ color: 'var(--color-heading)' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('value') || entry.name.toLowerCase().includes('price')
                ? formatPKR(entry.value)
                : entry.value.toLocaleString()}
            </p>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="border-b" style={{ backgroundColor: 'white' }}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-heading)' }}>
                {report.templateName}
              </h1>
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Generated {formatDate(report.generatedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>{report.data.rowCount} rows</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {onRegenerate && (
                <Button variant="outline" onClick={onRegenerate}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              )}
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {report.data.summary && Object.keys(report.data.summary).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(report.data.summary).map(([key, data]) => (
                <Card key={key} className="p-4">
                  <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {report.config.metrics.find(m => m.id === key)?.label || key}
                  </div>
                  <div className="text-2xl font-semibold" style={{ color: 'var(--color-heading)' }}>
                    {data.formatted}
                  </div>
                  {data.percentChange !== undefined && (
                    <div className={`text-sm mt-1 flex items-center gap-1 ${data.percentChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      <TrendingUp className={`h-3 w-3 ${data.percentChange < 0 ? 'rotate-180' : ''}`} />
                      <span>{Math.abs(data.percentChange).toFixed(1)}%</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Visualization Tabs */}
        <div className="px-6">
          <Tabs value={activeVisualization} onValueChange={(v) => setActiveVisualization(v as VisualizationType)}>
            <TabsList>
              <TabsTrigger value="table">
                <Table className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
              <TabsTrigger value="bar-chart">
                <BarChart3 className="h-4 w-4 mr-2" />
                Bar Chart
              </TabsTrigger>
              <TabsTrigger value="pie-chart">
                <PieChart className="h-4 w-4 mr-2" />
                Pie Chart
              </TabsTrigger>
              <TabsTrigger value="line-chart">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Line Chart
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeVisualization === 'table' && (
          <Card>
            <div className="overflow-x-auto">
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {report.data.columns?.map(column => (
                      <TableHead key={column.id}>
                        {column.label}
                      </TableHead>
                    )) ||
                      Object.keys(report.data.rows[0] || {})
                        .filter(key => key !== 'id' && !key.startsWith('_'))
                        .map(key => (
                          <TableHead key={key}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </TableHead>
                        ))
                    }
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.data.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={100} className="text-center py-12">
                        <div style={{ color: 'var(--color-text-muted)' }}>
                          No data to display
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.data.rows.map((row, index) => (
                      <TableRow key={row.id || index}>
                        <TableCell className="font-medium" style={{ color: 'var(--color-text-muted)' }}>
                          {index + 1}
                        </TableCell>
                        {report.data.columns?.map(column => (
                          <TableCell key={column.id}>
                            {formatCellValue(row[column.id], column.id)}
                          </TableCell>
                        )) ||
                          Object.entries(row)
                            .filter(([key]) => key !== 'id' && !key.startsWith('_'))
                            .map(([key, value]) => (
                              <TableCell key={key}>
                                {formatCellValue(value, key)}
                              </TableCell>
                            ))
                        }
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </DataTable>
            </div>

            {/* Footer */}
            {report.data.rows.length > 0 && (
              <div className="p-4 border-t flex items-center justify-between text-sm"
                style={{ color: 'var(--color-text-muted)' }}>
                <div>
                  Showing {report.data.rows.length} of {report.data.filteredRowCount} rows
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                    Export Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                    Export PDF
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {activeVisualization === 'bar-chart' && (
          <Card className="p-12 text-center">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {metricKeys.map((key, index) => (
                  <Bar key={key} dataKey={key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {activeVisualization === 'pie-chart' && (
          <Card className="p-6">
            {chartData.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No data available for pie chart visualization
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey={metricKeys[0] || 'value'}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </Card>
        )}

        {activeVisualization === 'line-chart' && (
          <Card className="p-12 text-center">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {metricKeys.map((key, index) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}