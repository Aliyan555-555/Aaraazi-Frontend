import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Download,
  User as UserIcon,
  Building2,
  CreditCard,
  History,
  Calculator
} from 'lucide-react';
import { formatPKR } from '../lib/currency';
import { User } from '../types';
import { toast } from 'sonner';

interface Installment {
  id: string;
  name: string;
  dueDate: string;
  amountDue: number;
  status: 'paid' | 'due' | 'overdue';
  paidDate?: string;
  paidAmount?: number;
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
}

interface CustomerInstallmentPlan {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  unitNumber: string;
  projectName: string;
  unitType: string;
  totalSalePrice: number;
  totalPaid: number;
  remainingAmount: number;
  bookingDate: string;
  possessionDate: string;
  installments: Installment[];
}

interface PaymentRecordData {
  installmentId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber: string;
  notes: string;
}

interface CustomerInstallmentDetailsProps {
  user: User;
  onBack: () => void;
  customerId?: string; // In real app, this would be passed from navigation
}

// Mock data for a customer's installment plan
const mockInstallmentPlan: CustomerInstallmentPlan = {
  id: 'PLAN-001',
  customerName: 'Ahmed Hassan',
  customerEmail: 'ahmed.hassan@email.com',
  customerPhone: '+92-300-1234567',
  unitNumber: 'A-404',
  projectName: 'Gulshan Heights',
  unitType: '3 Bed Apartment',
  totalSalePrice: 15000000,
  totalPaid: 4500000,
  remainingAmount: 10500000,
  bookingDate: '2024-01-15',
  possessionDate: '2025-12-31',
  installments: [
    {
      id: 'INST-001',
      name: 'Booking Amount',
      dueDate: '2024-01-15',
      amountDue: 1500000,
      status: 'paid',
      paidDate: '2024-01-15',
      paidAmount: 1500000,
      paymentMethod: 'Bank Transfer',
      receiptNumber: 'RCP-001',
      notes: 'Initial booking payment'
    },
    {
      id: 'INST-002',
      name: '1st Quarter Payment',
      dueDate: '2024-04-15',
      amountDue: 3000000,
      status: 'paid',
      paidDate: '2024-04-10',
      paidAmount: 3000000,
      paymentMethod: 'Cheque',
      receiptNumber: 'RCP-002',
      notes: 'Paid early'
    },
    {
      id: 'INST-003',
      name: '2nd Quarter Payment',
      dueDate: '2024-07-15',
      amountDue: 3000000,
      status: 'overdue',
      notes: 'Customer requested extension'
    },
    {
      id: 'INST-004',
      name: '3rd Quarter Payment',
      dueDate: '2024-10-15',
      amountDue: 3000000,
      status: 'due'
    },
    {
      id: 'INST-005',
      name: '4th Quarter Payment',
      dueDate: '2025-01-15',
      amountDue: 2250000,
      status: 'due'
    },
    {
      id: 'INST-006',
      name: 'On Possession',
      dueDate: '2025-12-31',
      amountDue: 2250000,
      status: 'due'
    }
  ]
};

export const CustomerInstallmentDetails: React.FC<CustomerInstallmentDetailsProps> = ({
  user,
  onBack
}) => {
  const [installmentPlan, setInstallmentPlan] = useState<CustomerInstallmentPlan>(mockInstallmentPlan);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [loading, setLoading] = useState(false);

  const [paymentData, setPaymentData] = useState<PaymentRecordData>({
    installmentId: '',
    amountPaid: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    receiptNumber: '',
    notes: ''
  });

  // Calculate payment statistics
  const paymentStats = useMemo(() => {
    const paid = installmentPlan.installments.filter(i => i.status === 'paid').length;
    const due = installmentPlan.installments.filter(i => i.status === 'due').length;
    const overdue = installmentPlan.installments.filter(i => i.status === 'overdue').length;
    const total = installmentPlan.installments.length;
    const completionPercentage = Math.round((paid / total) * 100);

    return { paid, due, overdue, total, completionPercentage };
  }, [installmentPlan]);

  const handleRecordPayment = (installment: Installment) => {
    setSelectedInstallment(installment);
    setPaymentData({
      installmentId: installment.id,
      amountPaid: installment.amountDue,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      receiptNumber: '',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedInstallment || !paymentData.paymentMethod || !paymentData.receiptNumber) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // Update the installment with payment information
      const updatedInstallments = installmentPlan.installments.map(installment => {
        if (installment.id === selectedInstallment.id) {
          return {
            ...installment,
            status: 'paid' as const,
            paidDate: paymentData.paymentDate,
            paidAmount: paymentData.amountPaid,
            paymentMethod: paymentData.paymentMethod,
            receiptNumber: paymentData.receiptNumber,
            notes: paymentData.notes
          };
        }
        return installment;
      });

      // Recalculate totals
      const newTotalPaid = updatedInstallments
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.paidAmount || 0), 0);

      const updatedPlan = {
        ...installmentPlan,
        installments: updatedInstallments,
        totalPaid: newTotalPaid,
        remainingAmount: installmentPlan.totalSalePrice - newTotalPaid
      };

      setInstallmentPlan(updatedPlan);
      setIsPaymentModalOpen(false);
      toast.success('Payment recorded successfully');
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Installment['status']) => {
    const variants = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      due: 'bg-gray-100 text-gray-800 border-gray-200',
      overdue: 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      paid: <CheckCircle className="h-3 w-3" />,
      due: <Clock className="h-3 w-3" />,
      overdue: <AlertCircle className="h-3 w-3" />
    };

    const labels = {
      paid: 'Paid',
      due: 'Due',
      overdue: 'Overdue'
    };

    return (
      <Badge className={`${variants[status]} border flex items-center gap-1`}>
        {icons[status]}
        {labels[status]}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'paid') return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  // Update overdue status based on current date
  const updatedInstallments = installmentPlan.installments.map(installment => ({
    ...installment,
    status: (installment.status === 'paid'
      ? 'paid'
      : isOverdue(installment.dueDate, installment.status)
        ? 'overdue'
        : 'due') as Installment['status']
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Customer Installment Plan</h1>
              <p className="text-gray-600 mt-1">
                Payment schedule and tracking for {installmentPlan.customerName}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Statement
            </Button>
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              Payment History
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Customer and Unit Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-blue-600" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-medium">{installmentPlan.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-sm">{installmentPlan.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{installmentPlan.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Booking Date</p>
                <p className="font-medium">
                  {new Date(installmentPlan.bookingDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Unit Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Unit Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Unit Number</p>
                <p className="font-medium text-lg">{installmentPlan.unitNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Project</p>
                <p className="font-medium">{installmentPlan.projectName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unit Type</p>
                <p className="font-medium">{installmentPlan.unitType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expected Possession</p>
                <p className="font-medium">
                  {new Date(installmentPlan.possessionDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-600" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Sale Price</p>
                <p className="font-medium text-lg">{formatPKR(installmentPlan.totalSalePrice)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="font-medium text-green-600">{formatPKR(installmentPlan.totalPaid)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Remaining</p>
                <p className="font-medium text-orange-600">{formatPKR(installmentPlan.remainingAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${paymentStats.completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{paymentStats.completionPercentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Paid Installments</p>
                  <p className="text-2xl font-bold text-green-800">{paymentStats.paid}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Due Installments</p>
                  <p className="text-2xl font-bold text-gray-800">{paymentStats.due}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Overdue Installments</p>
                  <p className="text-2xl font-bold text-red-800">{paymentStats.overdue}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Total Installments</p>
                  <p className="text-2xl font-bold text-blue-800">{paymentStats.total}</p>
                </div>
                <Receipt className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installment Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Installment Schedule
            </CardTitle>
            <CardDescription>
              Detailed payment schedule and status tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Installment Name</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {updatedInstallments.map((installment) => (
                    <TableRow
                      key={installment.id}
                      className={`hover:bg-gray-50 ${installment.status === 'overdue' ? 'bg-red-50' : ''
                        }`}
                    >
                      <TableCell className="font-medium">
                        {installment.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(installment.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPKR(installment.amountDue)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(installment.status)}
                      </TableCell>
                      <TableCell>
                        {installment.paidDate ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {new Date(installment.paidDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {installment.paymentMethod || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        {installment.receiptNumber || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        {installment.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => handleRecordPayment(installment)}
                            className={`gap-2 ${installment.status === 'overdue'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                          >
                            <CreditCard className="h-4 w-4" />
                            Record Payment
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Recording Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record payment for {selectedInstallment?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount Due:</span>
                <span className="font-medium">{formatPKR(selectedInstallment?.amountDue || 0)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount Paid *</Label>
              <Input
                id="amountPaid"
                type="number"
                value={paymentData.amountPaid || ''}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  amountPaid: parseFloat(e.target.value) || 0
                }))}
                placeholder="Enter amount paid"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  paymentDate: e.target.value
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) => setPaymentData(prev => ({
                  ...prev,
                  paymentMethod: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online-payment">Online Payment</SelectItem>
                  <SelectItem value="demand-draft">Demand Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt Number *</Label>
              <Input
                id="receiptNumber"
                value={paymentData.receiptNumber}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  receiptNumber: e.target.value
                }))}
                placeholder="Enter receipt number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="Additional notes (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePayment}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Record Payment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};