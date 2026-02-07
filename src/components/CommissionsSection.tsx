import React, { useMemo, useState } from 'react';
import { Commission, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { formatCurrency, formatCurrencyShort } from '../lib/currency';
import { CommissionReports } from './CommissionReports';
import {
  Target,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Eye,
  AlertCircle,
  Split,
  CheckSquare
} from 'lucide-react';

interface CommissionsSectionProps {
  commissions: Commission[];
  user?: User;
  userRole: string;
  filter: 'all' | 'pending-approval' | 'approved' | 'paid';
  onFilterChange: (filter: 'all' | 'pending-approval' | 'approved' | 'paid') => void;
  onReviewCommission: (commission: Commission) => void;
  onSplitCommission: (commission: Commission) => void;
}

export function CommissionsSection({
  commissions,
  user,
  userRole,
  filter,
  onFilterChange,
  onReviewCommission,
  onSplitCommission
}: CommissionsSectionProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'reports'>('list');

  // Calculate commission statistics
  const stats = useMemo(() => {
    const now = new Date();

    const pending = commissions.filter(c => c.status === 'pending' || c.approvalStatus === 'pending-approval');
    const approved = commissions.filter(c => c.approvalStatus === 'approved');
    const paid = commissions.filter(c => c.status === 'paid');
    const overdue = commissions.filter(c => {
      if (!c.dueDate || c.status === 'paid') return false;
      return new Date(c.dueDate) < now;
    });

    const totalPending = pending.reduce((sum, c) => sum + c.amount, 0);
    const totalApproved = approved.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = paid.reduce((sum, c) => sum + c.amount, 0);
    const totalOverdue = overdue.reduce((sum, c) => sum + c.amount, 0);

    // YTD calculations
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const ytdCommissions = commissions.filter(c => {
      const date = new Date(c.createdAt);
      return date >= yearStart;
    });
    const ytdTotal = ytdCommissions.reduce((sum, c) => sum + c.amount, 0);
    const ytdPaid = ytdCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);

    return {
      pending: { count: pending.length, total: totalPending },
      approved: { count: approved.length, total: totalApproved },
      paid: { count: paid.length, total: totalPaid },
      overdue: { count: overdue.length, total: totalOverdue },
      ytd: { count: ytdCommissions.length, total: ytdTotal, paid: ytdPaid }
    };
  }, [commissions]);

  // Filter commissions based on selected filter
  const filteredCommissions = useMemo(() => {
    if (filter === 'all') return commissions;
    if (filter === 'pending-approval') return commissions.filter(c => c.approvalStatus === 'pending-approval');
    if (filter === 'approved') return commissions.filter(c => c.approvalStatus === 'approved');
    if (filter === 'paid') return commissions.filter(c => c.status === 'paid');
    return commissions;
  }, [commissions, filter]);

  const getStatusBadge = (commission: Commission) => {
    if (commission.status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    if (commission.approvalStatus === 'approved') {
      return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
    }
    if (commission.approvalStatus === 'rejected') {
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    }
    if (commission.approvalStatus === 'pending-approval') {
      return <Badge className="bg-orange-100 text-orange-800">Pending Approval</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const isOverdue = (commission: Commission) => {
    if (!commission.dueDate || commission.status === 'paid') return false;
    return new Date(commission.dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">Commission List</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 mt-6">
          {/* Commission Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                    <p className="text-2xl font-medium text-gray-900">
                      {formatCurrencyShort(stats.pending.total)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stats.pending.count} commissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-medium text-gray-900">
                      {formatCurrencyShort(stats.approved.total)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stats.approved.count} commissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-50">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Paid (YTD)</p>
                    <p className="text-2xl font-medium text-gray-900">
                      {formatCurrencyShort(stats.ytd.paid)}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stats.paid.count} payments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-red-50">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-2xl font-medium text-gray-900">
                      {formatCurrencyShort(stats.overdue.total)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stats.overdue.count} commissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Commission Ledger</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={filter} onValueChange={(value: any) => onFilterChange(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Commissions</SelectItem>
                      <SelectItem value="pending-approval">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCommissions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No commissions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.map((commission) => (
                      <TableRow key={commission.id} className={isOverdue(commission) ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">
                          {commission.propertyTitle}
                          {commission.isSplit && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              <Split className="h-3 w-3 mr-1" />
                              Split
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{commission.agentName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(commission.amount)}
                          {commission.overrideAmount && commission.overrideAmount !== commission.amount && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatCurrency(commission.overrideAmount)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(commission)}</TableCell>
                        <TableCell>
                          {commission.approvalStatus === 'approved' && commission.approvedBy && (
                            <div className="text-xs text-gray-600">
                              <CheckSquare className="h-3 w-3 inline mr-1" />
                              Approved
                            </div>
                          )}
                          {commission.approvalStatus === 'rejected' && commission.rejectionReason && (
                            <div className="text-xs text-red-600">
                              Rejected: {commission.rejectionReason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {commission.dueDate ? (
                            <div className={isOverdue(commission) ? 'text-red-600 font-medium' : ''}>
                              {new Date(commission.dueDate).toLocaleDateString()}
                              {isOverdue(commission) && (
                                <div className="text-xs">Overdue</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {userRole === 'admin' && commission.approvalStatus === 'pending-approval' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onReviewCommission(commission)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                            )}
                            {commission.status !== 'paid' && !commission.isSplit && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSplitCommission(commission)}
                              >
                                <Split className="h-3 w-3 mr-1" />
                                Split
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Overdue Alerts */}
          {stats.overdue.count > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-800">Overdue Commissions</CardTitle>
                  <Badge className="bg-red-100 text-red-800">{stats.overdue.count} overdue</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">
                  {stats.overdue.count} commission(s) totaling {formatCurrency(stats.overdue.total)} are past their due date.
                  Please review and process payments immediately.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          {user ? (
            <CommissionReports user={user} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <p>Unable to load reports. User data not available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
