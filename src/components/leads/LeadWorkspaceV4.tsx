/**
 * Lead Workspace V4
 * 
 * Main workspace for the redesigned Leads module
 * Shows all leads with filtering, search, SLA monitoring
 * Quick actions for assignment, qualification, conversion
 */

import React, { useState, useMemo } from 'react';
import { Plus, UserPlus, Clock, AlertTriangle, TrendingUp, Phone } from 'lucide-react';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';
import { WorkspaceSearchBar } from '../workspace/WorkspaceSearchBar';
import { WorkspaceEmptyState } from '../workspace/WorkspaceEmptyState';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Lead, LeadStatus, LeadPriority, LeadIntent, LeadSource } from '../../types/leads';
// [STUBBED] import {
// [STUBBED]   getLeads,
// [STUBBED]   getLeadStatistics,
// [STUBBED]   getLeadsRequiringAction,
// [STUBBED]   getOverdueLeads
// [STUBBED] } from '../../lib/leads';
// [STUBBED] import { filterLeads, sortLeads, LeadFilter, LeadSortBy, getSLAAlerts } from '../../lib/leadUtils';
import { formatDistanceToNow } from 'date-fns';

import { logger } from "../../lib/logger";

// ===== STUBS for removed prototype functions =====
const getLeads = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getLeadStatistics = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getLeadsRequiringAction = (..._args: any[]): any => { /* stub - prototype function removed */ };
const getOverdueLeads = (..._args: any[]): any => { /* stub - prototype function removed */ };
const filterLeads = (..._args: any[]): any => { /* stub - prototype function removed */ };
const sortLeads = (..._args: any[]): any => { /* stub - prototype function removed */ };
type LeadFilter = any;
type LeadSortBy = any;
const getSLAAlerts = (..._args: any[]): any => { /* stub - prototype function removed */ };
// ===== END STUBS =====

// Props
interface LeadWorkspaceV4Props {
  user: {
    id: string;
    name: string;
    role: 'admin' | 'agent';
  };
  onNavigate: (view: string, id?: string) => void;
  onCreateLead: () => void;
}

export function LeadWorkspaceV4({ user, onNavigate, onCreateLead }: LeadWorkspaceV4Props) {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<LeadFilter>({});
  const [sortBy, setSortBy] = useState<LeadSortBy>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const allLeads = useMemo(() => getLeads(), []);
  const stats = useMemo(() => getLeadStatistics(), [allLeads]);
  const actionableLeads = useMemo(() => getLeadsRequiringAction(), [allLeads]);
  const overdueLeads = useMemo(() => getOverdueLeads(), [allLeads]);
  const slaAlerts = useMemo(() => getSLAAlerts(), [allLeads]);

  // Filter agents (for admin view)
  const agentLeads = user.role === 'agent'
    ? allLeads.filter(lead => lead.agentId === user.id)
    : allLeads;

  // Apply filters and search
  const filteredLeads = useMemo(() => {
    // Start with role-filtered leads and apply all filters + search
    let leads = filterLeads({ ...activeFilters, searchTerm: searchQuery }, agentLeads);

    // Apply sort
    leads = sortLeads(leads, sortBy);

    return leads;
  }, [agentLeads, searchQuery, activeFilters, sortBy]);

  // Active leads count (new, qualifying, qualified)
  const activeLeadsCount = useMemo(() =>
    filteredLeads.filter(l =>
      l.status === 'new' || l.status === 'qualifying' || l.status === 'qualified'
    ).length,
    [filteredLeads]
  );

  // Stats for header
  const headerStats = [
    {
      label: 'Total',
      value: filteredLeads.length.toString(),
      variant: 'default' as const
    },
    {
      label: 'Active',
      value: activeLeadsCount.toString(),
      variant: 'default' as const
    },
    {
      label: 'Requires Action',
      value: actionableLeads.length.toString(),
      variant: actionableLeads.length > 0 ? 'warning' as const : 'default' as const
    },
    {
      label: 'SLA Overdue',
      value: overdueLeads.length.toString(),
      variant: overdueLeads.length > 0 ? 'destructive' as const : 'success' as const
    },
    {
      label: 'Avg Score',
      value: Math.round(stats.averageScore).toString(),
      variant: 'default' as const
    },
  ];

  // Quick filters - properly structured for WorkspaceSearchBar
  const quickFilters = [
    {
      id: 'status',
      label: 'Status',
      type: 'multi-select' as const,
      options: [
        { value: 'new', label: 'New', count: stats.byStatus.new },
        { value: 'qualifying', label: 'Qualifying', count: stats.byStatus.qualifying },
        { value: 'qualified', label: 'Qualified', count: stats.byStatus.qualified },
        { value: 'converted', label: 'Converted', count: stats.byStatus.converted },
        { value: 'lost', label: 'Lost', count: stats.byStatus.lost },
      ],
      value: activeFilters.status || [],
      onChange: (value: string | string[] | boolean) => {
        setActiveFilters({
          ...activeFilters,
          status: (value as string[]).length > 0 ? (value as LeadStatus[]) : undefined
        });
      },
      multiple: true,
    },
    {
      id: 'priority',
      label: 'Priority',
      type: 'multi-select' as const,
      options: [
        { value: 'high', label: 'High', count: stats.byPriority.high },
        { value: 'medium', label: 'Medium', count: stats.byPriority.medium },
        { value: 'low', label: 'Low', count: stats.byPriority.low },
      ],
      value: activeFilters.priority || [],
      onChange: (value: string | string[] | boolean) => {
        setActiveFilters({
          ...activeFilters,
          priority: (value as string[]).length > 0 ? (value as LeadPriority[]) : undefined
        });
      },
      multiple: true,
    },
    {
      id: 'intent',
      label: 'Intent',
      type: 'multi-select' as const,
      options: [
        { value: 'buying', label: 'Buying', count: stats.byIntent.buying },
        { value: 'selling', label: 'Selling', count: stats.byIntent.selling },
        { value: 'renting', label: 'Renting', count: stats.byIntent.renting },
        { value: 'leasing-out', label: 'Leasing Out', count: stats.byIntent['leasing-out'] },
        { value: 'investing', label: 'Investing', count: stats.byIntent.investing },
      ],
      value: activeFilters.intent || [],
      onChange: (value: string | string[] | boolean) => {
        setActiveFilters({
          ...activeFilters,
          intent: (value as string[]).length > 0 ? (value as LeadIntent[]) : undefined
        });
      },
      multiple: true,
    },
    {
      id: 'sla',
      label: 'SLA Status',
      type: 'single-select' as const,
      options: [
        { value: 'compliant', label: 'On Track' },
        { value: 'overdue', label: 'Overdue', count: overdueLeads.length },
      ],
      value: activeFilters.slaCompliant === true ? 'compliant' : activeFilters.slaCompliant === false ? 'overdue' : '',
      onChange: (value: string | string[] | boolean) => {
        if (value === 'compliant') {
          setActiveFilters({ ...activeFilters, slaCompliant: true });
        } else if (value === 'overdue') {
          setActiveFilters({ ...activeFilters, slaCompliant: false });
        } else {
          setActiveFilters({ ...activeFilters, slaCompliant: undefined });
        }
      },
    },
    {
      id: 'source',
      label: 'Source',
      type: 'multi-select' as const,
      options: [
        { value: 'website', label: 'Website', count: stats.bySource.website },
        { value: 'phone-call', label: 'Phone Call', count: stats.bySource['phone-call'] },
        { value: 'walk-in', label: 'Walk-in', count: stats.bySource['walk-in'] },
        { value: 'referral', label: 'Referral', count: stats.bySource.referral },
        { value: 'social-media', label: 'Social Media', count: stats.bySource['social-media'] },
        { value: 'whatsapp', label: 'WhatsApp', count: stats.bySource.whatsapp },
        { value: 'email', label: 'Email', count: stats.bySource.email },
      ],
      value: activeFilters.source || [],
      onChange: (value: string | string[] | boolean) => {
        setActiveFilters({
          ...activeFilters,
          source: (value as string[]).length > 0 ? (value as LeadSource[]) : undefined
        });
      },
      multiple: true,
    },
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest' as LeadSortBy, label: 'Newest First' },
    { value: 'oldest' as LeadSortBy, label: 'Oldest First' },
    { value: 'priority-high' as LeadSortBy, label: 'Priority: High to Low' },
    { value: 'score-high' as LeadSortBy, label: 'Score: High to Low' },
    { value: 'overdue' as LeadSortBy, label: 'Most Overdue' },
    { value: 'name-az' as LeadSortBy, label: 'Name: A-Z' },
  ];

  // Handle clear all filters
  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || Object.keys(activeFilters).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkspaceHeader
        title="Leads"
        description="First Contact & Qualification (< 72 hours)"
        stats={headerStats}
        primaryAction={{
          label: 'New Lead',
          icon: <Plus className="w-4 h-4" />,
          onClick: onCreateLead,
        }}
        secondaryActions={[
          {
            label: 'Import Leads',
            onClick: () => logger.log('Import leads'),
          },
          {
            label: 'Lead Settings',
            onClick: () => onNavigate('lead-settings'),
          },
        ]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Search Bar */}
      <WorkspaceSearchBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by name, phone, email, or notes..."
        quickFilters={quickFilters}
        sortOptions={sortOptions}
        sortValue={sortBy}
        onSortChange={(value) => setSortBy(value as LeadSortBy)}
        onClearAll={hasActiveFilters ? handleClearFilters : undefined}
      />

      {/* SLA Alert Banner */}
      {slaAlerts.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mx-6 mb-4 rounded">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-900">
                {slaAlerts.length} Lead{slaAlerts.length > 1 ? 's' : ''} Overdue
              </h4>
              <p className="text-orange-700 mt-1">
                {slaAlerts.slice(0, 3).map(alert => alert.leadName).join(', ')}
                {slaAlerts.length > 3 && ` and ${slaAlerts.length - 3} more`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveFilters({ ...activeFilters, slaCompliant: false })}
            >
              View All
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {filteredLeads.length === 0 ? (
          <WorkspaceEmptyState
            variant={hasActiveFilters ? 'no-results' : 'empty'}
            title={hasActiveFilters ? 'No leads found' : 'No leads yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your filters or search term'
                : 'Create your first lead to start tracking inquiries and converting them to contacts'
            }
            primaryAction={
              hasActiveFilters
                ? { label: 'Clear Filters', onClick: handleClearFilters }
                : { label: 'Create First Lead', onClick: onCreateLead }
            }
          />
        ) : viewMode === 'grid' ? (
          <LeadGridView leads={filteredLeads} onNavigate={onNavigate} />
        ) : (
          <LeadTableView leads={filteredLeads} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}

// ============================================
// GRID VIEW
// ============================================

interface LeadGridViewProps {
  leads: Lead[];
  onNavigate: (view: string, id?: string) => void;
}

function LeadGridView({ leads, onNavigate }: LeadGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

// ============================================
// TABLE VIEW
// ============================================

interface LeadTableViewProps {
  leads: Lead[];
  onNavigate: (view: string, id?: string) => void;
}

function LeadTableView({ leads, onNavigate }: LeadTableViewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">Lead</th>
              <th className="px-4 py-3 text-left">Intent</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Agent</th>
              <th className="px-4 py-3 text-left">Age</th>
              <th className="px-4 py-3 text-left">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <LeadTableRow key={lead.id} lead={lead} onNavigate={onNavigate} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// LEAD CARD (Grid Item)
// ============================================

interface LeadCardProps {
  lead: Lead;
  onNavigate: (view: string, id?: string) => void;
}

function LeadCard({ lead, onNavigate }: LeadCardProps) {
  const age = formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true });
  const isOverdue = !lead.sla.slaCompliant;

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 cursor-pointer transition-colors"
      onClick={() => onNavigate('lead-details', lead.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{lead.name}</h3>
          <p className="text-gray-500 mt-0.5">{lead.phone}</p>
        </div>
        <LeadPriorityBadge priority={lead.priority} />
      </div>

      {/* Intent & Status */}
      <div className="flex items-center gap-2 mb-3">
        <LeadIntentBadge intent={lead.intent} />
        <LeadStatusBadge status={lead.status} />
      </div>

      {/* Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-600">Score</span>
          <span className="font-medium">{lead.qualificationScore}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${lead.qualificationScore >= 70
              ? 'bg-green-500'
              : lead.qualificationScore >= 40
                ? 'bg-yellow-500'
                : 'bg-red-500'
              }`}
            style={{ width: `${lead.qualificationScore}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <LeadSourceIcon source={lead.source} />
          <span className="text-gray-500 capitalize">
            {lead.source.replace(/-/g, ' ')}
          </span>
        </div>
        {isOverdue && (
          <Badge variant="destructive" className="gap-1">
            <Clock className="w-3 h-3" />
            Overdue
          </Badge>
        )}
      </div>

      {/* Age */}
      <p className="text-gray-400 mt-2">{age}</p>
    </div>
  );
}

// ============================================
// LEAD TABLE ROW
// ============================================

interface LeadTableRowProps {
  lead: Lead;
  onNavigate: (view: string, id?: string) => void;
}

function LeadTableRow({ lead, onNavigate }: LeadTableRowProps) {
  const age = formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true });
  const isOverdue = !lead.sla.slaCompliant;

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => onNavigate('lead-details', lead.id)}
    >
      {/* Lead */}
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-gray-900">{lead.name}</div>
          <div className="text-gray-500">{lead.phone}</div>
          {lead.email && <div className="text-gray-400">{lead.email}</div>}
        </div>
      </td>

      {/* Intent */}
      <td className="px-4 py-3">
        <LeadIntentBadge intent={lead.intent} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <LeadStatusBadge status={lead.status} />
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <LeadPriorityBadge priority={lead.priority} />
      </td>

      {/* Score */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{lead.qualificationScore}</span>
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${lead.qualificationScore >= 70
                ? 'bg-green-500'
                : lead.qualificationScore >= 40
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
                }`}
              style={{ width: `${lead.qualificationScore}%` }}
            />
          </div>
        </div>
      </td>

      {/* Source */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <LeadSourceIcon source={lead.source} />
          <span className="capitalize">{lead.source.replace(/-/g, ' ')}</span>
        </div>
      </td>

      {/* Agent */}
      <td className="px-4 py-3">
        <span className="text-gray-700">{lead.agentName}</span>
      </td>

      {/* Age */}
      <td className="px-4 py-3">
        <span className="text-gray-500">{age}</span>
      </td>

      {/* SLA */}
      <td className="px-4 py-3">
        {isOverdue ? (
          <Badge variant="destructive" className="gap-1">
            <Clock className="w-3 h-3" />
            {Math.round(lead.sla.overdueBy || 0)}h
          </Badge>
        ) : (
          <Badge variant="success" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            On Track
          </Badge>
        )}
      </td>
    </tr>
  );
}

// ============================================
// BADGE COMPONENTS
// ============================================

function LeadIntentBadge({ intent }: { intent: LeadIntent }) {
  const config: Record<LeadIntent, { label: string; className: string }> = {
    buying: { label: 'Buying', className: 'bg-blue-100 text-blue-700' },
    selling: { label: 'Selling', className: 'bg-green-100 text-green-700' },
    renting: { label: 'Renting', className: 'bg-purple-100 text-purple-700' },
    'leasing-out': { label: 'Leasing Out', className: 'bg-indigo-100 text-indigo-700' },
    investing: { label: 'Investing', className: 'bg-yellow-100 text-yellow-700' },
    unknown: { label: 'Unknown', className: 'bg-gray-100 text-gray-700' },
  };

  const { label, className } = config[intent];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const config: Record<LeadStatus, { label: string; className: string }> = {
    new: { label: 'New', className: 'bg-blue-100 text-blue-700' },
    qualifying: { label: 'Qualifying', className: 'bg-yellow-100 text-yellow-700' },
    qualified: { label: 'Qualified', className: 'bg-green-100 text-green-700' },
    converted: { label: 'Converted', className: 'bg-gray-100 text-gray-700' },
    lost: { label: 'Lost', className: 'bg-red-100 text-red-700' },
    archived: { label: 'Archived', className: 'bg-gray-100 text-gray-500' },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

function LeadPriorityBadge({ priority }: { priority: LeadPriority }) {
  const config: Record<LeadPriority, { label: string; variant: 'default' | 'destructive' | 'warning' }> = {
    high: { label: 'High', variant: 'destructive' },
    medium: { label: 'Medium', variant: 'warning' },
    low: { label: 'Low', variant: 'default' },
  };

  const { label, variant } = config[priority];

  return <Badge variant={variant}>{label}</Badge>;
}

function LeadSourceIcon({ source }: { source: LeadSource }) {
  const iconClass = "w-4 h-4 text-gray-400";

  switch (source) {
    case 'phone-call':
      return <Phone className={iconClass} />;
    // Add more icons as needed
    default:
      return null;
  }
}

export default LeadWorkspaceV4;
