/**
 * ReportChart Component
 * 
 * Renders charts for custom report data using Recharts.
 * Supports multiple chart types: bar, line, pie, area.
 * 
 * Design System V4.1 Compliant
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChartConfig, ReportColumn } from '../../../../types/custom-reports';
import { ReportRow } from '../../../../types/reports';

interface ReportChartProps {
  data: ReportRow[];
  columns: ReportColumn[];
  chartConfig: ChartConfig;
}

// Color schemes
const COLOR_PALETTES: { [key: string]: string[] } = {
  default: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
  blue: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  green: ['#065f46', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  red: ['#991b1b', '#ef4444', '#f87171', '#fca5a5', '#fecaca'],
  purple: ['#5b21b6', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
};

export const ReportChart: React.FC<ReportChartProps> = ({
  data,
  columns,
  chartConfig,
}) => {
  // Get colors
  const colors = COLOR_PALETTES[chartConfig.colorScheme || 'default'];

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!chartConfig.xAxis || !chartConfig.yAxis) {
      return [];
    }

    const xAxis = chartConfig.xAxis;
    const yAxis = chartConfig.yAxis;

    return data.map(row => {
      const item: any = {};

      // X-axis value
      const xColumn = columns.find(c => c.id === xAxis);
      if (xColumn) {
        item.name = row[xAxis];

        // Format dates for better display
        if (xColumn.type === 'date' && item.name) {
          const date = new Date(item.name);
          item.name = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }

      // Y-axis value(s)
      if (yAxis) {
        const yColumn = columns.find(c => c.id === yAxis);
        if (yColumn) {
          item.value = Number(row[yAxis]) || 0;
          item.label = yColumn.label;
        }
      }

      // Additional series (for multi-line charts)
      if (chartConfig.series) {
        chartConfig.series.forEach(seriesField => {
          const seriesColumn = columns.find(c => c.id === seriesField);
          if (seriesColumn) {
            item[seriesField] = Number(row[seriesField]) || 0;
          }
        });
      }

      return item;
    });
  }, [data, columns, chartConfig]);

  // Format currency values
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="text-gray-900 mb-2">{payload[0].payload.name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700">
              {entry.name}: {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Render chart based on type
  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No data available for chart</p>
        </div>
      );
    }

    switch (chartConfig.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={formatValue} />
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.showLegend && <Legend />}
              <Bar
                dataKey="value"
                fill={colors[0]}
                name={chartData[0]?.label || 'Value'}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={formatValue} />
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
                name={chartData[0]?.label || 'Value'}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry) => `${entry.name}: ${formatValue(entry.value)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={formatValue} />
              <Tooltip content={<CustomTooltip />} />
              {chartConfig.showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3}
                name={chartData[0]?.label || 'Value'}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Unsupported chart type</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full">
      {chartConfig.title && (
        <h3 className="text-center text-gray-900 mb-4">{chartConfig.title}</h3>
      )}
      {renderChart()}
    </div>
  );
};
