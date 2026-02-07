/**
 * Portfolio Hub - Unified Dashboard for Agency & Investor Portfolio Management
 * Central hub for managing agency-owned and investor-owned properties
 */

import React, { useState } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  Wallet,
  Calendar,
  BarChart3,
  Settings,
  ArrowRight,
  DollarSign,
  PieChart,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatPKR } from '../../lib/currency';
import { 
  getAgencyPortfolioSummary,
  getInvestorPortfolioSummary 
} from '../../lib/portfolio';
import { getInvestors } from '../../lib/investors';
import AgencyOwnedPropertiesDashboard from '../AgencyOwnedPropertiesDashboard';
import InvestorManagementView from '../InvestorManagementView';
import InvestorPortfolioDashboard from '../InvestorPortfolioDashboard';
import AgencyPaymentTracking from './AgencyPaymentTracking';
import InvestorPerformanceCharts from './InvestorPerformanceCharts';
import { InvestorPropertiesAnalytics } from '../investor-analytics';
import { AgencyPortfolioAnalytics } from './AgencyPortfolioAnalytics';
import { OwnershipFixPanel } from '../OwnershipFixPanel';

interface PortfolioHubProps {
  onNavigate: (view: string, data?: any) => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'agent';
  };
}

type PortfolioView = 'overview' | 'agency-properties' | 'agency-payments' | 'investor-registry' | 'investor-portfolio' | 'analytics';

export default function PortfolioHub({ onNavigate, user }: PortfolioHubProps) {
  const [activeView, setActiveView] = useState<PortfolioView>('overview');
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);

  // Load summary data
  const agencySummary = getAgencyPortfolioSummary(user.id, user.role);
  const investorSummary = getInvestorPortfolioSummary();
  const investors = getInvestors();

  // Quick stats
  const stats = {
    agency: {
      properties: agencySummary.totalProperties,
      invested: agencySummary.totalInvested,
      currentValue: agencySummary.currentValue,
      roi: agencySummary.roi,
      listed: agencySummary.listedProperties,
      pendingPayments: agencySummary.totalPendingPayments
    },
    investors: {
      count: investors.length,
      totalInvested: investorSummary.totalInvested,
      totalValue: investorSummary.currentValue,
      avgROI: investorSummary.averageROI,
      activeProperties: investorSummary.activeInvestments,
      realizedProfit: investorSummary.totalRealizedProfit
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Portfolio Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage agency-owned properties and investor portfolios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as PortfolioView)} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="agency-properties" className="gap-2">
            <Building2 className="w-4 h-4" />
            Agency Portfolio
          </TabsTrigger>
          <TabsTrigger value="agency-payments" className="gap-2">
            <Calendar className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="investor-registry" className="gap-2">
            <Users className="w-4 h-4" />
            Investors
          </TabsTrigger>
          <TabsTrigger value="investor-portfolio" className="gap-2">
            <Wallet className="w-4 h-4" />
            Investor Portfolio
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Agency Portfolio Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Agency Portfolio
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('agency-properties')}>
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Properties Owned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl">{stats.agency.properties}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.agency.listed} listed for sale
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Total Invested
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl">{formatPKR(stats.agency.invested)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acquisition costs
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
                  <p className="text-2xl text-green-600">{formatPKR(stats.agency.currentValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Portfolio valuation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    ROI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl ${stats.agency.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.agency.roi >= 0 ? '+' : ''}{stats.agency.roi.toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Overall return
                  </p>
                </CardContent>
              </Card>
            </div>

            {stats.agency.pendingPayments > 0 && (
              <Card className="mt-4 border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">Pending Acquisition Payments</p>
                      <p className="text-sm text-yellow-700">
                        {formatPKR(stats.agency.pendingPayments)} in upcoming payments
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveView('agency-payments')}>
                    View Payments
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Investor Portfolio Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl flex items-center gap-2">
                <Users className="w-5 h-5" />
                Investor Portfolio
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('investor-portfolio')}>
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Total Investors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl">{stats.investors.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active investors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    Total Capital
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl">{formatPKR(stats.investors.totalInvested)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.investors.activeProperties} active investments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl text-green-600">{formatPKR(stats.investors.totalValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current valuation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    Average ROI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl ${stats.investors.avgROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.investors.avgROI >= 0 ? '+' : ''}{stats.investors.avgROI.toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPKR(stats.investors.realizedProfit)} realized
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Ownership Fix Panel - Developer Tool */}
          <OwnershipFixPanel />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => onNavigate('inventory')}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm">Add Property</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveView('investor-registry')}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Add Investor</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveView('agency-payments')}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">View Payments</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveView('analytics')}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-sm">View Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agency Properties Tab */}
        <TabsContent value="agency-properties">
          <AgencyOwnedPropertiesDashboard onNavigate={onNavigate} />
        </TabsContent>

        {/* Agency Payments Tab */}
        <TabsContent value="agency-payments">
          <AgencyPaymentTracking onNavigate={onNavigate} />
        </TabsContent>

        {/* Investor Registry Tab */}
        <TabsContent value="investor-registry">
          <InvestorManagementView onNavigate={onNavigate} />
        </TabsContent>

        {/* Investor Portfolio Tab */}
        <TabsContent value="investor-portfolio">
          {selectedInvestor ? (
            <InvestorPortfolioDashboard 
              investor={selectedInvestor}
              onNavigate={onNavigate}
              onBack={() => setSelectedInvestor(null)}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl">Select an Investor</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose an investor to view their portfolio details
                  </p>
                </div>
              </div>
              
              {investors.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg mb-2">No Investors Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add investors to start tracking their portfolios
                    </p>
                    <Button onClick={() => setActiveView('investor-registry')}>
                      <Users className="w-4 h-4 mr-2" />
                      Add Investor
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {investors.map((investor) => (
                    <Card 
                      key={investor.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedInvestor(investor)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{investor.name}</span>
                          <Badge variant={investor.status === 'active' ? 'default' : 'secondary'}>
                            {investor.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Invested</p>
                          <p className="text-lg">{formatPKR(investor.totalInvested)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Portfolio Value</p>
                          <p className="text-lg text-green-600">{formatPKR(investor.currentPortfolioValue)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">ROI</p>
                            <p className={`${investor.totalROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {investor.totalROI >= 0 ? '+' : ''}{investor.totalROI.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Properties</p>
                            <p>{investor.activeProperties}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl">Portfolio Analytics</h2>
              <p className="text-sm text-muted-foreground">
                Comprehensive performance analytics and insights
              </p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overall Performance</TabsTrigger>
              <TabsTrigger value="agency">Agency Analytics</TabsTrigger>
              <TabsTrigger value="investors">Investor Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <InvestorPerformanceCharts />
            </TabsContent>

            <TabsContent value="agency">
              <AgencyPortfolioAnalytics 
                user={user}
                onNavigateToProperty={(propertyId) => {
                  onNavigate('property-detail', { propertyId });
                }}
              />
            </TabsContent>

            <TabsContent value="investors">
              <InvestorPropertiesAnalytics 
                user={user}
                onNavigateToProperty={(propertyId) => {
                  onNavigate('property-detail', { propertyId });
                }}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}