import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { User } from '../types';
import { logger } from '../lib/logger';
import {
  Plus,
  ArrowLeft,
  Banknote,
  Building,
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowRightLeft,
  RefreshCw,
  CheckSquare,
  TrendingDown
} from 'lucide-react';

interface BankingTreasuryProps {
  user: User;
}

interface BankAccount {
  id: string;
  accountTitle: string;
  bankName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'money-market' | 'cash-in-hand';
  currentBalance: number;
  lastReconciled?: string;
  isActive: boolean;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface ERPTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  reference: string;
  isMatched: boolean;
}

export const BankingTreasury: React.FC<BankingTreasuryProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<'accounts' | 'reconciliation'>('accounts');
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedBankTransactions, setSelectedBankTransactions] = useState<string[]>([]);
  const [selectedERPTransactions, setSelectedERPTransactions] = useState<string[]>([]);

  // Mock bank accounts data
  const bankAccounts: BankAccount[] = [
    {
      id: '1',
      accountTitle: 'Primary Business Account',
      bankName: 'Bank Alfalah',
      accountNumber: '0012-3456789012',
      accountType: 'checking',
      currentBalance: 2850000,
      lastReconciled: '2024-01-15',
      isActive: true
    },
    {
      id: '2',
      accountTitle: 'Project Development Fund',
      bankName: 'Habib Bank Limited',
      accountNumber: '1234-5678901234',
      accountType: 'money-market',
      currentBalance: 15750000,
      lastReconciled: '2024-01-12',
      isActive: true
    },
    {
      id: '3',
      accountTitle: 'Operating Expenses Account',
      bankName: 'United Bank Limited',
      accountNumber: '9876-5432109876',
      accountType: 'checking',
      currentBalance: 485000,
      lastReconciled: '2024-01-10',
      isActive: true
    },
    {
      id: '4',
      accountTitle: 'Emergency Reserve Fund',
      bankName: 'MCB Bank',
      accountNumber: '5555-4444333322',
      accountType: 'savings',
      currentBalance: 3200000,
      lastReconciled: '2024-01-08',
      isActive: true
    },
    {
      id: '5',
      accountTitle: 'Cash in Hand',
      bankName: 'Office Cash',
      accountNumber: 'CASH-001',
      accountType: 'cash-in-hand',
      currentBalance: 125000,
      lastReconciled: '2024-01-16',
      isActive: true
    }
  ];

  // Mock bank statement transactions
  const bankStatementTransactions: BankTransaction[] = [
    {
      id: 'bst-1',
      date: '2024-01-16',
      description: 'Property Commission - Unit A-1201',
      debit: 0,
      credit: 185000,
      balance: 2850000
    },
    {
      id: 'bst-2',
      date: '2024-01-15',
      description: 'Construction Payment - ABC Construction',
      debit: 125000,
      credit: 0,
      balance: 2665000
    },
    {
      id: 'bst-3',
      date: '2024-01-14',
      description: 'Marketing Campaign Payment',
      debit: 35000,
      credit: 0,
      balance: 2790000
    },
    {
      id: 'bst-4',
      date: '2024-01-13',
      description: 'Rental Income - Commercial Complex',
      debit: 0,
      credit: 85000,
      balance: 2825000
    },
    {
      id: 'bst-5',
      date: '2024-01-12',
      description: 'Legal Fees - Documentation',
      debit: 25000,
      credit: 0,
      balance: 2740000
    }
  ];

  // Mock ERP transactions (unmatched)
  const erpTransactions: ERPTransaction[] = [
    {
      id: 'erp-1',
      date: '2024-01-16',
      description: 'Commission Received - Downtown Towers Unit A-1201',
      amount: 185000,
      type: 'credit',
      category: 'Commission Income',
      reference: 'INV-2024-001',
      isMatched: false
    },
    {
      id: 'erp-2',
      date: '2024-01-15',
      description: 'Construction Payment - Foundation Work',
      amount: 125000,
      type: 'debit',
      category: 'Construction Costs',
      reference: 'BILL-2024-025',
      isMatched: false
    },
    {
      id: 'erp-3',
      date: '2024-01-14',
      description: 'Digital Marketing Campaign - Q1 2024',
      amount: 35000,
      type: 'debit',
      category: 'Marketing Expenses',
      reference: 'EXP-2024-008',
      isMatched: false
    },
    {
      id: 'erp-4',
      date: '2024-01-13',
      description: 'Monthly Rental - Metro Commercial Space',
      amount: 85000,
      type: 'credit',
      category: 'Rental Income',
      reference: 'RENT-2024-001',
      isMatched: false
    },
    {
      id: 'erp-5',
      date: '2024-01-11',
      description: 'Office Supplies Purchase',
      amount: 15000,
      type: 'debit',
      category: 'Office Expenses',
      reference: 'EXP-2024-009',
      isMatched: false
    }
  ];

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <CreditCard className="h-5 w-5" />;
      case 'savings':
        return <Banknote className="h-5 w-5" />;
      case 'money-market':
        return <TrendingUp className="h-5 w-5" />;
      case 'cash-in-hand':
        return <Wallet className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const typeConfig = {
      'checking': { label: 'Checking', color: 'bg-blue-100 text-blue-800' },
      'savings': { label: 'Savings', color: 'bg-green-100 text-green-800' },
      'money-market': { label: 'Money Market', color: 'bg-purple-100 text-purple-800' },
      'cash-in-hand': { label: 'Cash in Hand', color: 'bg-orange-100 text-orange-800' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.checking;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleReconcileAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setViewMode('reconciliation');
    setSelectedBankTransactions([]);
    setSelectedERPTransactions([]);
  };

  const handleBankTransactionSelect = (transactionId: string) => {
    setSelectedBankTransactions(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleERPTransactionSelect = (transactionId: string) => {
    setSelectedERPTransactions(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleMatchTransactions = () => {
    if (selectedBankTransactions.length > 0 && selectedERPTransactions.length > 0) {
      // Reset selections after matching
      setSelectedBankTransactions([]);
      setSelectedERPTransactions([]);

      // Show success message or update UI
      alert('Transactions matched successfully!');
    }
  };

  const totalBalance = bankAccounts.reduce((sum, account) => sum + account.currentBalance, 0);

  if (viewMode === 'reconciliation' && selectedAccount) {
    return (
      <div className="p-6 space-y-6">
        {/* Reconciliation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('accounts');
                setSelectedAccount(null);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Accounts
            </Button>
            <div>
              <h1>Bank Reconciliation</h1>
              <p className="text-muted-foreground">
                {selectedAccount.accountTitle} - {selectedAccount.bankName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleMatchTransactions}
              disabled={selectedBankTransactions.length === 0 || selectedERPTransactions.length === 0}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Match Selected ({selectedBankTransactions.length + selectedERPTransactions.length})
            </Button>
          </div>
        </div>

        {/* Two-Panel Reconciliation Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Bank Statement Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Bank Statement Transactions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Transactions from {selectedAccount.bankName} statement
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankStatementTransactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className={selectedBankTransactions.includes(transaction.id) ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedBankTransactions.includes(transaction.id)}
                          onCheckedChange={() => handleBankTransactionSelect(transaction.id)}
                        />
                      </TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell className="text-right">
                        {transaction.debit > 0 ? (
                          <span className="text-red-600">
                            ${transaction.debit.toLocaleString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.credit > 0 ? (
                          <span className="text-green-600">
                            ${transaction.credit.toLocaleString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Right Panel - ERP Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2" />
                ERP Transactions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Unmatched transactions from system ledger
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {erpTransactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className={selectedERPTransactions.includes(transaction.id) ? 'bg-green-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedERPTransactions.includes(transaction.id)}
                          onCheckedChange={() => handleERPTransactionSelect(transaction.id)}
                        />
                      </TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {transaction.type === 'debit' ? (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          )}
                          <span className={transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'}>
                            ${transaction.amount.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Matching Instructions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckSquare className="h-4 w-4 mr-1 text-blue-500" />
                Select bank transactions (left panel)
              </div>
              <div className="flex items-center">
                <CheckSquare className="h-4 w-4 mr-1 text-green-500" />
                Select corresponding ERP transactions (right panel)
              </div>
              <div className="flex items-center">
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Click "Match Selected" to reconcile
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Banking & Treasury</h1>
          <p className="text-muted-foreground">
            {user.role === 'admin' ? 'Manage all company bank accounts and treasury operations' : 'View assigned accounts and balances'}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-2xl text-foreground">{bankAccounts.length}</p>
                <p className="text-xs text-muted-foreground">{bankAccounts.filter(a => a.isActive).length} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-50">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl text-foreground">
                  ${totalBalance.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">across all accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-50">
                <Wallet className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Cash in Hand</p>
                <p className="text-2xl text-foreground">
                  ${bankAccounts.find(a => a.accountType === 'cash-in-hand')?.currentBalance.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-muted-foreground">physical cash</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-50">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Pending Reconciliations</p>
                <p className="text-2xl text-foreground">3</p>
                <p className="text-xs text-yellow-600">need attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
          <p className="text-sm text-muted-foreground">
            All company bank accounts and cash holdings
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bankAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-muted">
                    {getAccountTypeIcon(account.accountType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{account.accountTitle}</h3>
                      {getAccountTypeBadge(account.accountType)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <span>{account.bankName}</span>
                      <span className="font-mono">{account.accountNumber}</span>
                      {account.lastReconciled && (
                        <span>Last reconciled: {new Date(account.lastReconciled).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-lg">
                      ${account.currentBalance.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleReconcileAccount(account)}
                    disabled={account.accountType === 'cash-in-hand'}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconcile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};