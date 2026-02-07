/**
 * Investor Properties Analytics Dashboard
 * For agents to view analytics across all investor-owned properties
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { User, Property, InvestorInvestment, InvestorDistribution } from '../../types';
import { getProperties } from '../../lib/data';
import { getInvestorById } from '../../lib/investors';
import { getAllInvestorDistributions } from '../../lib/saleDistribution';
import { getPropertyInvestorTransactions } from '../../lib/investorTransactions';
import { formatPKR } from '../../lib/currency';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Percent,
  Eye,
  FileText,
} from 'lucide-react';

interface InvestorPropertiesAnalyticsProps {
  user: User;
  onNavigateToProperty?: (propertyId: string) => void;
}

export function InvestorPropertiesAnalytics({
  user,
  onNavigateToProperty,
}: InvestorPropertiesAnalyticsProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Load all investor properties
  const investorProperties = useMemo(() => {
    const allProperties = getProperties();
    return allProperties.filter(
      (p) => p.currentOwnerType === 'investor' && p.investorShares && p.investorShares.length > 0
    );
  }, []);

  // Load all investments
  const allInvestments = useMemo(() => {
    return getAllInvestorDistributions();
  }, []);

  // Load all distributions
  const allDistributions = useMemo(() => {
    return getAllInvestorDistributions();
  }, []);

  // Calculate analytics
  const analytics = useMemo(() => {
    // Active properties
    const activeProperties = investorProperties.filter((p) => p.status !== 'sold');
    const soldProperties = investorProperties.filter((p) => p.status === 'sold');

    // Active investments
    const activeInvestments = allInvestments.filter((inv) => inv.status === 'active');
    const exitedInvestments = allInvestments.filter((inv) => inv.status === 'exited');

    // Total investment amounts
    const totalInvestedActive = activeInvestments.reduce(
      (sum, inv) => sum + inv.investmentAmount,
      0
    );
    const totalInvestedExited = exitedInvestments.reduce(
      (sum, inv) => sum + inv.investmentAmount,
      0
    );

    // Unrealized profits (active)
    const totalUnrealizedProfit = activeInvestments.reduce(
      (sum, inv) => sum + (inv.unrealizedProfit || 0),
      0
    );
    const totalRentalIncome = activeInvestments.reduce(
      (sum, inv) => sum + (inv.rentalIncome || 0),
      0
    );
    const totalExpenses = activeInvestments.reduce(
      (sum, inv) => sum + (inv.totalExpenses || 0),
      0
    );

    // Realized profits (exited)
    const totalRealizedProfit = exitedInvestments.reduce(
      (sum, inv) => sum + (inv.realizedProfit || 0),
      0
    );
    const totalExitValue = exitedInvestments.reduce(
      (sum, inv) => sum + (inv.exitValue || 0),
      0
    );

    // Distributions
    const pendingDistributions = allDistributions.filter(
      (d) => d.distributionStatus === 'pending'
    );
    const paidDistributions = allDistributions.filter((d) => d.distributionStatus === 'paid');
    const pendingAmount = pendingDistributions.reduce((sum, d) => sum + d.totalReturn, 0);
    const paidAmount = paidDistributions.reduce((sum, d) => sum + d.totalReturn, 0);

    // Unique investors count
    const uniqueInvestors = new Set(allInvestments.map((inv) => inv.investorId));

    // Average ROI
    const investmentsWithROI = allInvestments.filter((inv) => inv.roi !== undefined);
    const averageROI =
      investmentsWithROI.length > 0
        ? investmentsWithROI.reduce((sum, inv) => sum + (inv.roi || 0), 0) /
          investmentsWithROI.length
        : 0;

    return {
      // Properties
      totalProperties: investorProperties.length,
      activeProperties: activeProperties.length,
      soldProperties: soldProperties.length,

      // Investments
      totalInvestments: allInvestments.length,
      activeInvestments: activeInvestments.length,
      exitedInvestments: exitedInvestments.length,

      // Amounts
      totalInvestedActive,
      totalInvestedExited,
      totalInvested: totalInvestedActive + totalInvestedExited,
      
      // Active portfolio
      totalRentalIncome,
      totalExpenses,
      totalUnrealizedProfit,
      currentPortfolioValue: totalInvestedActive + totalUnrealizedProfit,

      // Exited investments
      totalRealizedProfit,
      totalExitValue,

      // Distributions
      totalDistributions: allDistributions.length,
      pendingDistributions: pendingDistributions.length,
      paidDistributions: paidDistributions.length,
      pendingAmount,
      paidAmount,
      totalDistributed: pendingAmount + paidAmount,

      // Investors
      uniqueInvestors: uniqueInvestors.size,
      averageROI,
    };
  }, [investorProperties, allInvestments, allDistributions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Investor Properties Analytics</h2>
        <p className="text-muted-foreground">
          Overview of all investor syndication properties and performance
        </p>
      </div>

      {/* Summary Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Properties */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investor Properties</p>
                <p className="text-2xl font-bold text-blue-700">
                  {analytics.totalProperties}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.activeProperties} active, {analytics.soldProperties} sold
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Investors */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Investors</p>
                <p className="text-2xl font-bold text-purple-700">
                  {analytics.uniqueInvestors}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.totalInvestments} total investments
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Invested */}
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold text-indigo-700">
                  {formatPKR(analytics.totalInvested)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPKR(analytics.totalInvestedActive)} active
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        {/* Average ROI */}
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average ROI</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {analytics.averageROI >= 0 ? '+' : ''}
                  {analytics.averageROI.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Across all investments</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Portfolio Value */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Portfolio Value</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatPKR(analytics.currentPortfolioValue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {analytics.totalUnrealizedProfit >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-600" />
                  )}
                  <span
                    className={`text-xs ${
                      analytics.totalUnrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPKR(Math.abs(analytics.totalUnrealizedProfit))} unrealized
                  </span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Realized Returns */}
        <Card className="bg-teal-50 border-teal-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Realized Returns</p>
                <p className="text-2xl font-bold text-teal-700">
                  {formatPKR(analytics.totalRealizedProfit)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From {analytics.exitedInvestments} exits
                </p>
              </div>
              <Award className="w-8 h-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Distributions */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Distributions</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatPKR(analytics.pendingAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.pendingDistributions} awaiting payment
                </p>
              </div>
              <FileText className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <PieChart className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="properties">
            <Building2 className="w-4 h-4 mr-2" />
            Properties ({analytics.activeProperties})
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Investments Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Investments</CardTitle>
                <CardDescription>{analytics.activeInvestments} active positions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm text-muted-foreground">Total Invested:</span>
                  <span className="font-medium">{formatPKR(analytics.totalInvestedActive)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm text-muted-foreground">Rental Income:</span>
                  <span className="font-medium text-green-600">
                    +{formatPKR(analytics.totalRentalIncome)}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm text-muted-foreground">Total Expenses:</span>
                  <span className="font-medium text-red-600">
                    -{formatPKR(analytics.totalExpenses)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between p-2 bg-primary/5 rounded">
                  <span className="font-medium">Unrealized Profit:</span>
                  <span
                    className={`font-bold ${
                      analytics.totalUnrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPKR(analytics.totalUnrealizedProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distributions</CardTitle>
                <CardDescription>{analytics.totalDistributions} total distributions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm text-muted-foreground">Total Distributed:</span>
                  <span className="font-medium">{formatPKR(analytics.totalDistributed)}</span>
                </div>
                <div className="flex justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <span className="text-sm text-muted-foreground">Paid Out:</span>
                  <span className="font-medium text-green-600">
                    {formatPKR(analytics.paidAmount)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {analytics.paidDistributions}
                  </Badge>
                </div>
                <div className="flex justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <span className="text-sm text-muted-foreground">Pending:</span>
                  <span className="font-medium text-yellow-600">
                    {formatPKR(analytics.pendingAmount)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {analytics.pendingDistributions}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between p-2 bg-primary/5 rounded">
                  <span className="font-medium">Realized Profit:</span>
                  <span className="font-bold text-emerald-600">
                    {formatPKR(analytics.totalRealizedProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4">
          {investorProperties.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No investor properties found</p>
              </CardContent>
            </Card>
          ) : (
            investorProperties.map((property) => (
              <PropertySummaryCard
                key={property.id}
                property={property}
                onNavigate={onNavigateToProperty}
              />
            ))
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators across all investments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cash Flow Analysis */}
              <div>
                <h4 className="font-medium mb-3">Cash Flow Analysis</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatPKR(analytics.totalRentalIncome)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold text-red-700">
                      {formatPKR(analytics.totalExpenses)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                    <p
                      className={`text-xl font-bold ${
                        analytics.totalRentalIncome - analytics.totalExpenses >= 0
                          ? 'text-blue-700'
                          : 'text-red-700'
                      }`}
                    >
                      {formatPKR(analytics.totalRentalIncome - analytics.totalExpenses)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Returns Analysis */}
              <div>
                <h4 className="font-medium mb-3">Returns Analysis</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Unrealized Profit (Active)</p>
                    <p
                      className={`text-2xl font-bold ${
                        analytics.totalUnrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPKR(analytics.totalUnrealizedProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {analytics.activeInvestments} active investments
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Realized Profit (Exited)</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatPKR(analytics.totalRealizedProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {analytics.exitedInvestments} exits
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Investment Stats */}
              <div>
                <h4 className="font-medium mb-3">Investment Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Average ROI:</span>
                    <Badge variant={analytics.averageROI >= 0 ? 'default' : 'destructive'}>
                      {analytics.averageROI >= 0 ? '+' : ''}
                      {analytics.averageROI.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Total Investors:</span>
                    <span className="font-medium">{analytics.uniqueInvestors}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Active Investments:</span>
                    <span className="font-medium">{analytics.activeInvestments}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Completed Exits:</span>
                    <span className="font-medium">{analytics.exitedInvestments}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Property Summary Card
function PropertySummaryCard({
  property,
  onNavigate,
}: {
  property: Property;
  onNavigate?: (propertyId: string) => void;
}) {
  const investments = useMemo(() => {
    const allInvestments = getAllInvestorDistributions();
    return allInvestments.filter((inv) => inv.propertyId === property.id);
  }, [property.id]);

  const activeInvestments = investments.filter((inv) => inv.status === 'active');
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const totalUnrealizedProfit = activeInvestments.reduce(
    (sum, inv) => sum + (inv.unrealizedProfit || 0),
    0
  );

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                <Users className="w-3 h-3 mr-1" />
                {property.investorShares?.length || 0} Investors
              </Badge>
              <Badge variant="secondary">{property.status}</Badge>
            </div>
            <h4 className="font-medium text-lg">{property.title}</h4>
            <p className="text-sm text-muted-foreground">{property.address}</p>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Total Invested</p>
                <p className="font-medium">{formatPKR(totalInvested)}</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Active Positions</p>
                <p className="font-medium">{activeInvestments.length}</p>
              </div>
              <div className="p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Unrealized Profit</p>
                <p
                  className={`font-medium ${
                    totalUnrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatPKR(totalUnrealizedProfit)}
                </p>
              </div>
            </div>
          </div>
          {onNavigate && (
            <Button variant="ghost" size="sm" onClick={() => onNavigate(property.id)}>
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}