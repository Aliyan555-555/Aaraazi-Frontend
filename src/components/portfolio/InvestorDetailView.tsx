/**
 * Investor Detail View - Comprehensive individual investor profile
 * Shows complete investment history, performance, and portfolio breakdown
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Building2,
  DollarSign,
  Percent,
  Activity,
  Edit,
  Download,
  Plus,
  Eye,
  MoreVertical,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Alert, AlertDescription } from '../ui/alert';
import { formatPKR } from '../../lib/currency';
import { formatDate } from '../../lib/validation';
import {
  getInvestorById,
  getInvestorInvestments,
  calculateInvestorROI,
  calculateInvestorPortfolioValue
} from '../../lib/investors';
import { getProperties } from '../../lib/data';
import { Investor, InvestorInvestment } from '../../types';
import InvestorPerformanceCharts from './InvestorPerformanceCharts';
import CreateInvestorModal from '../CreateInvestorModal';

interface InvestorDetailViewProps {
  investorId: string;
  onNavigate: (view: string, data?: any) => void;
  onBack: () => void;
}

export default function InvestorDetailView({
  investorId,
  onNavigate,
  onBack
}: InvestorDetailViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load investor data
  const investor = getInvestorById(investorId);
  const investments = getInvestorInvestments(investorId);
  const properties = getProperties();

  // Calculate metrics
  const portfolioValue = calculateInvestorPortfolioValue(investorId);
  const roi = calculateInvestorROI(investorId);

  const metrics = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
    const activeInvestments = investments.filter(inv => inv.status === 'active');
    const soldInvestments = investments.filter(inv => inv.status === 'sold');
    const totalRealized = soldInvestments.reduce((sum, inv) => sum + (inv.realizedProfit || 0), 0);
    const unrealizedGain = portfolioValue - activeInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0);

    return {
      totalInvested,
      portfolioValue,
      roi,
      activeCount: activeInvestments.length,
      soldCount: soldInvestments.length,
      totalRealized,
      unrealizedGain
    };
  }, [investments, portfolioValue, roi]);

  // Enriched investments with property data
  const enrichedInvestments = useMemo(() => {
    return investments.map(inv => {
      const property = properties.find(p => p.id === inv.propertyId);
      const currentROI = ((inv.currentValue - inv.investmentAmount) / inv.investmentAmount) * 100;

      return {
        ...inv,
        property,
        currentROI
      };
    }).sort((a, b) => new Date(b.investmentDate).getTime() - new Date(a.investmentDate).getTime());
  }, [investments, properties]);

  // Get investment status badge
  const getInvestmentStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Activity className="w-3 h-3 mr-1" />
          Active
        </Badge>;
      case 'sold':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Sold
        </Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!investor) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Investor not found. They may have been deleted.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl">{investor.name}</h1>
            <p className="text-sm text-muted-foreground">
              Investor since {formatDate(investor.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {investor.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{investor.email}</p>
                </div>
              </div>
            )}
            {investor.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{investor.phone}</p>
                </div>
              </div>
            )}
            {investor.cnic && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">CNIC</p>
                  <p className="text-sm">{investor.cnic}</p>
                </div>
              </div>
            )}
            {investor.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{investor.address}{investor.city ? `, ${investor.city}` : ''}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Show placeholder if no contact info */}
          {!investor.email && !investor.phone && !investor.cnic && !investor.address && (
            <p className="text-sm text-muted-foreground">No contact information provided</p>
          )}
        </CardContent>
      </Card>

      {/* Investment Profile & Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Investor Type</p>
                <p className="text-sm capitalize">{investor.investorType || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk Profile</p>
                <p className="text-sm capitalize">{investor.riskProfile || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Investment Horizon</p>
                <p className="text-sm capitalize">
                  {investor.investmentHorizon ? investor.investmentHorizon.replace('-', ' ') : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Capacity</p>
                <p className="text-sm">
                  {investor.totalInvestmentCapacity ? formatPKR(investor.totalInvestmentCapacity) : 'Not specified'}
                </p>
              </div>
            </div>

            {(investor.minimumInvestmentAmount || investor.maximumInvestmentAmount) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Min Investment</p>
                    <p className="text-sm">
                      {investor.minimumInvestmentAmount ? formatPKR(investor.minimumInvestmentAmount) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max Investment</p>
                    <p className="text-sm">
                      {investor.maximumInvestmentAmount ? formatPKR(investor.maximumInvestmentAmount) : 'Not set'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {investor.previousInvestments && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Previous Experience</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{investor.previousInvestments}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Investment Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Preferred Property Types</p>
              {investor.preferredPropertyTypes && investor.preferredPropertyTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {investor.preferredPropertyTypes.map(type => (
                    <Badge key={type} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {type}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No property type preferences set</p>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Preferred Locations</p>
              {investor.preferredLocations && investor.preferredLocations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {investor.preferredLocations.map(location => (
                    <Badge key={location} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {location}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No location preferences set</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banking Information - Always show */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Information</CardTitle>
        </CardHeader>
        <CardContent>
          {(investor.bankName || investor.accountTitle || investor.accountNumber || investor.iban) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Bank Name</p>
                <p className="text-sm">{investor.bankName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Title</p>
                <p className="text-sm">{investor.accountTitle || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Number</p>
                <p className="text-sm">{investor.accountNumber || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IBAN</p>
                <p className="text-sm font-mono text-xs">{investor.iban || 'Not provided'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No banking information provided</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Information - Always show */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Previous Investment Experience</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {investor.previousInvestments || 'No previous investment experience provided'}
            </p>
          </div>
          {investor.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Additional Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{investor.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">{formatPKR(metrics.totalInvested)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {investments.length} total investment{investments.length !== 1 ? 's' : ''}
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
            <p className="text-2xl text-green-600">{formatPKR(metrics.portfolioValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.activeCount} active investment{metrics.activeCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-500" />
              Overall ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl ${metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPKR(metrics.unrealizedGain)} unrealized
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
            <p className="text-2xl text-purple-600">{formatPKR(metrics.totalRealized)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.soldCount} sold investment{metrics.soldCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="investments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="investments">Investment Portfolio</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
        </TabsList>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              {enrichedInvestments.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No investments yet</p>
                  <Button onClick={() => onNavigate('inventory')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Investment
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Investment Date</TableHead>
                        <TableHead>Share %</TableHead>
                        <TableHead className="text-right">Invested</TableHead>
                        <TableHead className="text-right">Current Value</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrichedInvestments.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{inv.property?.title || 'Unknown Property'}</p>
                              <p className="text-xs text-muted-foreground">
                                {inv.property?.address || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {formatDate(inv.investmentDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {inv.sharePercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPKR(inv.investmentAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPKR(inv.currentValue)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={inv.currentROI >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {inv.currentROI >= 0 ? '+' : ''}{inv.currentROI.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {getInvestmentStatusBadge(inv.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onNavigate('property-detail', { propertyId: inv.propertyId })}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Property
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <InvestorPerformanceCharts investorId={investorId} />
        </TabsContent>

        {/* Activity History Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrichedInvestments.map((inv) => (
                  <div key={inv.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">Invested in {inv.property?.title || 'Property'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPKR(inv.investmentAmount)} • {inv.sharePercentage}% share
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(inv.investmentDate)}
                        </p>
                      </div>
                      {inv.status === 'sold' && inv.exitDate && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Sold on {formatDate(inv.exitDate)}</span>
                            {' • '}
                            <span className={inv.realizedProfit! >= 0 ? 'text-green-600' : 'text-red-600'}>
                              Profit: {formatPKR(inv.realizedProfit || 0)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {enrichedInvestments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity history
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <CreateInvestorModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingInvestor={investor}
          onInvestorCreated={() => {
            setIsEditModalOpen(false);
            // Trigger a re-render by re-fetching the investor
            window.location.reload(); // Simple refresh for now
          }}
        />
      )}
    </div>
  );
}