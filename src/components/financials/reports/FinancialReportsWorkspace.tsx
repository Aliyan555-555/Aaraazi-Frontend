import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../../types';
import { WorkspaceHeader } from '../../workspace/WorkspaceHeader';
import { WorkspaceSearchBar } from '../../workspace/WorkspaceSearchBar';
import { WorkspaceEmptyState } from '../../workspace/WorkspaceEmptyState';
import { ReportMetrics } from './ReportMetrics';
import { ReportTemplateCard, ReportTemplate } from './ReportTemplateCard';
import { GenerateReportModal, GeneratedReport } from './GenerateReportModal';
import { ReportViewer, ReportViewerData } from './ReportViewer';
import { ReportHistoryModal } from './ReportHistoryModal';
import { ReportBuilderModal } from './custom-builder/ReportBuilderModal';
import { CustomReportCard } from './custom-builder/CustomReportCard';
import { RunCustomReportModal } from './custom-builder/RunCustomReportModal';
import { ReportHistoryViewer } from './custom-builder/ReportHistoryViewer';
import { ScheduledReportsDashboard } from './custom-builder/ScheduledReportsDashboard';
import { DistributionListsManager } from './custom-builder/DistributionListsManager';
import { ReportSharingModal } from './custom-builder/ReportSharingModal';
import { ReportAnalyticsDashboard } from './custom-builder/ReportAnalyticsDashboard';
import { getCustomReports, deleteCustomReport, updateCustomReport } from '../../../lib/custom-report-builder';
import { CustomReportTemplate } from '../../../types/custom-reports';
import {
  generateTrialBalance,
  generateChangesInEquity,
  generateProfitAndLoss,
  generateBalanceSheet,
  generateCashFlowStatement,
  generateCommissionReport,
  generateExpenseSummaryReport,
  generatePropertyPerformanceReport,
  generateInvestorDistributionReport,
  generateTaxSummaryReport,
  generateAgedReceivables,
  generateAgedPayables,
  getYoYDateRanges,
  getMoMDateRanges,
  compareProfitAndLoss,
  compareBalanceSheets,
} from '../../../lib/accounting';
import { toast } from 'sonner';
import {
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  LineChart,
  Download,
  Plus,
  Sparkles,
  History,
  Clock,
  TrendingUp as Analytics,
  Wallet, // Added for Changes in Equity
} from 'lucide-react';
import { Button } from '../../ui/button';

interface FinancialReportsWorkspaceProps {
  user: User;
  onBack: () => void;
}

const REPORTS_KEY = 'generated_reports';
const FAVORITES_KEY = 'favorite_reports';

// Predefined report templates
const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'profit-loss',
    name: 'Profit & Loss Statement',
    description: 'Income statement showing revenue, expenses, and net profit for a period',
    icon: TrendingUp,
    category: 'financial',
    generatedCount: 0,
  },
  {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    description: 'Snapshot of assets, liabilities, and equity at a point in time',
    icon: FileText,
    category: 'financial',
    generatedCount: 0,
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow Statement',
    description: 'Track cash inflows and outflows from operations, investing, and financing',
    icon: DollarSign,
    category: 'financial',
    generatedCount: 0,
  },
  {
    id: 'trial-balance',
    name: 'Trial Balance',
    description: 'Summary of all ledger account balances to verify debits equal credits',
    icon: BarChart3,
    category: 'financial',
    generatedCount: 0,
  },
  {
    id: 'changes-in-equity',
    name: 'Changes in Equity',
    description: 'Track changes in owner\'s equity including contributions and withdrawals',
    icon: Wallet,
    category: 'financial',
    generatedCount: 0,
  },
  {
    id: 'commission-report',
    name: 'Commission Report',
    description: 'Detailed breakdown of all commissions earned and paid',
    icon: PieChart,
    category: 'operational',
    generatedCount: 0,
  },
  {
    id: 'expense-summary',
    name: 'Expense Summary',
    description: 'Categorized expense analysis with trends and comparisons',
    icon: LineChart,
    category: 'operational',
    generatedCount: 0,
  },
  {
    id: 'property-performance',
    name: 'Property Performance',
    description: 'ROI analysis and profitability by property',
    icon: TrendingUp,
    category: 'operational',
    generatedCount: 0,
  },
  {
    id: 'investor-distributions',
    name: 'Investor Distribution Report',
    description: 'Summary of all investor profit distributions and returns',
    icon: DollarSign,
    category: 'operational',
    generatedCount: 0,
  },
  {
    id: 'tax-summary',
    name: 'Tax Summary Report',
    description: 'Estimated tax liability including property tax, income tax, and capital gains (Pakistan)',
    icon: FileText,
    category: 'financial',
    generatedCount: 0,
  },
  {
    id: 'aged-receivables',
    name: 'Aged Receivables',
    description: 'Status of unpaid commissions and other incoming payments by aging bucket',
    icon: Clock,
    category: 'financial',
    generatedCount: 0,
  },
  {
    id: 'aged-payables',
    name: 'Aged Payables',
    description: 'Status of unpaid expenses and other outgoing payments by aging bucket',
    icon: History,
    category: 'financial',
    generatedCount: 0,
  },
];

/**
 * FinancialReportsWorkspace Component
 * 
 * Complete financial reporting workspace with:
 * - Predefined report templates
 * - Custom report generation
 * - Date range selection
 * - Multiple export formats (PDF, CSV, Excel)
 * - Comparative analysis (YoY, MoM)
 * - Report history tracking
 * 
 * Design System V4.1 Compliant:
 * - Uses WorkspaceHeader with stats
 * - Uses WorkspaceSearchBar with filters
 * - Uses ReportTemplateCard components
 * - No Tailwind typography classes
 * - Follows 8px spacing grid
 * 
 * UX Laws Applied:
 * - Miller's Law: 9 report templates (within 7±2)
 * - Fitts's Law: Large template cards
 * - Hick's Law: Categorized templates
 * - Jakob's Law: Standard reporting interface
 * - Aesthetic-Usability: Consistent design
 * 
 * Features:
 * - 9 standard report templates (5 Financial, 4 Operational)
 * - Favorite reports
 * - Report generation with parameters
 * - Export to PDF/CSV/Excel
 * - Comparison reports (YoY, MoM)
 * - Report history
 * - Search and filter
 * 
 * @example
 * <FinancialReportsWorkspace
 *   user={user}
 *   onBack={() => navigate('financials')}
 * />
 */
export const FinancialReportsWorkspace: React.FC<FinancialReportsWorkspaceProps> = ({
  user,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Custom Report Builder state
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [customReports, setCustomReports] = useState<CustomReportTemplate[]>([]);
  const [showRunCustomReport, setShowRunCustomReport] = useState(false);
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState<CustomReportTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CustomReportTemplate | undefined>(undefined);
  const [showDistributionLists, setShowDistributionLists] = useState(false);

  // View state - for switching between main view, history, and scheduled
  const [currentView, setCurrentView] = useState<'main' | 'history' | 'scheduled'>('main');

  // Load generated reports and favorites
  const [generatedReports, setGeneratedReports] = useState<ReportViewerData[]>([]);
  const [favoriteReportIds, setFavoriteReportIds] = useState<string[]>([]);

  // Report viewing state
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReportViewerData | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTemplateFilter, setHistoryTemplateFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    const reportsStored = localStorage.getItem(REPORTS_KEY);
    const favoritesStored = localStorage.getItem(FAVORITES_KEY);

    if (reportsStored) {
      try {
        setGeneratedReports(JSON.parse(reportsStored));
      } catch (error) {
        console.error('Failed to load reports:', error);
      }
    }

    if (favoritesStored) {
      try {
        setFavoriteReportIds(JSON.parse(favoritesStored));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }

    // Load custom reports
    setCustomReports(getCustomReports());
  }, [refreshKey]);

  // Save to localStorage
  const saveReports = (reports: ReportViewerData[]) => {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    setGeneratedReports(reports);
  };

  const saveFavorites = (favorites: string[]) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    setFavoriteReportIds(favorites);
  };

  // Enhance templates with stats
  const enhancedTemplates = useMemo(() => {
    return REPORT_TEMPLATES.map(template => {
      const templateReports = generatedReports.filter((r: ReportViewerData) => r.templateId === template.id);
      const lastGenerated = templateReports.length > 0
        ? templateReports.sort((a: ReportViewerData, b: ReportViewerData) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0].generatedAt
        : undefined;

      return {
        ...template,
        isFavorite: favoriteReportIds.includes(template.id),
        lastGenerated,
        generatedCount: templateReports.length,
      };
    });
  }, [generatedReports, favoriteReportIds]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const totalReports = generatedReports.length;
    const thisMonthReports = generatedReports.filter((r: ReportViewerData) => {
      const reportDate = new Date(r.generatedAt);
      return reportDate.getMonth() === thisMonth && reportDate.getFullYear() === thisYear;
    }).length;

    const sortedReports = [...generatedReports].sort((a: ReportViewerData, b: ReportViewerData) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
    const lastGeneratedDate = sortedReports.length > 0 ? sortedReports[0].generatedAt : undefined;

    const favoriteReports = favoriteReportIds.length;
    const scheduledReports = 0; // Placeholder for future feature
    const exportCount = totalReports; // Each report is an export

    return {
      totalReports,
      thisMonthReports,
      lastGeneratedDate,
      favoriteReports,
      scheduledReports,
      exportCount,
    };
  }, [generatedReports, favoriteReportIds]);

  // Stats for WorkspaceHeader
  const stats = useMemo(() => {
    return [
      { label: 'Total Reports', value: `${metrics.totalReports}`, variant: 'default' as const },
      { label: 'This Month', value: `${metrics.thisMonthReports}`, variant: 'info' as const },
      { label: 'Favorites', value: `${metrics.favoriteReports}`, variant: 'success' as const },
      { label: 'Templates', value: `${REPORT_TEMPLATES.length}`, variant: 'default' as const },
    ];
  }, [metrics]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return enhancedTemplates.filter((template: any) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(query);
        const matchesDescription = template.description.toLowerCase().includes(query);

        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(template.category)) {
        return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !template.isFavorite) {
        return false;
      }

      return true;
    });
  }, [enhancedTemplates, searchQuery, categoryFilter, showFavoritesOnly]);

  // Handle generate report
  const handleGenerateReport = (templateId: string) => {
    const template = enhancedTemplates.find((t: any) => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(template);
    setShowGenerateModal(true);
  };

  // Handle save generated report
  const handleSaveReport = async (reportData: Omit<GeneratedReport, 'id' | 'generatedAt'>) => {
    try {
      // Generate actual report data based on template type
      let actualReportData: any = null;

      switch (reportData.templateId) {
        case 'trial-balance':
          // Generate Trial Balance using the accounting library
          actualReportData = generateTrialBalance(
            reportData.dateTo, // Use end date as "as of" date
            user.id,
            user.role
          );
          break;

        case 'changes-in-equity':
          // Generate Changes in Equity using the accounting library
          // First get net income from P&L
          const plForEquity = generateProfitAndLoss(
            reportData.dateFrom,
            reportData.dateTo,
            user.id,
            user.role
          );
          actualReportData = generateChangesInEquity(
            reportData.dateFrom,
            reportData.dateTo,
            user.id,
            user.role,
            plForEquity.netIncome
          );
          break;

        case 'profit-loss':
          // Generate Profit & Loss Statement using the accounting library
          actualReportData = generateProfitAndLoss(
            reportData.dateFrom,
            reportData.dateTo,
            user.id,
            user.role
          );
          break;

        case 'balance-sheet':
          // Generate Balance Sheet using the accounting library
          actualReportData = generateBalanceSheet(
            reportData.dateTo, // Use end date as "as of" date
            user.id,
            user.role
          );
          break;

        case 'cash-flow':
          // Generate Cash Flow Statement using the accounting library
          actualReportData = generateCashFlowStatement(
            reportData.dateFrom,
            reportData.dateTo,
            user.id,
            user.role
          );
          break;

        case 'commission-report':
          // Generate Commission Report using the accounting library
          actualReportData = generateCommissionReport(
            reportData.dateFrom,
            reportData.dateTo,
            user.id,
            user.role
          );
          break;

        case 'expense-summary':
          // Generate Expense Summary Report using the accounting library
          actualReportData = generateExpenseSummaryReport(
            reportData.dateFrom,
            reportData.dateTo,
            user.id,
            user.role
          );
          break;

        case 'property-performance':
          // Generate Property Performance Report using the accounting library
          actualReportData = generatePropertyPerformanceReport(
            reportData.dateFrom,
            reportData.dateTo,
            user.id,
            user.role
          );
          break;

        case 'investor-distributions':
          // Generate Investor Distribution Report using the accounting library
          actualReportData = generateInvestorDistributionReport(
            reportData.dateFrom,
            reportData.dateTo,
            user.id,
            user.role
          );
          break;

        case 'tax-summary':
          // Generate Tax Summary Report using the accounting library
          actualReportData = generateTaxSummaryReport(
            reportData.dateFrom,
            reportData.dateTo,
            user.id,
            user.role
          );
          break;

        case 'aged-receivables':
          // Generate Aged Receivables Report using the accounting library
          actualReportData = generateAgedReceivables(
            reportData.dateTo, // Use as current date
            user.id,
            user.role
          );
          break;

        case 'aged-payables':
          // Generate Aged Payables Report using the accounting library
          actualReportData = generateAgedPayables(
            reportData.dateTo, // Use as current date
            user.id,
            user.role
          );
          break;

        default:
          // For other report types, create a placeholder
          actualReportData = {
            placeholder: true,
            message: 'This report type will be implemented soon.',
          };
      }

      // Create the full report object with data
      const newReport: ReportViewerData = {
        ...reportData,
        id: Date.now().toString(),
        generatedAt: new Date().toISOString(),
        data: actualReportData,
      };

      // Save to localStorage
      saveReports([...generatedReports, newReport]);

      // Show success message
      toast.success(`${reportData.templateName} generated successfully`);

      // Immediately open the report viewer to show the generated report
      setCurrentReport(newReport);
      setShowReportViewer(true);

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report. Please try again.');
      throw error;
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = (templateId: string) => {
    if (favoriteReportIds.includes(templateId)) {
      saveFavorites(favoriteReportIds.filter((id: string) => id !== templateId));
      toast.success('Removed from favorites');
    } else {
      saveFavorites([...favoriteReportIds, templateId]);
      toast.success('Added to favorites');
    }
    setRefreshKey((prev: number) => prev + 1);
  };

  // Handle view history
  const handleViewHistory = (templateId: string) => {
    const template = enhancedTemplates.find((t: any) => t.id === templateId);
    if (!template) return;

    // Open history modal filtered to this template
    setHistoryTemplateFilter(template.name);
    setShowHistoryModal(true);
  };

  // Handle view all history
  const handleViewAllHistory = () => {
    setHistoryTemplateFilter(undefined);
    setShowHistoryModal(true);
  };

  // Handle view report from history
  const handleViewReport = (report: ReportViewerData) => {
    setCurrentReport(report);
    setShowReportViewer(true);
    setShowHistoryModal(false); // Close history modal when viewing report
  };

  // Handle delete report from history
  const handleDeleteReport = (reportId: string) => {
    const updatedReports = generatedReports.filter((r: ReportViewerData) => r.id !== reportId);
    saveReports(updatedReports);
    toast.success('Report deleted from history');
    setRefreshKey(prev => prev + 1);
  };

  // Custom report handlers
  const handleRunCustomReport = (template: CustomReportTemplate) => {
    setSelectedCustomTemplate(template);
    setShowRunCustomReport(true);
  };

  const handleEditCustomReport = (template: CustomReportTemplate) => {
    setEditingTemplate(template);
    setShowReportBuilder(true);
  };

  const handleDeleteCustomReport = (templateId: string) => {
    try {
      deleteCustomReport(templateId);
      toast.success('Custom report deleted successfully');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to delete custom report');
    }
  };

  // Handle update custom report (for schedule toggle)
  const handleUpdateCustomReport = (templateId: string, updates: Partial<CustomReportTemplate>) => {
    try {
      updateCustomReport(templateId, updates);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to update report');
    }
  };

  // Render content based on current view
  if (currentView === 'history') {
    return (
      <ReportHistoryViewer
        user={user}
        templates={customReports}
        onRunTemplate={handleRunCustomReport}
        onClose={() => setCurrentView('main')}
      />
    );
  }

  if (currentView === 'scheduled') {
    return (
      <ScheduledReportsDashboard
        user={user}
        templates={customReports}
        onRunTemplate={handleRunCustomReport}
        onEditTemplate={handleEditCustomReport}
        onUpdateTemplate={handleUpdateCustomReport}
        onClose={() => setCurrentView('main')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WorkspaceHeader */}
      <WorkspaceHeader
        title="Financial Reports"
        description="Generate comprehensive financial statements and analytical reports"
        stats={stats}
        onBack={onBack}
        primaryAction={{
          label: 'Create Custom Report',
          icon: <Sparkles className="h-4 w-4" />,
          onClick: () => setShowReportBuilder(true),
        }}
        secondaryActions={[
          {
            label: 'Report History',
            icon: <History className="h-4 w-4" />,
            onClick: handleViewAllHistory,
          },
          {
            label: 'Scheduled Reports',
            icon: <Clock className="h-4 w-4" />,
            onClick: () => setCurrentView('scheduled'),
          },
        ]}
      />

      {/* WorkspaceSearchBar */}
      <WorkspaceSearchBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search reports by name or description..."
        quickFilters={[
          {
            id: 'category',
            label: 'Category',
            type: 'multi-select',
            options: [
              { value: 'financial', label: 'Financial', count: enhancedTemplates.filter((t: any) => t.category === 'financial').length },
              { value: 'operational', label: 'Operational', count: enhancedTemplates.filter((t: any) => t.category === 'operational').length },
              { value: 'custom', label: 'Custom', count: enhancedTemplates.filter((t: any) => t.category === 'custom').length },
            ],
            value: categoryFilter,
            onChange: setCategoryFilter,
          },
          {
            id: 'favorites',
            label: 'Show Favorites Only',
            type: 'toggle',
            value: showFavoritesOnly,
            onChange: setShowFavoritesOnly,
          },
        ]}
        onClearAll={() => {
          setSearchQuery('');
          setCategoryFilter([]);
          setShowFavoritesOnly(false);
        }}
      />

      <div className="p-6 space-y-6">
        {/* Custom Reports Section */}
        {customReports.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-gray-900">Custom Reports</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Your saved custom report templates
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingTemplate(undefined);
                  setShowReportBuilder(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Custom Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customReports.map((template: CustomReportTemplate) => (
                <CustomReportCard
                  key={template.id}
                  template={template}
                  onRun={handleRunCustomReport}
                  onEdit={handleEditCustomReport}
                  onDelete={handleDeleteCustomReport}
                />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {customReports.length > 0 && (
          <div className="border-t border-gray-300 my-6" />
        )}

        {/* Standard Reports Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-gray-900">Standard Reports</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pre-built report templates for common financial reporting needs
            </p>
          </div>

          {/* Template Grid */}
          {filteredTemplates.length === 0 ? (
            <WorkspaceEmptyState
              variant="empty"
              title="No Reports Found"
              description="No report templates match your current filters. Try adjusting your search or filters."
              primaryAction={{
                label: 'Clear Filters',
                onClick: () => {
                  setSearchQuery('');
                  setCategoryFilter([]);
                  setShowFavoritesOnly(false);
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template: any) => (
                <ReportTemplateCard
                  key={template.id}
                  template={template}
                  onGenerate={handleGenerateReport}
                  onToggleFavorite={handleToggleFavorite}
                  onViewHistory={handleViewHistory}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      {selectedTemplate && (
        <GenerateReportModal
          open={showGenerateModal}
          onClose={() => {
            setShowGenerateModal(false);
            setSelectedTemplate(null);
          }}
          templateId={selectedTemplate.id}
          templateName={selectedTemplate.name}
          onGenerate={handleSaveReport}
          userName={user.name}
        />
      )}

      {/* Report Builder Modal */}
      <ReportBuilderModal
        open={showReportBuilder}
        onClose={() => setShowReportBuilder(false)}
        onSave={(template: any) => {
          setRefreshKey((prev: number) => prev + 1);
        }}
        user={user}
        editingTemplate={editingTemplate}
      />

      {/* Run Custom Report Modal */}
      {selectedCustomTemplate && (
        <RunCustomReportModal
          open={showRunCustomReport}
          onClose={() => {
            setShowRunCustomReport(false);
            setSelectedCustomTemplate(null);
          }}
          template={selectedCustomTemplate}
          user={user}
        />
      )}

      {/* Report Viewer Modal */}
      <ReportViewer
        open={showReportViewer}
        onClose={() => {
          setShowReportViewer(false);
          setCurrentReport(null);
        }}
        report={currentReport}
      />

      {/* Report History Modal */}
      <ReportHistoryModal
        open={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setHistoryTemplateFilter(undefined);
        }}
        templateName={historyTemplateFilter}
        reports={generatedReports}
        onViewReport={handleViewReport}
        onDeleteReport={handleDeleteReport}
      />
    </div>
  );
};