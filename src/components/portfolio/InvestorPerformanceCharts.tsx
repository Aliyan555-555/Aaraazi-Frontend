/**
 * Investor Performance Charts
 * Comprehensive analytics and visualizations for investor portfolio performance
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Building2,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { formatPKR } from '../../lib/currency';
import { getInvestors, getInvestorInvestments, calculateInvestorROI } from '../../lib/investors';
import { getProperties } from '../../lib/data';
import { InvestorInvestment } from '../../types';

interface InvestorPerformanceChartsProps {
  investorId?: string; // If provided, show individual investor performance
  dateRange?: 'all' | '1m' | '3m' | '6m' | '1y';
}

const COLORS = {
  primary: '#030213',
  secondary: '#ececf0',
  accent: '#e9ebef',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#d4183d',
  info: '#3b82f6'
};

const CHART_COLORS = [
  '#030213', // Primary
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Deep Orange
];

export default function InvestorPerformanceCharts({
  investorId,
  dateRange = 'all'
}: InvestorPerformanceChartsProps) {
  const investors = getInvestors();
  const properties = getProperties();

  // Get filtered data based on investorId
  const investmentData = useMemo(() => {
    if (investorId) {
      const investor = investors.find(inv => inv.id === investorId);
      if (!investor) return [];

      const investments = getInvestorInvestments(investorId);
      return investments.map(inv => ({
        ...inv,
        investorName: investor.name,
        propertyTitle: properties.find(p => p.id === inv.propertyId)?.title || 'Unknown'
      }));
    } else {
      // All investors
      const allInvestments: Array<InvestorInvestment & { investorName: string; propertyTitle: string }> = [];

      investors.forEach(investor => {
        const investments = getInvestorInvestments(investor.id);
        investments.forEach(inv => {
          allInvestments.push({
            ...inv,
            investorName: investor.name,
            propertyTitle: properties.find(p => p.id === inv.propertyId)?.title || 'Unknown'
          });
        });
      });

      return allInvestments;
    }
  }, [investorId, investors, properties]);

  // Portfolio composition by property type
  const propertyTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();

    investmentData.forEach(inv => {
      const property = properties.find(p => p.id === inv.propertyId);
      if (property) {
        const type = property.propertyType || (property as any).type || 'unknown';
        typeMap.set(type, (typeMap.get(type) || 0) + inv.investmentAmount);
      }
    });

    return Array.from(typeMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }, [investmentData, properties]);

  // Investment status distribution
  const statusData = useMemo(() => {
    const statusMap = new Map<string, { count: number; value: number }>();

    investmentData.forEach(inv => {
      const current = statusMap.get(inv.status) || { count: 0, value: 0 };
      statusMap.set(inv.status, {
        count: current.count + 1,
        value: current.value + inv.currentValue
      });
    });

    return Array.from(statusMap.entries()).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: data.count,
      value: data.value
    }));
  }, [investmentData]);

  // ROI performance by investor
  const investorROIData = useMemo(() => {
    if (investorId) return [];

    return investors.map(investor => {
      const roi = calculateInvestorROI(investor.id);
      const investments = getInvestorInvestments(investor.id);
      const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);

      return {
        name: investor.name,
        roi,
        invested: totalInvested
      };
    }).filter(d => d.invested > 0).sort((a, b) => b.roi - a.roi).slice(0, 10);
  }, [investors, investorId]);

  // Monthly investment timeline
  const timelineData = useMemo(() => {
    const monthlyData = new Map<string, { invested: number; realized: number }>();

    investmentData.forEach(inv => {
      const date = new Date(inv.investmentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const current = monthlyData.get(monthKey) || { invested: 0, realized: 0 };
      current.invested += inv.investmentAmount;

      if (inv.status === 'sold' && inv.exitDate) {
        const exitDate = new Date(inv.exitDate);
        const exitMonthKey = `${exitDate.getFullYear()}-${String(exitDate.getMonth() + 1).padStart(2, '0')}`;
        const exitCurrent = monthlyData.get(exitMonthKey) || { invested: 0, realized: 0 };
        exitCurrent.realized += inv.realizedProfit || 0;
        monthlyData.set(exitMonthKey, exitCurrent);
      }

      monthlyData.set(monthKey, current);
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        invested: data.invested,
        realized: data.realized
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [investmentData]);

  // Top performing investments
  const topInvestments = useMemo(() => {
    return investmentData
      .map(inv => {
        const roi = ((inv.currentValue - inv.investmentAmount) / inv.investmentAmount) * 100;
        return {
          ...inv,
          roi
        };
      })
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);
  }, [investmentData]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalInvested = investmentData.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const totalCurrentValue = investmentData.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalRealizedProfit = investmentData
      .filter(inv => inv.status === 'sold')
      .reduce((sum, inv) => sum + (inv.realizedProfit || 0), 0);
    const avgROI = totalInvested > 0
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
      : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalRealizedProfit,
      avgROI,
      activeCount: investmentData.filter(inv => inv.status === 'active').length,
      soldCount: investmentData.filter(inv => inv.status === 'sold').length
    };
  }, [investmentData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatPKR(entry.value) : entry.value}
            </p>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">{formatPKR(summaryStats.totalInvested)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.activeCount + summaryStats.soldCount} total investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Current Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-green-600">{formatPKR(summaryStats.totalCurrentValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.activeCount} active investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-500" />
              Average ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl ${summaryStats.avgROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summaryStats.avgROI >= 0 ? '+' : ''}{summaryStats.avgROI.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Portfolio performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              Realized Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-purple-600">{formatPKR(summaryStats.totalRealizedProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.soldCount} sold investments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="composition" className="space-y-4">
        <TabsList>
          <TabsTrigger value="composition">Portfolio Composition</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          {!investorId && <TabsTrigger value="performance">Top Performers</TabsTrigger>}
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
        </TabsList>

        {/* Portfolio Composition */}
        <TabsContent value="composition" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Investment by Property Type</CardTitle>
              </CardHeader>
              <CardContent>
                {propertyTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={propertyTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {propertyTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No investment data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {propertyTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={propertyTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatPKR(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No investment data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Investment Timeline (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatPKR(value)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      stroke={COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorInvested)"
                      name="Invested"
                    />
                    <Area
                      type="monotone"
                      dataKey="realized"
                      stroke={COLORS.success}
                      fillOpacity={1}
                      fill="url(#colorRealized)"
                      name="Realized Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No timeline data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performers */}
        {!investorId && (
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Investors by ROI</CardTitle>
              </CardHeader>
              <CardContent>
                {investorROIData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={investorROIData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `${value.toFixed(1)}%`} />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <Card className="p-3 shadow-lg">
                                <p className="font-medium mb-2">{payload[0].payload.name}</p>
                                <p className="text-sm">ROI: {payload[0].payload.roi.toFixed(2)}%</p>
                                <p className="text-sm">Invested: {formatPKR(payload[0].payload.invested)}</p>
                              </Card>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="roi" fill={COLORS.success}>
                        {investorROIData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.roi >= 0 ? COLORS.success : COLORS.danger} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No performance data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Status Distribution */}
        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Investment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, payload }: any) => `${name} (${payload.count})`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No status data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Performing Investments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topInvestments.map((inv, index) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{inv.propertyTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.investorName} • {formatPKR(inv.investmentAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${inv.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {inv.roi >= 0 ? '+' : ''}{inv.roi.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPKR(inv.currentValue)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {topInvestments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No investment data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
