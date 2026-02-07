/**
 * Layout Components - Central export
 * 
 * Exports all layout and detail page template components
 * for easy importing throughout the application.
 */

// Template System
export { DetailPageTemplate } from './DetailPageTemplate';
export type { DetailPageTab, DetailPageTemplateProps } from './DetailPageTemplate';

// Helper Components
export { QuickActionsPanel } from './QuickActionsPanel';
export type { QuickAction, QuickActionsPanelProps } from './QuickActionsPanel';

export { MetricCardsGroup } from './MetricCardsGroup';
export type { MetricCardsGroupProps } from './MetricCardsGroup';

export { SummaryStatsPanel } from './SummaryStatsPanel';
export type { SummaryStat, SummaryStatsPanelProps } from './SummaryStatsPanel';

export { DataTable } from './DataTable';
export type { DataTableColumn, DataTableProps } from './DataTable';

export { PaymentSummaryPanel } from './PaymentSummaryPanel';
export type { NextPayment, PaymentSummaryPanelProps } from './PaymentSummaryPanel';

export { ActivityTimeline } from './ActivityTimeline';
export type { Activity, ActivityTimelineProps } from './ActivityTimeline';

// NEW: Specialized Helper Components
export { OfferCard } from './OfferCard';
export type { OfferData, OfferCardProps } from './OfferCard';

export { DocumentList } from './DocumentList';
export type { Document, DocumentListProps } from './DocumentList';

export { CommissionCalculator } from './CommissionCalculator';
export type { CommissionCalculatorProps } from './CommissionCalculator';

export { ContactCard } from './ContactCard';
export type { ContactCardProps } from './ContactCard';

export { NotesPanel } from './NotesPanel';
export type { Note, NotesPanelProps } from './NotesPanel';

export { RelatedEntitiesGrid } from './RelatedEntitiesGrid';
export type { RelatedEntity, RelatedEntitiesGridProps } from './RelatedEntitiesGrid';

export { FilterPanel } from './FilterPanel';
export type { FilterType, FilterOption, FilterConfig, FilterPanelProps } from './FilterPanel';

// Foundation Components (already existed)
export { PageHeader } from './PageHeader';
export type { PageHeaderProps } from './PageHeader';

export { ConnectedEntitiesBar } from './ConnectedEntitiesBar';
export type { ConnectedEntity, ConnectedEntitiesBarProps } from './ConnectedEntitiesBar';

export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps } from './StatusBadge';