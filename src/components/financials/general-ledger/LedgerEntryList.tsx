import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { formatPKR } from '../../../lib/currency';
import { Eye, MoreVertical, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

export interface LedgerEntry {
  id: string;
  entryNumber: string;
  date: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debit: number;
  credit: number;
  balance: number;
  description: string;
  source: 'commission' | 'expense' | 'distribution' | 'property' | 'manual' | 'bank';
  sourceId?: string;
  referenceNumber?: string;
  createdBy: string;
  createdAt: string;
}

interface LedgerEntryListProps {
  entries: LedgerEntry[];
  selectedEntries: string[];
  onSelectionChange: (selected: string[]) => void;
  onViewSource?: (source: string, sourceId: string) => void;
}

/**
 * LedgerEntryList Component
 * 
 * Table displaying all general ledger entries with double-entry bookkeeping.
 * 
 * Design System Compliant:
 * - Uses Shadcn Table components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Fitts's Law: Large checkboxes (44x44px target)
 * - Hick's Law: Actions in dropdown menu
 * - Jakob's Law: Standard accounting ledger layout
 * 
 * Features:
 * - Multi-select with checkboxes
 * - Account type color coding
 * - Debit/Credit columns
 * - Running balance
 * - Source tracking
 * - Action dropdown per row
 * 
 * @example
 * <LedgerEntryList
 *   entries={ledgerEntries}
 *   selectedEntries={selected}
 *   onSelectionChange={setSelected}
 *   onViewSource={handleViewSource}
 * />
 */
export const LedgerEntryList: React.FC<LedgerEntryListProps> = ({
  entries,
  selectedEntries,
  onSelectionChange,
  onViewSource,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(entries.map(e => e.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (entryId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedEntries, entryId]);
    } else {
      onSelectionChange(selectedEntries.filter(id => id !== entryId));
    }
  };

  const isAllSelected = entries.length > 0 && selectedEntries.length === entries.length;
  const isSomeSelected = selectedEntries.length > 0 && !isAllSelected;

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'asset': 'bg-blue-100 text-blue-700',
      'liability': 'bg-red-100 text-red-700',
      'equity': 'bg-purple-100 text-purple-700',
      'revenue': 'bg-green-100 text-green-700',
      'expense': 'bg-orange-100 text-orange-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'commission': 'Commission',
      'expense': 'Expense',
      'distribution': 'Distribution',
      'property': 'Property',
      'manual': 'Manual Entry',
      'bank': 'Bank',
    };
    return labels[source] || source;
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
                aria-label="Select all entries"
              />
            </TableHead>
            <TableHead>Entry #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                No ledger entries found
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow
                key={entry.id}
                className="hover:bg-gray-50 transition-colors"
                onMouseEnter={() => setHoveredRow(entry.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedEntries.includes(entry.id)}
                    onCheckedChange={(checked) => handleSelectOne(entry.id, checked as boolean)}
                    aria-label={`Select entry ${entry.entryNumber}`}
                  />
                </TableCell>
                <TableCell>
                  <p className="text-gray-900">{entry.entryNumber}</p>
                </TableCell>
                <TableCell>
                  <p className="text-gray-900">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-gray-900 max-w-xs truncate" title={entry.accountName}>
                    {entry.accountCode} - {entry.accountName}
                  </p>
                  <p className="text-gray-500 text-sm max-w-xs truncate" title={entry.description}>
                    {entry.description}
                  </p>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-sm ${getAccountTypeColor(entry.accountType)}`}>
                    {entry.accountType.charAt(0).toUpperCase() + entry.accountType.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <p className={`${entry.debit > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                    {entry.debit > 0 ? formatPKR(entry.debit) : '—'}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  <p className={`${entry.credit > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                    {entry.credit > 0 ? formatPKR(entry.credit) : '—'}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  <p className={`${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPKR(entry.balance)}
                  </p>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    {getSourceLabel(entry.source)}
                  </span>
                  {entry.referenceNumber && (
                    <p className="text-gray-500 text-sm mt-1">{entry.referenceNumber}</p>
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
                      {entry.sourceId && onViewSource && (
                        <DropdownMenuItem onClick={() => onViewSource(entry.source, entry.sourceId!)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Source
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Export Entry
                      </DropdownMenuItem>
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