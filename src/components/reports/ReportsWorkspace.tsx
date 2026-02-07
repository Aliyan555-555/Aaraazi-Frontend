/**
 * ReportsWorkspace Component
 * 
 * Main workspace for Reports Module - ERP-standard reporting center
 * Provides access to pre-built reports, custom reports, favorites, and analytics
 * 
 * FEATURES:
 * - Dashboard overview with quick stats
 * - Report categories and templates
 * - Favorites and recent reports
 * - Report history and analytics
 * - Custom report builder access
 * - Export and scheduling capabilities
 * 
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building2,
  Target,
  Clock,
  Star,
  Plus,
  Filter,
  Download,
  Calendar,
  Search,
  Grid,
  List,
  Eye,
  Settings,
  Share2,
  Play
} from 'lucide-react';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  ReportTemplate, 
  ReportCategory,
  SYSTEM_REPORTS 
} from '../../types/reports';
import { getReportTemplates, getReportHistory } from '../../lib/reports';
import { formatDate } from '../../lib/validation';
import { getCurrentUser } from '../../lib/auth';
import ScheduleReportModal from './ScheduleReportModal';
import ShareReportModal from './ShareReportModal';

interface ReportsWorkspaceProps {
  onNavigate: (page: string, params?: any) => void;
}

export default function ReportsWorkspace({ onNavigate }: ReportsWorkspaceProps) {
  const user = getCurrentUser();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [templateToSchedule, setTemplateToSchedule] = useState<ReportTemplate | null>(null);
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [templateToShare, setTemplateToShare] = useState<ReportTemplate | null>(null);
  
  // Open schedule modal
  const handleScheduleClick = (template: ReportTemplate) => {
    setTemplateToSchedule(template);
    setScheduleModalOpen(true);
  };
  
  // Open share modal
  const handleShareClick = (template: ReportTemplate) => {
    setTemplateToShare(template);
    setShareModalOpen(true);
  };
  
  // Handle template update (after sharing)
  const handleTemplateUpdate = (updatedTemplate: ReportTemplate) => {
    // Template will be reloaded from localStorage on next render
    // Just close the modal
  };
  
  // Handle export report
  const handleExportReport = (report: any) => {
    // Export report data (placeholder - would integrate with export service)
    const dataStr = JSON.stringify(report.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.templateName.replace(/\s+/g, '_')}_${report.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Handle export all templates
  const handleExportAll = () => {
    const exportData = {
      templates,
      history,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aaraazi_reports_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Handle open settings
  const handleOpenSettings = () => {
    // Navigate to settings page or open settings modal
    onNavigate('reports-settings');
  };
  
  // Load templates and history
  const templates = useMemo(() => {
    if (!user) return [];
    return getReportTemplates(user.id);
  }, [user]);
  
  const history = useMemo(() => {
    return getReportHistory();
  }, []);
  
  // Filter templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(t => t.isFavorite);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [templates, selectedCategory, showFavoritesOnly, searchQuery]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const totalReports = templates.length;
    const favoriteReports = templates.filter(t => t.isFavorite).length;
    const systemReports = templates.filter(t => t.isSystemTemplate).length;
    const customReports = templates.filter(t => !t.isSystemTemplate).length;
    const reportsThisMonth = history.filter(h => {
      const date = new Date(h.executedAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    return [
      { label: 'Total Reports', value: totalReports, variant: 'default' as const },
      { label: 'System Templates', value: systemReports, variant: 'info' as const },
      { label: 'Custom Reports', value: customReports, variant: 'success' as const },
      { label: 'Generated MTD', value: reportsThisMonth, variant: 'default' as const },
      { label: 'Favorites', value: favoriteReports, variant: 'warning' as const },
    ];
  }, [templates, history]);
  
  // Report categories
  const categories: { value: ReportCategory | 'all'; label: string; icon: any; count: number }[] = [
    { 
      value: 'all', 
      label: 'All Reports', 
      icon: FileText,
      count: templates.length 
    },
    { 
      value: 'executive-summary', 
      label: 'Executive Summary', 
      icon: TrendingUp,
      count: templates.filter(t => t.category === 'executive-summary').length 
    },
    { 
      value: 'financial-analysis', 
      label: 'Financial Analysis', 
      icon: DollarSign,
      count: templates.filter(t => t.category === 'financial-analysis').length 
    },
    { 
      value: 'sales-performance', 
      label: 'Sales Performance', 
      icon: Target,
      count: templates.filter(t => t.category === 'sales-performance').length 
    },
    { 
      value: 'inventory-analysis', 
      label: 'Inventory Analysis', 
      icon: Building2,
      count: templates.filter(t => t.category === 'inventory-analysis').length 
    },
    { 
      value: 'lead-analytics', 
      label: 'Lead Analytics', 
      icon: Users,
      count: templates.filter(t => t.category === 'lead-analytics').length 
    },
    { 
      value: 'agent-performance', 
      label: 'Agent Performance', 
      icon: BarChart3,
      count: templates.filter(t => t.category === 'agent-performance').length 
    },
  ];
  
  // Recent reports
  const recentReports = useMemo(() => {
    return history
      .slice(0, 5)
      .map(h => ({
        ...h,
        template: templates.find(t => t.id === h.templateId),
      }));
  }, [history, templates]);
  
  // Quick actions for header
  const secondaryActions = [
    {
      label: 'Schedule Report',
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => onNavigate('scheduled-reports'),
    },
    {
      label: 'Export All',
      icon: <Download className="h-4 w-4" />,
      onClick: handleExportAll,
    },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: handleOpenSettings,
    },
  ];
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Workspace Header */}
      <WorkspaceHeader
        title="Reports & Analytics"
        description="Comprehensive reporting across all business modules"
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('dashboard') },
          { label: 'Reports' },
        ]}
        stats={stats}
        primaryAction={{
          label: 'Create Custom Report',
          icon: <Plus />,
          onClick: () => onNavigate('report-builder'),
        }}
        secondaryActions={secondaryActions}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        availableViews={['grid', 'table']}
      />
      
      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Actions Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Favorites */}
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: 'var(--color-accent)' }}>
                <Star className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Favorite Reports</div>
                <div className="text-2xl font-semibold" style={{ color: 'var(--color-heading)' }}>
                  {templates.filter(t => t.isFavorite).length}
                </div>
              </div>
            </div>
          </Card>
          
          {/* Recent Activity */}
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: 'var(--color-accent)' }}>
                <Clock className="h-6 w-6" style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Last 7 Days</div>
                <div className="text-2xl font-semibold" style={{ color: 'var(--color-heading)' }}>
                  {history.filter(h => {
                    const date = new Date(h.executedAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date >= weekAgo;
                  }).length} Reports
                </div>
              </div>
            </div>
          </Card>
          
          {/* Scheduled Reports */}
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate('scheduled-reports')}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: 'var(--color-accent)' }}>
                <Calendar className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Scheduled</div>
                <div className="text-2xl font-semibold" style={{ color: 'var(--color-heading)' }}>
                  0 Active
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                      style={{ color: 'var(--color-text-muted)' }} />
              <Input
                placeholder="Search reports by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{cat.label}</span>
                      <Badge variant="secondary">{cat.count}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Favorites Toggle */}
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="gap-2"
            >
              <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              Favorites Only
            </Button>
          </div>
        </Card>
        
        {/* Tabs */}
        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">
              Report Templates ({filteredTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="recent">
              Recent Reports ({recentReports.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              Scheduled (0)
            </TabsTrigger>
          </TabsList>
          
          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                  No Reports Found
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  {showFavoritesOnly 
                    ? 'You haven\'t marked any reports as favorites yet.'
                    : searchQuery
                    ? 'No reports match your search criteria.'
                    : 'Get started by creating your first custom report.'}
                </p>
                <Button onClick={() => onNavigate('report-builder')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Report
                </Button>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <ReportTemplateCard
                    key={template.id}
                    template={template}
                    onNavigate={onNavigate}
                    handleScheduleClick={handleScheduleClick}
                    handleShareClick={handleShareClick}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <div className="divide-y">
                  {filteredTemplates.map(template => (
                    <ReportTemplateRow
                      key={template.id}
                      template={template}
                      onNavigate={onNavigate}
                      handleScheduleClick={handleScheduleClick}
                      handleShareClick={handleShareClick}
                    />
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
          
          {/* Recent Reports Tab */}
          <TabsContent value="recent" className="space-y-4">
            {recentReports.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                  No Recent Reports
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Generate your first report to see it here.
                </p>
              </Card>
            ) : (
              <Card>
                <div className="divide-y">
                  {recentReports.map(report => (
                    <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: 'var(--color-heading)' }}>
                            {report.templateName}
                          </div>
                          <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            Generated {formatDate(report.executedAt)} by {report.executedByName}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{report.rowCount} rows</Badge>
                            <Badge variant={report.status === 'success' ? 'success' : 'destructive'}>
                              {report.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onNavigate('report-viewer', { reportId: report.id })}
                            title="View Report"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportReport(report)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
          
          {/* Scheduled Tab */}
          <TabsContent value="scheduled" className="space-y-4">
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-heading)' }}>
                No Scheduled Reports
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Set up automatic report generation and distribution.
              </p>
              <Button onClick={() => onNavigate('schedule-report')}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule a Report
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Schedule Report Modal */}
      {scheduleModalOpen && templateToSchedule && (
        <ScheduleReportModal
          open={scheduleModalOpen}
          template={templateToSchedule}
          onClose={() => setScheduleModalOpen(false)}
        />
      )}
      
      {/* Share Report Modal */}
      {shareModalOpen && templateToShare && (
        <ShareReportModal
          open={shareModalOpen}
          template={templateToShare}
          onClose={() => setShareModalOpen(false)}
          onTemplateUpdate={handleTemplateUpdate}
        />
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ReportTemplateCardProps {
  template: ReportTemplate;
  onNavigate: (page: string, params?: any) => void;
  handleScheduleClick: (template: ReportTemplate) => void;
  handleShareClick: (template: ReportTemplate) => void;
}

function ReportTemplateCard({ template, onNavigate, handleScheduleClick, handleShareClick }: ReportTemplateCardProps) {
  const categoryIcon = getCategoryIcon(template.category);
  
  return (
    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-lg flex items-center justify-center"
             style={{ backgroundColor: 'var(--color-accent)' }}>
          {categoryIcon}
        </div>
        <div className="flex items-center gap-2">
          {template.isFavorite && (
            <Star className="h-4 w-4 fill-current" style={{ color: 'var(--color-primary)' }} />
          )}
          {template.isSystemTemplate && (
            <Badge variant="secondary">System</Badge>
          )}
        </div>
      </div>
      
      <h3 className="font-medium mb-2 group-hover:text-primary-600 transition-colors"
          style={{ color: 'var(--color-heading)' }}>
        {template.name}
      </h3>
      
      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
        {template.description}
      </p>
      
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {template.generationCount} runs
        </span>
      </div>
      
      <div className="flex gap-2">
        <Button 
          className="flex-1"
          onClick={() => onNavigate('run-report', { templateId: template.id })}
        >
          <Play className="h-4 w-4 mr-2" />
          Run Report
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleScheduleClick(template)}>
          <Calendar className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleShareClick(template)}>
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onNavigate('template-preview', { templateId: template.id })}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

interface ReportTemplateRowProps {
  template: ReportTemplate;
  onNavigate: (page: string, params?: any) => void;
  handleScheduleClick: (template: ReportTemplate) => void;
  handleShareClick: (template: ReportTemplate) => void;
}

function ReportTemplateRow({ template, onNavigate, handleScheduleClick, handleShareClick }: ReportTemplateRowProps) {
  const categoryIcon = getCategoryIcon(template.category);
  
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ backgroundColor: 'var(--color-accent)' }}>
          {categoryIcon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate" style={{ color: 'var(--color-heading)' }}>
              {template.name}
            </h4>
            {template.isFavorite && (
              <Star className="h-4 w-4 fill-current flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
            )}
            {template.isSystemTemplate && (
              <Badge variant="secondary">System</Badge>
            )}
          </div>
          <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
            {template.description}
          </p>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {template.generationCount} runs
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm"
              onClick={() => onNavigate('run-report', { templateId: template.id })}
            >
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleScheduleClick(template)}>
              <Calendar className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShareClick(template)}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('template-preview', { templateId: template.id })}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCategoryIcon(category: ReportCategory) {
  const iconClass = "h-6 w-6";
  const iconColor = { color: 'var(--color-primary)' };
  
  switch (category) {
    case 'executive-summary':
      return <TrendingUp className={iconClass} style={iconColor} />;
    case 'financial-analysis':
      return <DollarSign className={iconClass} style={iconColor} />;
    case 'sales-performance':
      return <Target className={iconClass} style={iconColor} />;
    case 'inventory-analysis':
      return <Building2 className={iconClass} style={iconColor} />;
    case 'lead-analytics':
      return <Users className={iconClass} style={iconColor} />;
    case 'agent-performance':
      return <BarChart3 className={iconClass} style={iconColor} />;
    default:
      return <FileText className={iconClass} style={iconColor} />;
  }
}

function getCategoryLabel(category: ReportCategory): string {
  const labels: Record<ReportCategory, string> = {
    'executive-summary': 'Executive',
    'financial-analysis': 'Financial',
    'sales-performance': 'Sales',
    'inventory-analysis': 'Inventory',
    'lead-analytics': 'Leads',
    'agent-performance': 'Performance',
    'client-insights': 'Clients',
    'market-trends': 'Market',
    'operational': 'Operations',
    'compliance': 'Compliance',
    'custom': 'Custom',
  };
  
  return labels[category] || category;
}