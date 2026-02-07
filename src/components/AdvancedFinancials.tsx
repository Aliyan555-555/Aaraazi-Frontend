import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft,
  Users,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Plus,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calculator
} from 'lucide-react';
import { formatPKR } from '../lib/currency';
import { User } from '../types';
import { CustomerInstallmentDetails } from './CustomerInstallmentDetails';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitNumber: string;
  projectName: string;
  unitType: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'active' | 'completed' | 'defaulted';
  bookingDate: string;
  nextDueDate: string;
  nextDueAmount: number;
  overdueDays: number;
}

interface LoanApplication {
  id: string;
  customerName: string;
  unitNumber: string;
  loanAmount: number;
  bankName: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  applicationDate: string;
  approvalDate?: string;
  interestRate: number;
  tenure: number;
}

interface AdvancedFinancialsProps {
  user: User;
  onBack: () => void;
}

// Mock customer installment data
const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    phone: '+92-300-1234567',
    unitNumber: 'A-404',
    projectName: 'Gulshan Heights',
    unitType: '3 Bed Apartment',
    totalAmount: 15000000,
    paidAmount: 4500000,
    remainingAmount: 10500000,
    status: 'active',
    bookingDate: '2024-01-15',
    nextDueDate: '2024-07-15',
    nextDueAmount: 3000000,
    overdueDays: 45
  },
  {
    id: 'CUST-002',
    name: 'Fatima Khan',
    email: 'fatima.khan@email.com',
    phone: '+92-321-9876543',
    unitNumber: 'B-205',
    projectName: 'Marina View',
    unitType: '2 Bed Apartment',
    totalAmount: 12000000,
    paidAmount: 12000000,
    remainingAmount: 0,
    status: 'completed',
    bookingDate: '2023-08-20',
    nextDueDate: '',
    nextDueAmount: 0,
    overdueDays: 0
  },
  {
    id: 'CUST-003',
    name: 'Muhammad Ali',
    email: 'muhammad.ali@email.com',
    phone: '+92-333-5555555',
    unitNumber: 'C-102',
    projectName: 'City Square',
    unitType: '1 Bed Studio',
    totalAmount: 8500000,
    paidAmount: 2550000,
    remainingAmount: 5950000,
    status: 'active',
    bookingDate: '2024-03-10',
    nextDueDate: '2024-06-10',
    nextDueAmount: 2125000,
    overdueDays: 0
  },
  {
    id: 'CUST-004',
    name: 'Sarah Ahmed',
    email: 'sarah.ahmed@email.com',
    phone: '+92-300-7777777',
    unitNumber: 'D-301',
    projectName: 'Green Valley',
    unitType: '4 Bed Villa',
    totalAmount: 25000000,
    paidAmount: 5000000,
    remainingAmount: 20000000,
    status: 'defaulted',
    bookingDate: '2023-12-01',
    nextDueDate: '2024-03-01',
    nextDueAmount: 6250000,
    overdueDays: 120
  }
];

// Mock loan applications data
const mockLoanApplications: LoanApplication[] = [
  {
    id: 'LOAN-001',
    customerName: 'Ahmed Hassan',
    unitNumber: 'A-404',
    loanAmount: 10000000,
    bankName: 'HBL',
    status: 'approved',
    applicationDate: '2024-01-20',
    approvalDate: '2024-02-15',
    interestRate: 15.5,
    tenure: 15
  },
  {
    id: 'LOAN-002',
    customerName: 'Muhammad Ali',
    unitNumber: 'C-102',
    loanAmount: 6000000,
    bankName: 'UBL',
    status: 'pending',
    applicationDate: '2024-05-10',
    interestRate: 16.0,
    tenure: 12
  },
  {
    id: 'LOAN-003',
    customerName: 'Sarah Ahmed',
    unitNumber: 'D-301',
    loanAmount: 18000000,
    bankName: 'Meezan Bank',
    status: 'rejected',
    applicationDate: '2024-02-01',
    interestRate: 14.5,
    tenure: 20
  }
];

export const AdvancedFinancials: React.FC<AdvancedFinancialsProps> = ({
  user,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState('installments');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return mockCustomers;
    
    return mockCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalCustomers = mockCustomers.length;
    const activeCustomers = mockCustomers.filter(c => c.status === 'active').length;
    const completedCustomers = mockCustomers.filter(c => c.status === 'completed').length;
    const defaultedCustomers = mockCustomers.filter(c => c.status === 'defaulted').length;
    
    const totalReceivable = mockCustomers.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalReceived = mockCustomers.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalOutstanding = mockCustomers.reduce((sum, c) => sum + c.remainingAmount, 0);
    
    const overdueCustomers = mockCustomers.filter(c => c.overdueDays > 0).length;
    const totalOverdueAmount = mockCustomers
      .filter(c => c.overdueDays > 0)
      .reduce((sum, c) => sum + c.nextDueAmount, 0);

    const pendingLoans = mockLoanApplications.filter(l => l.status === 'pending').length;
    const approvedLoans = mockLoanApplications.filter(l => l.status === 'approved' || l.status === 'disbursed').length;

    return {
      totalCustomers,
      activeCustomers,
      completedCustomers,
      defaultedCustomers,
      totalReceivable,
      totalReceived,
      totalOutstanding,
      overdueCustomers,
      totalOverdueAmount,
      pendingLoans,
      approvedLoans
    };
  }, []);

  const getStatusBadge = (status: Customer['status']) => {
    const variants = {
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      defaulted: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
      active: 'Active',
      completed: 'Completed',
      defaulted: 'Defaulted'
    };

    return (
      <Badge className={`${variants[status]} border`}>
        {labels[status]}
      </Badge>
    );
  };

  const getLoanStatusBadge = (status: LoanApplication['status']) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      disbursed: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      disbursed: 'Disbursed'
    };

    return (
      <Badge className={`${variants[status]} border`}>
        {labels[status]}
      </Badge>
    );
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  if (selectedCustomer) {
    return (
      <CustomerInstallmentDetails
        user={user}
        onBack={() => setSelectedCustomer(null)}
        customerId={selectedCustomer.id}
      />
    );
  }

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
              <h1 className="text-2xl font-semibold text-gray-900">Advanced Financials</h1>
              <p className="text-gray-600 mt-1">
                Loan & installment management for customer financing
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <Users className="h-5 w-5" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {kpis.totalCustomers}
              </div>
              <p className="text-sm text-blue-700">
                {kpis.activeCustomers} active, {kpis.completedCustomers} completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                Total Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 mb-2">
                {formatPKR(kpis.totalReceived)}
              </div>
              <p className="text-sm text-green-700">
                Collection efficiency: {Math.round((kpis.totalReceived / kpis.totalReceivable) * 100)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                <TrendingDown className="h-5 w-5" />
                Outstanding Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 mb-2">
                {formatPKR(kpis.totalOutstanding)}
              </div>
              <p className="text-sm text-orange-700">
                {kpis.overdueCustomers} customers overdue
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Overdue Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900 mb-2">
                {formatPKR(kpis.totalOverdueAmount)}
              </div>
              <p className="text-sm text-red-700">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="installments" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Customer Installments
                </TabsTrigger>
                <TabsTrigger value="loans" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Loan Applications
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              
              {/* Customer Installments Tab */}
              <TabsContent value="installments" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Customer Installment Plans</h3>
                    <p className="text-sm text-gray-600">
                      Track and manage customer payment schedules
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Customer</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Next Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow 
                          key={customer.id} 
                          className={`hover:bg-gray-50 cursor-pointer ${
                            customer.overdueDays > 0 ? 'bg-red-50' : ''
                          }`}
                          onClick={() => handleCustomerClick(customer)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.unitNumber}</div>
                              <div className="text-sm text-gray-600">{customer.projectName}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPKR(customer.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <div className="text-green-600 font-medium">
                              {formatPKR(customer.paidAmount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {Math.round((customer.paidAmount / customer.totalAmount) * 100)}% completed
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-orange-600 font-medium">
                              {formatPKR(customer.remainingAmount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.nextDueDate ? (
                              <div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">
                                    {new Date(customer.nextDueDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="text-sm font-medium">
                                  {formatPKR(customer.nextDueAmount)}
                                </div>
                                {customer.overdueDays > 0 && (
                                  <div className="text-sm text-red-600">
                                    {customer.overdueDays} days overdue
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No pending</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(customer.status)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={(e:any) => {
                                e.stopPropagation();
                                handleCustomerClick(customer);
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Loan Applications Tab */}
              <TabsContent value="loans" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Loan Applications</h3>
                    <p className="text-sm text-gray-600">
                      Bank loan applications and approvals for customers
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">{kpis.pendingLoans}</div>
                        <div className="text-gray-600">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{kpis.approvedLoans}</div>
                        <div className="text-gray-600">Approved</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Customer</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Tenure</TableHead>
                        <TableHead>Application Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockLoanApplications.map((loan) => (
                        <TableRow key={loan.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {loan.customerName}
                          </TableCell>
                          <TableCell>
                            {loan.unitNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPKR(loan.loanAmount)}
                          </TableCell>
                          <TableCell>
                            {loan.bankName}
                          </TableCell>
                          <TableCell>
                            {loan.interestRate}%
                          </TableCell>
                          <TableCell>
                            {loan.tenure} years
                          </TableCell>
                          <TableCell>
                            {new Date(loan.applicationDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            {getLoanStatusBadge(loan.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};