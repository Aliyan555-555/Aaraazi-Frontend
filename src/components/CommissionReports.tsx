import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User } from '../types';
import {
  generateCommissionReport,
  getAgentPerformanceMetrics,
  getCommissionForecast,
  getCommissionDistribution,
  type CommissionReport,
  type AgentPerformanceMetrics
} from '../lib/commissionReporting';
import { formatCurrency } from '../lib/currency';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  Calendar,
  Download,
  Filter,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface CommissionReportsProps {
  user: User;
}

export const CommissionReports: React.FC<CommissionReportsProps> = ({ user }) => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'ytd' | 'custom'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'forecast' | 'distribution'>('overview');

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    const end = now.toISOString().split('T')[0];

    switch (dateRange) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'ytd':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end
    };
  }, [dateRange]);

  // Generate reports
  const report = useMemo(() =>
    generateCommissionReport(startDate, endDate, user.id, user.role),
    [startDate, endDate, user.id, user.role]
  );

  const performance = useMemo(() =>
    getAgentPerformanceMetrics(user.id, startDate, endDate),
    [user.id, startDate, endDate]
  );

  const forecast = useMemo(() =>
    getCommissionForecast(user.id, user.role),
    [user.id, user.role]
  );

  const distribution = useMemo(() =>
    getCommissionDistribution(startDate, endDate, user.id, user.role),
    [startDate, endDate, user.id, user.role]
  );

  // Chart colors
  const COLORS = ['#030213', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const formatMonth = (monthStr: any) => {
    if (!monthStr || typeof monthStr !== 'string') return monthStr;
    const [year, month] = monthStr.split('-');
    if (!year || !month) return monthStr;
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const csvRows: string[] = [];

      // Header
      csvRows.push('aaraazi - Commission Report');
      csvRows.push(`Generated: ${new Date().toLocaleDateString()}`);
      csvRows.push(`Period: ${startDate} to ${endDate}`);
      csvRows.push('');

      // Summary
      csvRows.push('SUMMARY');
      csvRows.push('Metric,Value');
      csvRows.push(`Total Commissions,${report.totalCommissions}`);
      csvRows.push(`Paid Commissions,${report.paidCommissions}`);
      csvRows.push(`Pending Commissions,${report.pendingCommissions}`);
      csvRows.push(`Total Count,${report.totalCount}`);
      csvRows.push(`Paid Count,${report.paidCount}`);
      csvRows.push(`Pending Count,${report.pendingCount}`);
      csvRows.push(`Average Commission,${report.averageCommission}`);
      csvRows.push(`Average Rate,${report.averageRate}%`);
      csvRows.push('');

      // Monthly Trend
      if (report.monthlyTrend.length > 0) {
        csvRows.push('MONTHLY TREND');
        csvRows.push('Month,Total,Paid,Pending');
        report.monthlyTrend.forEach(row => {
          csvRows.push(`${row.month},${row.total},${row.paid},${row.pending}`);
        });
        csvRows.push('');
      }

      // By Property Type
      if (report.byPropertyType.length > 0) {
        csvRows.push('BY PROPERTY TYPE');
        csvRows.push('Type,Total Commissions,Count,Percentage');
        report.byPropertyType.forEach(row => {
          const percentage = report.totalCommissions > 0 ? ((row.totalCommissions / report.totalCommissions) * 100).toFixed(1) : '0';
          csvRows.push(`${row.type},${row.totalCommissions},${row.count},${percentage}%`);
        });
        csvRows.push('');
      }

      // Top Agents
      if (user.role === 'admin' && report.topAgents.length > 0) {
        csvRows.push('TOP PERFORMING AGENTS');
        csvRows.push('Agent Name,Total Commissions,Count,Average Rate');
        report.topAgents.forEach(row => {
          csvRows.push(`${row.agentName},${row.totalCommissions},${row.count},${row.averageRate}%`);
        });
        csvRows.push('');
      }

      // Create CSV blob and download
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `commission-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-gray-900">Commission Reports</h2>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">Total Commissions</p>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl text-gray-900 mb-1">{formatCurrency(report.totalCommissions)}</p>
            <p className="text-xs text-gray-500">{report.totalCount} commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">Paid</p>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl text-green-600 mb-1">{formatCurrency(report.paidCommissions)}</p>
            <p className="text-xs text-gray-500">
              {report.paidCount} paid ({report.totalCount > 0 ? Math.round((report.paidCount / report.totalCount) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">Pending</p>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-2xl text-orange-600 mb-1">{formatCurrency(report.pendingCommissions)}</p>
            <p className="text-xs text-gray-500">{report.pendingCount} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">Average</p>
              <Target className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl text-gray-900 mb-1">{formatCurrency(report.averageCommission)}</p>
            <p className="text-xs text-gray-500">{report.averageRate.toFixed(1)}% avg rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Trend</CardTitle>
              <CardDescription>Commission earnings over time</CardDescription>
            </CardHeader>
            <CardContent>
              {report.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={report.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      labelFormatter={formatMonth}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#030213"
                      strokeWidth={2}
                      name="Total"
                      dot={{ fill: '#030213' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="paid"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Paid"
                      dot={{ fill: '#10b981' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Pending"
                      dot={{ fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No commission data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Property Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Property Type</CardTitle>
                <CardDescription>Commission breakdown by type</CardDescription>
              </CardHeader>
              <CardContent>
                {report.byPropertyType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={report.byPropertyType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => {
                          const type = props.payload?.type || props.type || '';
                          const percent = props.percent || 0;
                          return `${type} (${(percent * 100).toFixed(0)}%)`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalCommissions"
                      >
                        {report.byPropertyType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Status</CardTitle>
                <CardDescription>Commission status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {report.byStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={report.byStatus}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="status"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Bar dataKey="amount" fill="#030213" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Agents (Admin only) */}
          {user.role === 'admin' && report.topAgents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performing Agents</CardTitle>
                <CardDescription>Agents with highest commissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.topAgents.map((agent, index) => (
                    <div key={agent.agentId} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                        <span className="text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{agent.agentName}</p>
                        <p className="text-xs text-gray-500">{agent.count} commissions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{formatCurrency(agent.totalCommissions)}</p>
                        <p className="text-xs text-gray-500">{agent.averageRate.toFixed(1)}% avg rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Rank</p>
                  <Award className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-2xl text-gray-900 mb-1">#{performance.rank || 'N/A'}</p>
                <p className="text-xs text-gray-500">{performance.percentOfTotal.toFixed(1)}% of total</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Properties Sold</p>
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl text-gray-900 mb-1">{performance.propertiesSold}</p>
                <p className="text-xs text-gray-500">{performance.conversionRate.toFixed(1)}% conversion</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Total Sales Value</p>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl text-gray-900 mb-1">{formatCurrency(performance.totalSalesValue)}</p>
                <p className="text-xs text-gray-500">Avg: {formatCurrency(performance.averageCommissionAmount)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Performance</CardTitle>
              <CardDescription>Your commission trends</CardDescription>
            </CardHeader>
            <CardContent>
              {performance.monthlyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performance.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      labelFormatter={formatMonth}
                    />
                    <Bar dataKey="commissions" fill="#030213" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Properties */}
          {performance.topProperties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Commission Earners</CardTitle>
                <CardDescription>Your highest commission properties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performance.topProperties.map((property, index) => (
                    <div key={property.propertyId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="text-sm text-gray-900">{property.propertyTitle}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(property.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-900">{formatCurrency(property.commission)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6">
          {/* Forecast Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-3">This Month</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-2xl text-gray-900">{formatCurrency(forecast.currentMonth)}</p>
                  <p className="text-sm text-gray-500">current</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl text-blue-600">{formatCurrency(forecast.projectedMonth)}</p>
                  <p className="text-sm text-gray-500">projected</p>
                </div>
                {forecast.projectedMonth > forecast.currentMonth && (
                  <p className="text-xs text-green-600 mt-2">
                    +{formatCurrency(forecast.projectedMonth - forecast.currentMonth)} to go
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-3">This Quarter</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-2xl text-gray-900">{formatCurrency(forecast.currentQuarter)}</p>
                  <p className="text-sm text-gray-500">current</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl text-blue-600">{formatCurrency(forecast.projectedQuarter)}</p>
                  <p className="text-sm text-gray-500">projected</p>
                </div>
                {forecast.projectedQuarter > forecast.currentQuarter && (
                  <p className="text-xs text-green-600 mt-2">
                    +{formatCurrency(forecast.projectedQuarter - forecast.currentQuarter)} to go
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-3">This Year</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-2xl text-gray-900">{formatCurrency(forecast.currentYear)}</p>
                  <p className="text-sm text-gray-500">current</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl text-blue-600">{formatCurrency(forecast.projectedYear)}</p>
                  <p className="text-sm text-gray-500">projected</p>
                </div>
                {forecast.projectedYear > forecast.currentYear && (
                  <p className="text-xs text-green-600 mt-2">
                    +{formatCurrency(forecast.projectedYear - forecast.currentYear)} to go
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full ${forecast.confidence === 'high' ? 'bg-green-100 text-green-800' :
                  forecast.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {forecast.confidence} confidence
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Forecast based on historical performance and current trends.
                {forecast.confidence === 'high' && ' High confidence based on 50+ commission records.'}
                {forecast.confidence === 'medium' && ' Medium confidence based on 20-50 commission records.'}
                {forecast.confidence === 'low' && ' Low confidence - more data needed for accurate projections.'}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Month Progress</p>
                  <p className="text-gray-900">
                    {((new Date().getDate() / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) * 100).toFixed(0)}% complete
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Year Progress</p>
                  <p className="text-gray-900">
                    {((new Date().getMonth() / 12) * 100).toFixed(0)}% complete
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Mean</p>
                <p className="text-xl text-gray-900">{formatCurrency(distribution.mean)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Median</p>
                <p className="text-xl text-gray-900">{formatCurrency(distribution.median)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Mode</p>
                <p className="text-xl text-gray-900">{formatCurrency(distribution.mode)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-600 mb-1">Std Dev</p>
                <p className="text-xl text-gray-900">{formatCurrency(distribution.standardDeviation)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission Distribution</CardTitle>
              <CardDescription>Breakdown by commission amount ranges</CardDescription>
            </CardHeader>
            <CardContent>
              {distribution.ranges.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distribution.ranges}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="range"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      formatter={(value: any, name?: string) => {
                        if (name === 'totalAmount') return formatCurrency(value);
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#4f46e5" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No distribution data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Range Breakdown */}
          {distribution.ranges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Range Breakdown</CardTitle>
                <CardDescription>Detailed commission ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {distribution.ranges.map((range, index) => (
                    <div key={range.range} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="text-sm text-gray-900">{range.range}</p>
                          <p className="text-xs text-gray-500">{range.count} commissions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{formatCurrency(range.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{range.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};