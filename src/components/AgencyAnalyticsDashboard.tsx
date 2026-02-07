import React, { useMemo, useState } from 'react';
import { User, Property } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { formatCurrency } from '../lib/currency';

// PHASE 5: Import foundation components ✅
import { MetricCard } from './ui/metric-card';
import { InfoPanel } from './ui/info-panel';

// PHASE 6: Import brand-aligned chart colors ✅
import {
  PRIMARY_SEQUENCE,
  PIE_CHART_COLORS,
  CHART_ELEMENTS,
  RECHARTS_CONFIG,
} from '../lib/chartColors';

import {
  calculateDaysOnMarket,
  getDaysOnMarketStatus,
  getPropertyPerformanceScore,
  getPropertyEngagement,
  getTopPerformingProperties,
  getPropertiesNeedingAttention
} from '../lib/propertyAnalytics';
import { getProperties } from '../lib/data';
import { MarketTrendsChart } from './MarketTrendsChart';
import { AgentPerformanceDashboard } from './AgentPerformanceDashboard';
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Users,
  Calendar,
  AlertTriangle,
  Award,
  Eye,
  Target,
  Activity,
  ArrowLeft
} from 'lucide-react';

interface AgencyAnalyticsDashboardProps {
  user: User;
  onBack: () => void;
}

export const AgencyAnalyticsDashboard: React.FC<AgencyAnalyticsDashboardProps> = ({ user, onBack }) => {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days' | 'ytd' | 'all'>('30days');
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'market' | 'agents'>('overview');

  // Get all properties
  const allProperties = useMemo(() => {
    return getProperties(user.role === 'admin' ? undefined : user.id, user.role);
  }, [user.id, user.role]);

  // Calculate date range
  const getDateRange = () => {
    const today = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '7days':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(today.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return { startDate: null, endDate: null };
    }

    return {
      startDate: startDate.toISOString(),
      endDate: today.toISOString()
    };
  };

  const { startDate, endDate } = getDateRange();

  // Filter properties by date range
  const filteredProperties = useMemo(() => {
    if (!startDate || !endDate) return allProperties;

    return allProperties.filter((property: Property) => {
      const createdDate = new Date(property.createdAt);
      return createdDate >= new Date(startDate) && createdDate <= new Date(endDate);
    });
  }, [allProperties, startDate, endDate]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const activeListings = filteredProperties.filter((p: Property) =>
      p.status === 'available' && p.isPublished
    );
    const soldProperties = filteredProperties.filter((p: Property) => p.status === 'sold');
    const totalValue = activeListings.reduce((sum: number, p: Property) => sum + (p.price || 0), 0);
    const soldValue = soldProperties.reduce((sum: number, p: Property) => sum + (p.finalSalePrice || p.price || 0), 0);

    // Days on market analysis
    const daysOnMarketData = activeListings.map((p: Property) => ({
      property: p,
      days: calculateDaysOnMarket(p),
      status: getDaysOnMarketStatus(calculateDaysOnMarket(p))
    }));

    const averageDaysOnMarket = daysOnMarketData.length > 0
      ? daysOnMarketData.reduce((sum: number, d: any) => sum + d.days, 0) / daysOnMarketData.length
      : 0;

    // Property type distribution
    const typeDistribution = filteredProperties.reduce((acc: any, p: Property) => {
      acc[p.propertyType] = (acc[p.propertyType] || 0) + 1;
      return acc;
    }, {});

    // Status distribution
    const statusDistribution = filteredProperties.reduce((acc: any, p: Property) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    // Performance metrics
    const topPerforming = getTopPerformingProperties(5);
    const needingAttention = getPropertiesNeedingAttention();

    // Monthly trend
    const monthlyTrend: { [key: string]: { listed: number; sold: number; value: number } } = {};
    filteredProperties.forEach((p: Property) => {
      const month = new Date(p.createdAt).toISOString().slice(0, 7);
      if (!monthlyTrend[month]) {
        monthlyTrend[month] = { listed: 0, sold: 0, value: 0 };
      }
      monthlyTrend[month].listed += 1;
      monthlyTrend[month].value += p.price || 0;

      if (p.status === 'sold') {
        monthlyTrend[month].sold += 1;
      }
    });

    const monthlyData = Object.entries(monthlyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        listed: data.listed,
        sold: data.sold,
        value: data.value
      }));

    // Conversion rate
    const conversionRate = filteredProperties.length > 0
      ? (soldProperties.length / filteredProperties.length) * 100
      : 0;

    return {
      totalProperties: filteredProperties.length,
      activeListings: activeListings.length,
      soldProperties: soldProperties.length,
      totalValue,
      soldValue,
      averagePrice: activeListings.length > 0 ? totalValue / activeListings.length : 0,
      averageDaysOnMarket: Math.round(averageDaysOnMarket),
      conversionRate,
      typeDistribution,
      statusDistribution,
      topPerforming,
      needingAttention,
      monthlyData
    };
  }, [filteredProperties]);

  const formatMonth = (monthStr: any) => {
    if (!monthStr || typeof monthStr !== 'string') return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl text-gray-900">Agency Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive performance metrics and market insights
            </p>
          </div>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Properties"
            value={analytics.totalProperties}
            icon={<Home className="h-4 w-4 text-gray-400" />}
            comparison={`${analytics.activeListings} active`}
          />

          <MetricCard
            label="Portfolio Value"
            value={formatCurrency(analytics.totalValue)}
            icon={<DollarSign className="h-4 w-4 text-gray-400" />}
            comparison={`Avg: ${formatCurrency(analytics.averagePrice)}`}
          />

          <MetricCard
            label="Sales Value"
            value={formatCurrency(analytics.soldValue)}
            icon={<TrendingUp className="h-4 w-4 text-green-600" />}
            comparison={`${analytics.soldProperties} sold`}
          />

          <MetricCard
            label="Conversion Rate"
            value={`${analytics.conversionRate.toFixed(1)}%`}
            icon={<Target className="h-4 w-4 text-gray-400" />}
            comparison={`Avg DOM: ${analytics.averageDaysOnMarket} days`}
          />
        </div>

        {/* Alerts */}
        {(analytics.needingAttention.staleListing.length > 0 ||
          analytics.needingAttention.lowViews.length > 0 ||
          analytics.needingAttention.expiringSoon.length > 0) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-2">Properties Needing Attention</p>
                    <div className="flex flex-wrap gap-2">
                      {analytics.needingAttention.staleListing.length > 0 && (
                        <Badge variant="outline" className="bg-white">
                          {analytics.needingAttention.staleListing.length} Stale Listings (180+ days)
                        </Badge>
                      )}
                      {analytics.needingAttention.lowViews.length > 0 && (
                        <Badge variant="outline" className="bg-white">
                          {analytics.needingAttention.lowViews.length} Low Views
                        </Badge>
                      )}
                      {analytics.needingAttention.expiringSoon.length > 0 && (
                        <Badge variant="outline" className="bg-white">
                          {analytics.needingAttention.expiringSoon.length} Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="market">Market Trends</TabsTrigger>
            <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Activity</CardTitle>
                <CardDescription>Properties listed vs sold over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.monthlyData}>
                      <CartesianGrid {...RECHARTS_CONFIG.cartesianGrid} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonth}
                        {...RECHARTS_CONFIG.xAxis}
                      />
                      <YAxis {...RECHARTS_CONFIG.yAxis} />
                      <Tooltip {...RECHARTS_CONFIG.tooltip} labelFormatter={formatMonth} />
                      <Legend {...RECHARTS_CONFIG.legend} />
                      {/* PHASE 6: Use brand colors - Forest Green for success/sold, Terracotta for primary */}
                      <Line
                        type="monotone"
                        dataKey="listed"
                        stroke={PRIMARY_SEQUENCE[1]}
                        strokeWidth={2}
                        name="Listed"
                        dot={{ fill: PRIMARY_SEQUENCE[1] }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sold"
                        stroke={PRIMARY_SEQUENCE[0]}
                        strokeWidth={2}
                        name="Sold"
                        dot={{ fill: PRIMARY_SEQUENCE[0] }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <p>No data available for selected period</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Property Types</CardTitle>
                  <CardDescription>Distribution by property type</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(analytics.typeDistribution).length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analytics.typeDistribution).map(([type, count]) => ({
                            name: type,
                            value: count
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(analytics.typeDistribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <p>No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Property Status</CardTitle>
                  <CardDescription>Current status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(analytics.statusDistribution).length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={Object.entries(analytics.statusDistribution).map(([status, count]) => ({
                          status,
                          count
                        }))}
                      >
                        <CartesianGrid {...RECHARTS_CONFIG.cartesianGrid} />
                        <XAxis dataKey="status" {...RECHARTS_CONFIG.xAxis} />
                        <YAxis {...RECHARTS_CONFIG.yAxis} />
                        <Tooltip {...RECHARTS_CONFIG.tooltip} />
                        {/* PHASE 6: Use brand color - Terracotta for primary data */}
                        <Bar dataKey="count" fill={PRIMARY_SEQUENCE[1]} />
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
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            {/* Top Performing Properties */}
            {analytics.topPerforming.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Top Performing Properties
                  </CardTitle>
                  <CardDescription>Properties with highest performance scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topPerforming.map((property: Property, index: number) => {
                      const engagement = getPropertyEngagement(property.id);
                      return (
                        <div key={property.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800">
                            <span className="text-sm">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{property.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                <Eye className="h-3 w-3 inline mr-1" />
                                {engagement.viewCount} views
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {engagement.daysOnMarket} days
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-900">{formatCurrency(property.price || 0)}</p>
                            <Badge variant="outline" className="mt-1">
                              Score: {engagement.performanceScore}/100
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Properties Needing Attention */}
            {analytics.needingAttention.staleListing.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Stale Listings (180+ Days)
                  </CardTitle>
                  <CardDescription>Properties on market for over 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.needingAttention.staleListing.slice(0, 5).map((property: Property) => {
                      const days = calculateDaysOnMarket(property);
                      return (
                        <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{property.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{property.address}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm text-gray-900">{formatCurrency(property.price || 0)}</p>
                            <Badge variant="outline" className="mt-1 bg-red-50 border-red-200 text-red-700">
                              {days} days
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Market Trends Tab */}
          <TabsContent value="market" className="space-y-6">
            <MarketTrendsChart />
          </TabsContent>

          {/* Agent Performance Tab */}
          <TabsContent value="agents" className="space-y-6">
            <AgentPerformanceDashboard user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};