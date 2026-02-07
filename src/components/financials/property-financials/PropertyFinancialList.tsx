import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { StatusBadge } from '../../layout/StatusBadge';
import { formatPKR } from '../../../lib/currency';
import { Eye, TrendingUp, TrendingDown, FileText, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

export interface PropertyFinancialSummary {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  status: 'active' | 'sold' | 'rented';
  
  // Financial summary
  totalInvestment: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  roi: number;
  
  // Timeline
  acquisitionDate?: string;
  saleDate?: string;
  holdingPeriod?: number; // days
  
  // Transaction count
  transactionCount: number;
}

interface PropertyFinancialListProps {
  properties: PropertyFinancialSummary[];
  selectedProperties: string[];
  onSelectionChange: (selected: string[]) => void;
  onViewProperty?: (propertyId: string) => void;
  onViewProfitLoss?: (propertyId: string) => void;
  onViewTransactions?: (propertyId: string) => void;
}

/**
 * PropertyFinancialList Component
 * 
 * Table displaying financial summaries for all properties.
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
 * - Financial metrics per property
 * - ROI percentage with color coding
 * - Status badges
 * - Action dropdown per row
 * - Click row to view property details
 * 
 * @example
 * <PropertyFinancialList
 *   properties={propertyFinancials}
 *   selectedProperties={selected}
 *   onSelectionChange={setSelected}
 *   onViewProperty={handleViewProperty}
 *   onViewProfitLoss={handleViewPL}
 * />
 */
export const PropertyFinancialList: React.FC<PropertyFinancialListProps> = ({
  properties,
  selectedProperties,
  onSelectionChange,
  onViewProperty,
  onViewProfitLoss,
  onViewTransactions,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(properties.map(p => p.propertyId));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (propertyId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedProperties, propertyId]);
    } else {
      onSelectionChange(selectedProperties.filter(id => id !== propertyId));
    }
  };

  const isAllSelected = properties.length > 0 && selectedProperties.length === properties.length;
  const isSomeSelected = selectedProperties.length > 0 && !isAllSelected;

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
                aria-label="Select all properties"
              />
            </TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Investment</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Expenses</TableHead>
            <TableHead className="text-right">Net Profit</TableHead>
            <TableHead className="text-right">ROI</TableHead>
            <TableHead className="text-center">Transactions</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                No property financials found
              </TableCell>
            </TableRow>
          ) : (
            properties.map((property) => (
              <TableRow
                key={property.propertyId}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredRow(property.propertyId)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => {
                  if (onViewProperty) {
                    onViewProperty(property.propertyId);
                  }
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedProperties.includes(property.propertyId)}
                    onCheckedChange={(checked) => handleSelectOne(property.propertyId, checked as boolean)}
                    aria-label={`Select ${property.propertyTitle}`}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-gray-900 max-w-xs truncate" title={property.propertyTitle}>
                      {property.propertyTitle}
                    </p>
                    <p className="text-gray-500 max-w-xs truncate" title={property.propertyAddress}>
                      {property.propertyAddress}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={property.status} />
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-gray-900">{formatPKR(property.totalInvestment)}</p>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-gray-900">{formatPKR(property.totalRevenue)}</p>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-gray-900">{formatPKR(property.totalExpenses)}</p>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {property.netProfit >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <p className={property.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatPKR(property.netProfit)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <p 
                    className={
                      property.roi >= 15 
                        ? "text-green-600" 
                        : property.roi >= 5 
                        ? "text-blue-600" 
                        : property.roi >= 0 
                        ? "text-gray-600" 
                        : "text-red-600"
                    }
                  >
                    {property.roi.toFixed(2)}%
                  </p>
                </TableCell>
                <TableCell className="text-center">
                  <p className="text-gray-600">{property.transactionCount}</p>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewProperty && (
                        <DropdownMenuItem onClick={() => onViewProperty(property.propertyId)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Property
                        </DropdownMenuItem>
                      )}
                      
                      {onViewProfitLoss && (
                        <DropdownMenuItem onClick={() => onViewProfitLoss(property.propertyId)}>
                          <FileText className="h-4 w-4 mr-2" />
                          View P&L Report
                        </DropdownMenuItem>
                      )}
                      
                      {onViewTransactions && (
                        <DropdownMenuItem onClick={() => onViewTransactions(property.propertyId)}>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          View Transactions
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
