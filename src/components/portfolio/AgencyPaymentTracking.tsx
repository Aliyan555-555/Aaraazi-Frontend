/**
 * Agency Payment Tracking Dashboard
 * Tracks outgoing payments for agency property acquisitions
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Filter,
  Search,
  Download,
  ArrowUpRight,
  Building2,
  TrendingDown,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { formatPKR } from '../../lib/currency';
import { formatDate } from '../../lib/validation';
import { getAgencyAcquisitionPayments, getUpcomingAgencyPayments } from '../../lib/portfolio';
import { getPaymentScheduleInstalments } from '../../lib/paymentSchedule';
import { getProperties } from '../../lib/data';
import { PaymentSchedule, Instalment } from '../../types/paymentSchedule';
import PaymentScheduleRecordingModal from '../PaymentScheduleRecordingModal';
import { toast } from 'sonner';

interface AgencyPaymentTrackingProps {
  onNavigate: (view: string, data?: any) => void;
}

type TimeFilter = 'all' | 'upcoming' | 'overdue' | 'paid';

export default function AgencyPaymentTracking({ onNavigate }: AgencyPaymentTrackingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [selectedPayment, setSelectedPayment] = useState<{ scheduleId: string; instalment: Instalment } | null>(null);

  // Load payment schedules
  const paymentSchedules = getAgencyAcquisitionPayments();
  const properties = getProperties();

  // Get all instalments with schedule and property info
  const allInstalments = useMemo(() => {
    const instalments: Array<{
      instalment: Instalment;
      schedule: PaymentSchedule;
      propertyTitle: string;
      propertyAddress: string;
    }> = [];

    paymentSchedules.forEach(schedule => {
      const property = properties.find(p => p.id === schedule.propertyId);
      const scheduleInstalments = getPaymentScheduleInstalments(schedule.id);

      scheduleInstalments.forEach(instalment => {
        instalments.push({
          instalment,
          schedule,
          propertyTitle: property?.title || 'Unknown Property',
          propertyAddress: property?.address || ''
        });
      });
    });

    return instalments;
  }, [paymentSchedules, properties]);

  // Filter instalments
  const filteredInstalments = useMemo(() => {
    let filtered = allInstalments;

    // Time filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (timeFilter) {
      case 'upcoming':
        filtered = filtered.filter(({ instalment }) => {
          const dueDate = new Date(instalment.dueDate);
          return dueDate >= today && instalment.status === 'pending';
        });
        break;
      case 'overdue':
        filtered = filtered.filter(({ instalment }) => {
          const dueDate = new Date(instalment.dueDate);
          return dueDate < today && instalment.status === 'pending';
        });
        break;
      case 'paid':
        filtered = filtered.filter(({ instalment }) => instalment.status === 'paid');
        break;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(({ propertyTitle, propertyAddress }) =>
        propertyTitle.toLowerCase().includes(query) ||
        propertyAddress.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) =>
      new Date(a.instalment.dueDate).getTime() - new Date(b.instalment.dueDate).getTime()
    );
  }, [allInstalments, timeFilter, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalPending = 0;
    let totalOverdue = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let upcomingCount = 0;

    allInstalments.forEach(({ instalment }) => {
      const dueDate = new Date(instalment.dueDate);

      if (instalment.status === 'paid') {
        totalPaid += instalment.amount;
      } else if (instalment.status === 'pending') {
        totalPending += instalment.amount;
        if (dueDate < today) {
          totalOverdue += instalment.amount;
          overdueCount++;
        } else if (dueDate <= new Date(today.getTime() + selectedDays * 24 * 60 * 60 * 1000)) {
          upcomingCount++;
        }
      }
    });

    return {
      totalPending,
      totalOverdue,
      totalPaid,
      overdueCount,
      upcomingCount,
      totalSchedules: paymentSchedules.length
    };
  }, [allInstalments, selectedDays, paymentSchedules.length]);

  // Get status badge
  const getStatusBadge = (instalment: Instalment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(instalment.dueDate);

    if (instalment.status === 'paid') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Paid
      </Badge>;
    }

    if (instalment.status === 'partial') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="w-3 h-3 mr-1" />
        Partial
      </Badge>;
    }

    if (dueDate < today) {
      return <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Overdue
      </Badge>;
    }

    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Due Soon ({daysUntil}d)
      </Badge>;
    }

    return <Badge variant="outline">
      <Clock className="w-3 h-3 mr-1" />
      Pending
    </Badge>;
  };

  // Handle payment recording
  const handleRecordPayment = (scheduleId: string, instalment: Instalment) => {
    setSelectedPayment({ scheduleId, instalment });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Agency Payment Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Monitor outgoing payments for property acquisitions
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">{formatPKR(stats.totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalSchedules} active payment schedules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-red-600">{formatPKR(stats.totalOverdue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overdueCount} overdue instalment{stats.overdueCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">{stats.upcomingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Due in next {selectedDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-green-600">{formatPKR(stats.totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Completed payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {stats.overdueCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            You have {stats.overdueCount} overdue payment{stats.overdueCount !== 1 ? 's' : ''} totaling {formatPKR(stats.totalOverdue)}.
            Please process these payments immediately to avoid penalties.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDays.toString()} onValueChange={(value) => setSelectedDays(parseInt(value))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Next 7 days</SelectItem>
                <SelectItem value="15">Next 15 days</SelectItem>
                <SelectItem value="30">Next 30 days</SelectItem>
                <SelectItem value="60">Next 60 days</SelectItem>
                <SelectItem value="90">Next 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInstalments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery || timeFilter !== 'all'
                  ? 'No payments found matching your filters'
                  : 'No payment schedules found'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Instalment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstalments.map(({ instalment, schedule, propertyTitle, propertyAddress }) => {
                    const instalmentNumber = getPaymentScheduleInstalments(schedule.id).findIndex(
                      i => i.id === instalment.id
                    ) + 1;

                    return (
                      <TableRow key={instalment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {formatDate(instalment.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{propertyTitle}</p>
                            <p className="text-xs text-muted-foreground">{propertyAddress}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            #{instalmentNumber} of {schedule.numberOfInstalments}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPKR(instalment.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPKR(instalment.paidAmount || 0)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(instalment)}
                        </TableCell>
                        <TableCell className="text-right">
                          {instalment.status !== 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRecordPayment(schedule.id, instalment)}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Record Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add payment recording modal for payment schedules */}
      {selectedPayment && (
        <PaymentScheduleRecordingModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          scheduleId={selectedPayment.scheduleId}
          instalment={selectedPayment.instalment}
          onSuccess={() => {
            setSelectedPayment(null);
            toast.success('Payment recorded successfully');
            // Reload to refresh data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}