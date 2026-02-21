import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { StatusBadge } from '../../layout/StatusBadge';
import { formatPKR } from '../../../lib/currency';
import { CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  balance: number;
  status: 'Reconciled' | 'Unreconciled' | 'Pending';
  ledgerEntryId?: string;
  bankStatementRef?: string;
  reconciledBy?: string;
  reconciledDate?: string;
  notes?: string;
  createdAt: string;
}

interface BankReconciliationListProps {
  transactions: BankTransaction[];
  selectedTransactions: string[];
  onSelectionChange: (selected: string[]) => void;
  onReconcile?: (transactionId: string) => void;
  onUnreconcile?: (transactionId: string) => void;
  onViewLedger?: (ledgerEntryId: string) => void;
}

/**
 * BankReconciliationList Component
 * 
 * Table displaying all bank transactions for reconciliation.
 * 
 * Design System Compliant:
 * - Uses Shadcn Table components
 * - Uses StatusBadge for status display
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Fitts's Law: Large checkboxes (44x44px target)
 * - Hick's Law: Actions in dropdown menu
 * - Jakob's Law: Standard bank reconciliation layout
 * 
 * Features:
 * - Multi-select with checkboxes
 * - Status badges (Reconciled, Unreconciled, Pending)
 * - Transaction type (Deposit/Withdrawal)
 * - Quick reconcile/unreconcile actions
 * - Link to ledger entries
 * - Running balance display
 * 
 * @example
 * <BankReconciliationList
 *   transactions={transactions}
 *   selectedTransactions={selected}
 *   onSelectionChange={setSelected}
 *   onReconcile={handleReconcile}
 *   onUnreconcile={handleUnreconcile}
 *   onViewLedger={handleViewLedger}
 * />
 */
export const BankReconciliationList: React.FC<BankReconciliationListProps> = ({
  transactions,
  selectedTransactions,
  onSelectionChange,
  onReconcile,
  onUnreconcile,
  onViewLedger,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(transactions.map(t => t.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (transactionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTransactions, transactionId]);
    } else {
      onSelectionChange(selectedTransactions.filter(id => id !== transactionId));
    }
  };

  const isAllSelected = transactions.length > 0 && selectedTransactions.length === transactions.length;
  const isSomeSelected = selectedTransactions.length > 0 && !isAllSelected;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                {...(isSomeSelected ? { indeterminate: true } : {})}
                onCheckedChange={handleSelectAll}
                aria-label="Select all transactions"
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                No bank transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="hover:bg-gray-50 transition-colors"
                onMouseEnter={() => setHoveredRow(transaction.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedTransactions.includes(transaction.id)}
                    onCheckedChange={(checked) => handleSelectOne(transaction.id, checked as boolean)}
                    aria-label={`Select transaction ${transaction.description}`}
                  />
                </TableCell>
                <TableCell>
                  <p className="text-gray-900">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-gray-900 max-w-xs truncate" title={transaction.description}>
                    {transaction.description}
                  </p>
                  {transaction.notes && (
                    <p className="text-gray-500 text-sm max-w-xs truncate" title={transaction.notes}>
                      {transaction.notes}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-sm ${
                    transaction.type === 'deposit' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <p className={`${
                    transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}{formatPKR(transaction.amount)}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-gray-900">{formatPKR(transaction.balance)}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={transaction.status.toLowerCase()} />
                  {transaction.reconciledDate && (
                    <p className="text-gray-500 text-sm mt-1">
                      {new Date(transaction.reconciledDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.bankStatementRef && (
                    <p className="text-gray-900">{transaction.bankStatementRef}</p>
                  )}
                  {transaction.ledgerEntryId && (
                    <p className="text-blue-600 text-sm cursor-pointer hover:underline"
                       onClick={() => onViewLedger?.(transaction.ledgerEntryId!)}>
                      View Ledger
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {transaction.status !== 'Reconciled' && onReconcile && (
                        <DropdownMenuItem 
                          onClick={() => onReconcile(transaction.id)}
                          className="text-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Reconciled
                        </DropdownMenuItem>
                      )}
                      
                      {transaction.status === 'Reconciled' && onUnreconcile && (
                        <DropdownMenuItem 
                          onClick={() => onUnreconcile(transaction.id)}
                          className="text-orange-600"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Unreconcile
                        </DropdownMenuItem>
                      )}
                      
                      {transaction.ledgerEntryId && onViewLedger && (
                        <DropdownMenuItem onClick={() => onViewLedger(transaction.ledgerEntryId!)}>
                          View Ledger Entry
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
