import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { StatusBadge } from '../../layout/StatusBadge';
import { formatPKR } from '../../../lib/currency';
import { Eye, CheckCircle, XCircle, Edit, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

// Expense interface based on current usage
export interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Paid';
  propertyId?: string;
  propertyTitle?: string;
  agentId?: string;
  vendor?: string;
  receiptNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ExpenseListProps {
  expenses: ExpenseItem[];
  selectedExpenses: string[];
  onSelectionChange: (selected: string[]) => void;
  onViewProperty?: (propertyId: string) => void;
  onEdit?: (expense: ExpenseItem) => void;
  onDelete?: (expenseId: string) => void;
  onApprove?: (expenseId: string) => void;
  onReject?: (expenseId: string) => void;
  userRole: 'admin' | 'agent';
}

/**
 * ExpenseList Component
 * 
 * Table displaying all expense records with selection, filtering, and actions.
 * 
 * Design System V4.1 Compliant:
 * - Uses Shadcn Table components
 * - Uses StatusBadge for status display
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Fitts's Law: Large checkboxes (44x44px target)
 * - Hick's Law: Actions in dropdown menu
 * - Jakob's Law: Standard table layout
 * 
 * Features:
 * - Multi-select with checkboxes
 * - Status badges with color coding
 * - Action dropdown per row
 * - Click row to view property
 * - Admin-only actions (approve, reject, delete)
 * - Edit functionality
 * 
 * @example
 * <ExpenseList
 *   expenses={expenses}
 *   selectedExpenses={selected}
 *   onSelectionChange={setSelected}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onApprove={handleApprove}
 *   userRole={user.role}
 * />
 */
export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  selectedExpenses,
  onSelectionChange,
  onViewProperty,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  userRole,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(expenses.map(e => e.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (expenseId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedExpenses, expenseId]);
    } else {
      onSelectionChange(selectedExpenses.filter(id => id !== expenseId));
    }
  };

  const isAllSelected = expenses.length > 0 && selectedExpenses.length === expenses.length;
  const isSomeSelected = selectedExpenses.length > 0 && !isAllSelected;

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
                aria-label="Select all expenses"
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                No expenses found
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow
                key={expense.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredRow(expense.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => {
                  if (expense.propertyId && onViewProperty) {
                    onViewProperty(expense.propertyId);
                  }
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedExpenses.includes(expense.id)}
                    onCheckedChange={(checked) => handleSelectOne(expense.id, checked as boolean)}
                    aria-label={`Select expense: ${expense.description}`}
                  />
                </TableCell>
                <TableCell>
                  <p className="text-gray-900">
                    {new Date(expense.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-gray-900">{expense.category}</p>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-gray-900 max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </p>
                    {expense.receiptNumber && (
                      <p className="text-gray-500">#{expense.receiptNumber}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-gray-600 max-w-xs truncate" title={expense.propertyTitle}>
                    {expense.propertyTitle || '-'}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-gray-600">{expense.vendor || '-'}</p>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-gray-900">{formatPKR(expense.amount)}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={expense.status.toLowerCase()} />
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {expense.propertyId && onViewProperty && (
                        <DropdownMenuItem onClick={() => onViewProperty(expense.propertyId!)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Property
                        </DropdownMenuItem>
                      )}
                      
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      
                      {userRole === 'admin' && (
                        <>
                          {expense.status === 'Pending' && onApprove && (
                            <DropdownMenuItem 
                              onClick={() => onApprove(expense.id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          
                          {expense.status === 'Pending' && onReject && (
                            <DropdownMenuItem 
                              onClick={() => onReject(expense.id)}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(expense.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </>
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
