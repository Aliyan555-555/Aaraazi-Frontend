/**
 * Agency Portfolio Analytics Component
 * Comprehensive analytics for agency-owned properties
 * Design System V4.1 Compliant
 * 
 * Integrates into Portfolio Management > Analytics > Agency Analytics tab
 */

import React, { useMemo, useState } from 'react';
import {
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Award,
  AlertCircle,
  CheckCircle,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Property, User } from '../../types';
import { getProperties } from '../../lib/data';
import { calculatePropertyFinancials } from '../../lib/agencyFinancials';
import { getTransactionsByProperty } from '../../lib/agencyTransactions';
import { formatPKR } from '../../lib/currency';
import { getAgencyPortfolioSummary } from '../../lib/portfolio';

interface AgencyPortfolioAnalyticsProps {
  user: User;
  onNavigateToProperty?: (propertyId: string) => void;
}

interface PropertyPerformance {
  property: Property;
  financials: ReturnType<typeof calculatePropertyFinancials>;
  saleTransactions: any[];
  totalROI: number;
  annualizedROI: number;
  holdingDays: number;
  capitalGain: number;
  isSold: boolean;
}

export function AgencyPortfolioAnalytics({
  user,
  onNavigateToProperty,
}: AgencyPortfolioAnalyticsProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [sortBy, setSortBy] = useState<'roi' | 'value' | 'profit'>('roi');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load agency-owned properties with error handling
  const agencyProperties = useMemo(() => {
    try {
      const allProperties = getProperties();
      const filtered = allProperties.filter(
        (p) => p.currentOwnerType === 'agency'
      );
      
      // Filter by user role
      if (user.role === 'agent') {
        return filtered.filter((p) => p.agentId === user.id);
      }
      return filtered;
    } catch (err) {
      setError('Failed to load properties');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Get portfolio summary with error handling
  const portfolioSummary = useMemo(() => {
    try {
      return getAgencyPortfolioSummary(user.id, user.role);
    } catch (err) {
      setError('Failed to load portfolio summary');
      return {
        totalProperties: 0,
        totalInvested: 0,
        currentValue: 0,
        unrealizedGains: 0,
        roi: 0,
        listedProperties: 0,
        propertiesHolding: 0,
        totalPendingPayments: 0,
      };
    }
  }, [user]);

  // Calculate detailed property performance
  const propertyPerformance = useMemo<PropertyPerformance[]>(() => {
    return agencyProperties.map((property) => {
      const financials = calculatePropertyFinancials(
        property.id,
        property.title,
        property.createdAt
      );

      // Get sale transactions
      const allTransactions = getTransactionsByProperty(property.id);
      const saleTransactions = allTransactions.filter((t) => t.category === 'sale');
      const isSold = saleTransactions.length > 0;

      // Calculate metrics
      const salePrice = saleTransactions
        .filter((t) => t.type === 'sale_price')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const saleExpenses = saleTransactions
        .filter((t) => t.type === 'sale_commission' || t.type === 'closing_costs')
        .reduce((sum, t) => sum + t.amount, 0);

      const netProceeds = salePrice - saleExpenses;
      const capitalGain = isSold 
        ? netProceeds - financials.totalAcquisitionCost 
        : (property.price - financials.totalAcquisitionCost);

      const totalProfit = isSold 
        ? capitalGain + financials.operatingProfit 
        : capitalGain + financials.operatingProfit;

      const totalROI = financials.totalAcquisitionCost > 0
        ? (totalProfit / financials.totalAcquisitionCost) * 100
        : 0;

      // Calculate holding period
      const acquireDate = new Date(property.createdAt);
      const currentDate = new Date();
      const holdingDays = Math.floor((currentDate.getTime() - acquireDate.getTime()) / (1000 * 60 * 60 * 24));
      const holdingYears = holdingDays / 365;
      const annualizedROI = holdingYears > 0 ? totalROI / holdingYears : totalROI;

      return {
        property,
        financials,
        saleTransactions,
        totalROI,
        annualizedROI,
        holdingDays,
        capitalGain,
        isSold,
      };
    });
  }, [agencyProperties]);

  // Sort properties
  const sortedProperties = useMemo(() => {
    const sorted = [...propertyPerformance];
    
    switch (sortBy) {
      case 'roi':
        return sorted.sort((a, b) => b.totalROI - a.totalROI);
      case 'value':
        return sorted.sort((a, b) => b.property.price - a.property.price);
      case 'profit':
        return sorted.sort((a, b) => b.capitalGain - a.capitalGain);
      default:
        return sorted;
    }
  }, [propertyPerformance, sortBy]);

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const activeProperties = propertyPerformance.filter((p) => !p.isSold);
    const soldProperties = propertyPerformance.filter((p) => p.isSold);

    const totalAcquisitionCost = propertyPerformance.reduce(
      (sum, p) => sum + p.financials.totalAcquisitionCost,
      0
    );

    const totalIncome = propertyPerformance.reduce(
      (sum, p) => sum + p.financials.totalIncome,
      0
    );

    const totalExpenses = propertyPerformance.reduce(
      (sum, p) => sum + p.financials.totalExpenses,
      0
    );

    const totalOperatingProfit = propertyPerformance.reduce(
      (sum, p) => sum + p.financials.operatingProfit,
      0
    );

    const totalCapitalGain = propertyPerformance.reduce(
      (sum, p) => sum + p.capitalGain,
      0
    );

    const totalProfit = totalOperatingProfit + totalCapitalGain;

    const averageROI = propertyPerformance.length > 0
      ? propertyPerformance.reduce((sum, p) => sum + p.totalROI, 0) / propertyPerformance.length
      : 0;

    const averageHoldingPeriod = propertyPerformance.length > 0
      ? propertyPerformance.reduce((sum, p) => sum + p.holdingDays, 0) / propertyPerformance.length
      : 0;

    // Best/worst performers
    const bestPerformer = sortedProperties[0];
    const worstPerformer = sortedProperties[sortedProperties.length - 1];

    return {
      totalProperties: propertyPerformance.length,
      activeProperties: activeProperties.length,
      soldProperties: soldProperties.length,
      totalAcquisitionCost,
      totalIncome,
      totalExpenses,
      totalOperatingProfit,
      totalCapitalGain,
      totalProfit,
      averageROI,
      averageHoldingPeriod,
      bestPerformer,
      worstPerformer,
    };
  }, [propertyPerformance, sortedProperties]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Agency Portfolio Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Comprehensive performance analytics for agency-owned properties
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overall Performance</TabsTrigger>
          <TabsTrigger value="properties">Property Analysis</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overall Performance Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top-Level KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  Total Properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{aggregateMetrics.totalProperties}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {aggregateMetrics.activeProperties} active, {aggregateMetrics.soldProperties} sold
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="size-4" />
                  Total Invested
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatPKR(aggregateMetrics.totalAcquisitionCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Acquisition costs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Current Value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-green-600">
                  {formatPKR(portfolioSummary.currentValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Portfolio valuation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="size-4" />
                  Total ROI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-semibold ${
                  portfolioSummary.roi >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {portfolioSummary.roi >= 0 ? '+' : ''}{portfolioSummary.roi.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Overall return
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profit Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Profit & Loss Breakdown
              </CardTitle>
              <CardDescription>
                Detailed financial performance across all properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Operating Performance */}
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-medium">Operating Performance</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Income:</span>
                      <span className="text-green-600">
                        +{formatPKR(aggregateMetrics.totalIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Expenses:</span>
                      <span className="text-red-600">
                        -{formatPKR(aggregateMetrics.totalExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Net Operating:</span>
                      <span className={aggregateMetrics.totalOperatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPKR(aggregateMetrics.totalOperatingProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capital Gains */}
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-medium">Capital Performance</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Acquisition:</span>
                      <span>{formatPKR(aggregateMetrics.totalAcquisitionCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Value:</span>
                      <span className="text-green-600">
                        {formatPKR(portfolioSummary.currentValue)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Capital Gain:</span>
                      <span className={aggregateMetrics.totalCapitalGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatPKR(aggregateMetrics.totalCapitalGain)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Profit */}
                <div className={`rounded-lg border-2 p-4 space-y-3 ${
                  aggregateMetrics.totalProfit >= 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-sm font-medium">Total Profit/Loss</p>
                  <div className="space-y-2">
                    <p className={`text-3xl font-bold ${
                      aggregateMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPKR(Math.abs(aggregateMetrics.totalProfit))}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      {aggregateMetrics.totalProfit >= 0 ? (
                        <TrendingUp className="size-4 text-green-600" />
                      ) : (
                        <TrendingDown className="size-4 text-red-600" />
                      )}
                      <span className={aggregateMetrics.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}>
                        {aggregateMetrics.totalProfit >= 0 ? 'Profit' : 'Loss'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Sources */}
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-3">Profit Sources</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">From Capital Gain</p>
                    <p className={`text-lg font-semibold ${
                      aggregateMetrics.totalCapitalGain >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPKR(aggregateMetrics.totalCapitalGain)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((aggregateMetrics.totalCapitalGain / (Math.abs(aggregateMetrics.totalProfit) || 1)) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">From Operations</p>
                    <p className={`text-lg font-semibold ${
                      aggregateMetrics.totalOperatingProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPKR(aggregateMetrics.totalOperatingProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((aggregateMetrics.totalOperatingProfit / (Math.abs(aggregateMetrics.totalProfit) || 1)) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="size-5" />
                  Average Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average ROI:</span>
                  <span className={`font-semibold ${
                    aggregateMetrics.averageROI >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {aggregateMetrics.averageROI >= 0 ? '+' : ''}{aggregateMetrics.averageROI.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Holding Period:</span>
                  <span className="font-semibold">
                    {Math.floor(aggregateMetrics.averageHoldingPeriod)} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Holding (Months):</span>
                  <span className="font-semibold">
                    {(aggregateMetrics.averageHoldingPeriod / 30).toFixed(1)} months
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="size-5" />
                  Performance Leaders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aggregateMetrics.bestPerformer && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Best Performer</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {aggregateMetrics.bestPerformer.property.title}
                      </span>
                      <Badge variant="default" className="bg-green-600">
                        +{aggregateMetrics.bestPerformer.totalROI.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                )}
                {aggregateMetrics.worstPerformer && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Worst Performer</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {aggregateMetrics.worstPerformer.property.title}
                      </span>
                      <Badge variant="secondary">
                        {aggregateMetrics.worstPerformer.totalROI >= 0 ? '+' : ''}
                        {aggregateMetrics.worstPerformer.totalROI.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Property Analysis Tab */}
        <TabsContent value="properties" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Property Performance Comparison</h3>
              <p className="text-sm text-muted-foreground">
                Detailed performance metrics for each property
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Button
                variant={sortBy === 'roi' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('roi')}
              >
                ROI
              </Button>
              <Button
                variant={sortBy === 'value' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('value')}
              >
                Value
              </Button>
              <Button
                variant={sortBy === 'profit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('profit')}
              >
                Profit
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Acquisition Cost</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Operating Profit</TableHead>
                    <TableHead className="text-right">Capital Gain</TableHead>
                    <TableHead className="text-right">Total ROI</TableHead>
                    <TableHead className="text-right">Holding Period</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProperties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <Building2 className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No agency-owned properties found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedProperties.map((item) => (
                      <TableRow key={item.property.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.property.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {item.property.address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPKR(item.financials.totalAcquisitionCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPKR(item.property.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={item.financials.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPKR(item.financials.operatingProfit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={item.capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPKR(item.capitalGain)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.totalROI >= 0 ? (
                              <ArrowUpRight className="size-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="size-4 text-red-600" />
                            )}
                            <span className={`font-semibold ${
                              item.totalROI >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.totalROI >= 0 ? '+' : ''}{item.totalROI.toFixed(2)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.annualizedROI.toFixed(2)}% annual
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p>{item.holdingDays} days</p>
                          <p className="text-xs text-muted-foreground">
                            ({(item.holdingDays / 30).toFixed(1)} months)
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isSold ? (
                            <Badge variant="secondary">Sold</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onNavigateToProperty?.(item.property.id)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" />
                Cash Flow Summary
              </CardTitle>
              <CardDescription>
                Income and expense analysis across all properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cash Flow Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-green-700">Total Income</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-green-600">
                      {formatPKR(aggregateMetrics.totalIncome)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Across {aggregateMetrics.totalProperties} properties
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-red-700">Total Expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-red-600">
                      {formatPKR(aggregateMetrics.totalExpenses)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Operating costs
                    </p>
                  </CardContent>
                </Card>

                <Card className={`border-2 ${
                  aggregateMetrics.totalOperatingProfit >= 0 
                    ? 'border-green-500 bg-green-50/50' 
                    : 'border-red-500 bg-red-50/50'
                }`}>
                  <CardHeader className="pb-3">
                    <CardDescription>Net Operating Cash Flow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-semibold ${
                      aggregateMetrics.totalOperatingProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPKR(Math.abs(aggregateMetrics.totalOperatingProfit))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {aggregateMetrics.totalOperatingProfit >= 0 ? 'Positive' : 'Negative'} cash flow
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow Efficiency */}
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-4">Cash Flow Efficiency</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Expense Ratio</p>
                    <p className="text-lg font-semibold">
                      {aggregateMetrics.totalIncome > 0
                        ? ((aggregateMetrics.totalExpenses / aggregateMetrics.totalIncome) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Operating Margin</p>
                    <p className="text-lg font-semibold text-green-600">
                      {aggregateMetrics.totalIncome > 0
                        ? ((aggregateMetrics.totalOperatingProfit / aggregateMetrics.totalIncome) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Income Per Property</p>
                    <p className="text-lg font-semibold">
                      {formatPKR(aggregateMetrics.totalProperties > 0
                        ? aggregateMetrics.totalIncome / aggregateMetrics.totalProperties
                        : 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expense Per Property</p>
                    <p className="text-lg font-semibold">
                      {formatPKR(aggregateMetrics.totalProperties > 0
                        ? aggregateMetrics.totalExpenses / aggregateMetrics.totalProperties
                        : 0)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" />
                Portfolio Insights & Recommendations
              </CardTitle>
              <CardDescription>
                Data-driven insights for portfolio optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Performance Insights */}
              {aggregateMetrics.totalProfit > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">Strong Portfolio Performance</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your agency portfolio is generating {formatPKR(aggregateMetrics.totalProfit)} in total profits 
                      with an average ROI of {aggregateMetrics.averageROI.toFixed(2)}%.
                    </p>
                  </div>
                </div>
              )}

              {aggregateMetrics.totalOperatingProfit < 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                  <AlertCircle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900">Negative Operating Cash Flow</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Your properties are generating more expenses ({formatPKR(aggregateMetrics.totalExpenses)}) 
                      than income ({formatPKR(aggregateMetrics.totalIncome)}). Consider reviewing operational efficiency.
                    </p>
                  </div>
                </div>
              )}

              {/* Property Type Distribution */}
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-3">Portfolio Composition</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Properties:</span>
                    <Badge variant="default">{aggregateMetrics.activeProperties}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sold Properties:</span>
                    <Badge variant="secondary">{aggregateMetrics.soldProperties}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Listed for Sale:</span>
                    <Badge variant="outline">{portfolioSummary.listedProperties}</Badge>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-3">Recommendations</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {aggregateMetrics.averageHoldingPeriod > 365 && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        Consider reviewing long-held properties (avg {(aggregateMetrics.averageHoldingPeriod / 365).toFixed(1)} years) 
                        for potential sale opportunities to realize gains.
                      </span>
                    </li>
                  )}
                  {aggregateMetrics.totalExpenses > aggregateMetrics.totalIncome && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        Focus on income-generating activities or cost reduction to improve operating cash flow.
                      </span>
                    </li>
                  )}
                  {aggregateMetrics.activeProperties > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        Continue monitoring property performance and consider investor syndication for select properties 
                        to free up capital for new acquisitions.
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}