/**
 * Investor Portfolio Dashboard
 * Complete portfolio view for investors showing all investments, returns, and distributions
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Contact, User, InvestorInvestment, InvestorDistribution } from '../../types';
import { getInvestorInvestments, getInvestorPortfolioSummary } from '../../lib/investors';
import { getInvestorDistributions, getInvestorTotalReturns } from '../../lib/saleDistribution';
import { getPropertyById } from '../../lib/data';
import { formatPKR } from '../../lib/currency';
import { formatPropertyAddress } from '../../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Building2,
  Activity,
  Calendar,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  FileText,
  PieChart,
  BarChart3,
} from 'lucide-react';

interface InvestorPortfolioDashboardProps {
  investor: Contact;
  user: User;
  onNavigateToProperty?: (propertyId: string) => void;
}

export function InvestorPortfolioDashboard({
  investor,
  user,
  onNavigateToProperty,
}: InvestorPortfolioDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Load all data
  const investments = useMemo(() => {
    return getInvestorInvestments(investor.id);
  }, [investor.id]);

  const distributions = useMemo(() => {
    return getInvestorDistributions(investor.id);
  }, [investor.id]);

  const portfolioSummary = useMemo(() => {
    return getInvestorPortfolioSummary(investor.id);
  }, [investor.id]);

  const totalReturns = useMemo(() => {
    return getInvestorTotalReturns(investor.id);
  }, [investor.id]);

  // Active investments
  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const exitedInvestments = investments.filter(inv => inv.status === 'sold');

  // Calculate total unrealized profit
  const totalUnrealizedProfit = activeInvestments.reduce(
    (sum, inv) => sum + (inv.unrealizedProfit || 0),
    0
  );

  // Calculate total portfolio value
  const totalPortfolioValue = activeInvestments.reduce(
    (sum, inv) => sum + inv.investmentAmount + (inv.unrealizedProfit || 0),
    0
  );

  // Pending distributions
  const pendingDistributions = distributions.filter(d => d.status === 'pending');
  const pendingAmount = pendingDistributions.reduce((sum, d) => sum + d.amount, 0);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Investment Portfolio</h2>
        <p className="text-muted-foreground">
          Complete overview of {investor.name}'s real estate investments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatPKR(portfolioSummary.totalInvested)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {portfolioSummary.totalInvestments} investment{portfolioSummary.totalInvestments !== 1 ? 's' : ''}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Current Value */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatPKR(totalPortfolioValue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {totalUnrealizedProfit >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs ${totalUnrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPKR(Math.abs(totalUnrealizedProfit))}
                  </span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Active Properties */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Properties</p>
                <p className="text-2xl font-bold text-purple-700">
                  {portfolioSummary.activeInvestments}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {portfolioSummary.exitedInvestments} exited
                </p>
              </div>
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Returns */}
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatPKR(totalReturns.totalProfit)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    ROI: {totalReturns.averageROI.toFixed(2)}%
                  </Badge>
                </div>
              </div>
              <Award className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Distributions Alert */}
      {pendingDistributions.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-900">Pending Distributions</p>
                <p className="text-sm text-yellow-800 mt-1">
                  {pendingDistributions.length} distribution{pendingDistributions.length !== 1 ? 's' : ''} awaiting payment
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-700">
                  {formatPKR(pendingAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <PieChart className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="active">
            <Activity className="w-4 h-4 mr-2" />
            Active ({activeInvestments.length})
          </TabsTrigger>
          <TabsTrigger value="exited">
            <Award className="w-4 h-4 mr-2" />
            Exited ({exitedInvestments.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Summary</CardTitle>
              <CardDescription>Complete investment overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Rental Income</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatPKR(portfolioSummary.totalRentalIncome)}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatPKR(portfolioSummary.totalExpenses)}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Unrealized Profit</p>
                  <p className={`text-xl font-bold ${totalUnrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPKR(totalUnrealizedProfit)}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Realized Profit</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatPKR(totalReturns.totalProfit)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Distribution Summary */}
              {distributions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Distribution Summary</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Distributed</p>
                      <p className="text-lg font-bold text-blue-700">
                        {formatPKR(totalReturns.totalReturned)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {totalReturns.distributionCount} distribution{totalReturns.distributionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-lg font-bold text-yellow-700">
                        {formatPKR(pendingAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pendingDistributions.length} pending
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-muted-foreground">Paid Out</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatPKR(totalReturns.totalReturned - pendingAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {distributions.filter(d => d.status === 'paid').length} paid
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Investments Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeInvestments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No active investments</p>
              </CardContent>
            </Card>
          ) : (
            activeInvestments.map((investment) => {
              const property = getPropertyById(investment.propertyId);
              if (!property) return null;

              return (
                <InvestmentCard
                  key={investment.id}
                  investment={investment}
                  property={property}
                  onNavigate={onNavigateToProperty}
                />
              );
            })
          )}
        </TabsContent>

        {/* Exited Investments Tab */}
        <TabsContent value="exited" className="space-y-4">
          {exitedInvestments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No exited investments</p>
              </CardContent>
            </Card>
          ) : (
            exitedInvestments.map((investment) => {
              const property = getPropertyById(investment.propertyId);
              const distribution = distributions.find(d => d.investmentId === investment.id);
              if (!property) return null;

              return (
                <ExitedInvestmentCard
                  key={investment.id}
                  investment={investment}
                  property={property}
                  distribution={distribution}
                  onNavigate={onNavigateToProperty}
                />
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Investment Card Component (Active)
function InvestmentCard({
  investment,
  property,
  onNavigate,
}: {
  investment: InvestorInvestment;
  property: any;
  onNavigate?: (propertyId: string) => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Percent className="w-3 h-3 mr-1" />
                  {investment.sharePercentage.toFixed(2)}%
                </Badge>
              </div>
              <h4 className="font-medium text-lg">{property.title}</h4>
              <p className="text-sm text-muted-foreground">{formatPropertyAddress(property.address)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Invested: {formatDate(investment.investmentDate)}
              </p>
            </div>
            {onNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(property.id)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Separator />

          {/* Investment Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-muted-foreground">Investment</p>
              <p className="text-lg font-bold text-blue-700">
                {formatPKR(investment.investmentAmount)}
              </p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-muted-foreground">Current Value</p>
              <p className="text-lg font-bold text-green-700">
                {formatPKR(investment.investmentAmount + (investment.unrealizedProfit || 0))}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs text-muted-foreground">Rental Income</p>
              <p className="text-lg font-bold text-emerald-700">
                +{formatPKR(investment.rentalIncome || 0)}
              </p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-lg font-bold text-red-700">
                -{formatPKR(investment.totalExpenses || 0)}
              </p>
            </div>
          </div>

          {/* Unrealized Profit */}
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Unrealized Profit</span>
              <span className={`text-xl font-bold ${(investment.unrealizedProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPKR(investment.unrealizedProfit || 0)}
              </span>
            </div>
            {investment.roi !== undefined && (
              <div className="mt-2">
                <Badge variant={(investment.roi || 0) >= 0 ? 'default' : 'destructive'}>
                  ROI: {(investment.roi || 0) >= 0 ? '+' : ''}{(investment.roi || 0).toFixed(2)}%
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Exited Investment Card Component
function ExitedInvestmentCard({
  investment,
  property,
  distribution,
  onNavigate,
}: {
  investment: InvestorInvestment;
  property: any;
  distribution?: InvestorDistribution;
  onNavigate?: (propertyId: string) => void;
}) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                  <Award className="w-3 h-3 mr-1" />
                  Exited
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Percent className="w-3 h-3 mr-1" />
                  {investment.sharePercentage.toFixed(2)}%
                </Badge>
                {distribution && (
                  <Badge
                    variant="outline"
                    className={
                      distribution.status === 'paid'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }
                  >
                    {distribution.status === 'paid' ? 'Paid' : 'Pending'}
                  </Badge>
                )}
              </div>
              <h4 className="font-medium text-lg">{property.title}</h4>
              <p className="text-sm text-muted-foreground">{formatPropertyAddress(property.address)}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Held: {formatDate(investment.investmentDate)} - {formatDate(investment.soldDate || investment.exitDate)}
                </span>
              </div>
            </div>
            {onNavigate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(property.id)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Separator />

          {/* Investment Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-muted-foreground">Investment</p>
              <p className="text-lg font-bold text-blue-700">
                {formatPKR(investment.investmentAmount)}
              </p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-muted-foreground">Exit Value</p>
              <p className="text-lg font-bold text-green-700">
                {formatPKR(investment.exitValue || 0)}
              </p>
            </div>
          </div>

          {/* Realized Profit */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Realized Profit</span>
              <span className={`text-xl font-bold ${(investment.realizedProfit || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatPKR(investment.realizedProfit || 0)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Return on Investment</span>
              <Badge variant={(investment.roi || 0) >= 0 ? 'default' : 'destructive'} className="text-sm">
                {(investment.roi || 0) >= 0 ? '+' : ''}{(investment.roi || 0).toFixed(2)}%
              </Badge>
            </div>
          </div>

          {/* Distribution Details */}
          {distribution && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capital Gain:</span>
                <span className={(distribution.capitalGain || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPKR(distribution.capitalGain || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rental Income:</span>
                <span className="text-green-600">+{formatPKR(distribution.rentalIncome || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses:</span>
                <span className="text-red-600">-{formatPKR(distribution.totalExpenses || 0)}</span>
              </div>
              {distribution.date && (
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Paid On:</span>
                  <span>{formatDate(distribution.date)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card >
  );
}