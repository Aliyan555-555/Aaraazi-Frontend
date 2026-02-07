import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { StatusBadge } from '../../layout/StatusBadge';
import { formatPKR } from '../../../lib/currency';
import { Eye, CheckCircle, XCircle, Send, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

export interface InvestorDistributionRecord {
  id: string;
  investorId: string;
  investorName: string;
  propertyId: string;
  propertyTitle: string;
  distributionType: 'rental-income' | 'sale-profit' | 'quarterly-dividend' | 'annual-dividend';
  amount: number;
  ownershipPercentage: number;
  distributionDate: string;
  scheduledDate: string;
  status: 'Scheduled' | 'Pending' | 'Approved' | 'Paid' | 'Failed';
  paymentMethod?: 'bank-transfer' | 'cheque' | 'cash';
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvestorDistributionListProps {
  distributions: InvestorDistributionRecord[];
  selectedDistributions: string[];
  onSelectionChange: (selected: string[]) => void;
  onViewInvestor?: (investorId: string) => void;
  onViewProperty?: (propertyId: string) => void;
  onApprove?: (distributionId: string) => void;
  onReject?: (distributionId: string) => void;
  onMarkPaid?: (distributionId: string) => void;
  userRole: 'admin' | 'agent';
}

/**
 * InvestorDistributionList Component
 * 
 * Table displaying all investor profit distribution records.
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
 * - Distribution type labels
 * - Action dropdown per row
 * - Click row to view investor/property
 * - Admin-only actions (approve, reject, mark paid)
 * 
 * @example
 * <InvestorDistributionList
 *   distributions={distributions}
 *   selectedDistributions={selected}
 *   onSelectionChange={setSelected}
 *   onViewInvestor={handleViewInvestor}
 *   onViewProperty={handleViewProperty}
 *   onApprove={handleApprove}
 *   userRole={user.role}
 * />
 */
export const InvestorDistributionList: React.FC<InvestorDistributionListProps> = ({
  distributions,
  selectedDistributions,
  onSelectionChange,
  onViewInvestor,
  onViewProperty,
  onApprove,
  onReject,
  onMarkPaid,
  userRole,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(distributions.map(d => d.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (distributionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedDistributions, distributionId]);
    } else {
      onSelectionChange(selectedDistributions.filter(id => id !== distributionId));
    }
  };

  const isAllSelected = distributions.length > 0 && selectedDistributions.length === distributions.length;
  const isSomeSelected = selectedDistributions.length > 0 && !isAllSelected;

  const getDistributionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'rental-income': 'Rental Income',
      'sale-profit': 'Sale Profit',
      'quarterly-dividend': 'Quarterly Dividend',
      'annual-dividend': 'Annual Dividend',
    };
    return labels[type] || type;
  };

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
                aria-label="Select all distributions"
              />
            </TableHead>
            <TableHead>Investor</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Ownership %</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {distributions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                No investor distributions found
              </TableCell>
            </TableRow>
          ) : (
            distributions.map((distribution) => (
              <TableRow
                key={distribution.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredRow(distribution.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => {
                  if (onViewInvestor) {
                    onViewInvestor(distribution.investorId);
                  }
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedDistributions.includes(distribution.id)}
                    onCheckedChange={(checked) => handleSelectOne(distribution.id, checked as boolean)}
                    aria-label={`Select distribution for ${distribution.investorName}`}
                  />
                </TableCell>
                <TableCell>
                  <p className="text-gray-900 max-w-xs truncate" title={distribution.investorName}>
                    {distribution.investorName}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-gray-600 max-w-xs truncate" title={distribution.propertyTitle}>
                    {distribution.propertyTitle}
                  </p>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {getDistributionTypeLabel(distribution.distributionType)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-gray-900">{distribution.ownershipPercentage.toFixed(2)}%</p>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-gray-900">{formatPKR(distribution.amount)}</p>
                </TableCell>
                <TableCell>
                  <p className="text-gray-900">
                    {new Date(distribution.scheduledDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={distribution.status.toLowerCase()} />
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewInvestor && (
                        <DropdownMenuItem onClick={() => onViewInvestor(distribution.investorId)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Investor
                        </DropdownMenuItem>
                      )}
                      
                      {onViewProperty && (
                        <DropdownMenuItem onClick={() => onViewProperty(distribution.propertyId)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Property
                        </DropdownMenuItem>
                      )}
                      
                      {userRole === 'admin' && (
                        <>
                          {distribution.status === 'Pending' && onApprove && (
                            <DropdownMenuItem 
                              onClick={() => onApprove(distribution.id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          
                          {distribution.status === 'Pending' && onReject && (
                            <DropdownMenuItem 
                              onClick={() => onReject(distribution.id)}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          
                          {distribution.status === 'Approved' && onMarkPaid && (
                            <DropdownMenuItem 
                              onClick={() => onMarkPaid(distribution.id)}
                              className="text-blue-600"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Mark as Paid
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
