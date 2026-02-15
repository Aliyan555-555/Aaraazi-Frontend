/**
 * Template Registry - All available templates in aaraazi Design System V4.1
 * 
 * PURPOSE:
 * Centralized registry of all page templates to avoid duplication and provide
 * quick reference for developers.
 * 
 * BEFORE CREATING A NEW TEMPLATE:
 * 1. Check if one exists here
 * 2. Check if you can extend existing template
 * 3. Follow decision framework in DESIGN_SYSTEM_FLEXIBILITY_ADDENDUM.md
 * 
 * WHEN ADDING NEW TEMPLATE:
 * 1. Add entry to this registry
 * 2. Document why it was created
 * 3. List where it will be used (min 2-3 places for templates)
 * 4. Update DESIGN_SYSTEM_V4_COMPREHENSIVE_GUIDE.md
 */

export interface TemplateRegistryEntry {
  name: string;
  path: string;
  useCase: string;
  examples: string[];
  created?: string;
  createdBy?: string;
  reason?: string;
  whenToUse?: string[];
  whenNotToUse?: string[];
  documentation?: string;
}

export const TEMPLATE_REGISTRY: Record<string, TemplateRegistryEntry> = {
  // ============================================================================
  // CORE TEMPLATES (Use for 90% of cases)
  // ============================================================================

  detail: {
    name: 'DetailPageTemplate',
    path: '/components/layout/DetailPageTemplate.tsx',
    useCase: 'Single entity detail pages with tabs, metrics, and related entities',
    examples: [
      'PropertyDetails',
      'BuyerRequirementDetails',
      'RentRequirementDetails',
    ],
    created: '2024-12',
    reason: 'Standard pattern for all entity detail pages',
    whenToUse: [
      'Showing full details of a single entity',
      'Entity has multiple sections (tabs)',
      'Need to show metrics, actions, and breadcrumbs',
      'Entity has related entities to display',
    ],
    whenNotToUse: [
      'Listing multiple entities (use WorkspaceTemplate)',
      'Creating/editing entity (use FormTemplate)',
      'Dashboard with widgets (consider DashboardTemplate)',
      'Unique comparison or analysis view',
    ],
    documentation: '/components/layout/README.md',
  },

  workspace: {
    name: 'WorkspaceTemplate',
    path: '/components/workspace/WorkspaceTemplate.tsx',
    useCase: 'List/grid/kanban views of multiple entities with search and filters',
    examples: [
      'PropertiesWorkspace',
      'BuyerRequirementsWorkspace',
    ],
    created: '2024-12',
    reason: 'Standard pattern for all workspace/listing pages',
    whenToUse: [
      'Showing list/grid/kanban of multiple entities',
      'Need search and filter functionality',
      'Need view mode switching (grid/table/kanban)',
      'CRUD operations on multiple entities',
    ],
    whenNotToUse: [
      'Showing single entity details (use DetailPageTemplate)',
      'Creating/editing single entity (use FormTemplate)',
      'Dashboard overview (consider DashboardTemplate)',
      'Report generation (consider ReportTemplate)',
    ],
    documentation: '/components/workspace/WORKSPACE_SYSTEM_DOCUMENTATION.md',
  },

  form: {
    name: 'FormTemplate',
    path: '/components/forms/FormTemplate.tsx',
    useCase: 'Create and edit forms for entities',
    examples: [
      'AddPropertyForm',
      'EditPropertyForm',
      'AddBuyerRequirementForm',
      'EditBuyerRequirementForm',
    ],
    created: '2024-12',
    reason: 'Standard pattern for all forms',
    whenToUse: [
      'Creating new entity',
      'Editing existing entity',
      'Multi-section form with validation',
      'Standard form submission flow',
    ],
    whenNotToUse: [
      'Multi-step wizard (consider WizardTemplate)',
      'Complex conditional forms with branching logic',
      'Inline editing within detail page',
      'Quick actions that don\'t need full form',
    ],
    documentation: '/components/forms/README.md',
  },

  // ============================================================================
  // EXTENDED TEMPLATES (Context-specific, use when core templates don't fit)
  // ============================================================================

  dashboard: {
    name: 'DashboardTemplate',
    path: '/components/templates/DashboardTemplate.tsx',
    useCase: 'Widget-based dashboards with real-time data, KPI metrics, and charts',
    examples: [
      'Dashboard (Main)',
      'AgencyAnalyticsDashboard',
      'SalesDashboard',
    ],
    created: '2024-12-27',
    createdBy: 'Development Team',
    reason: 'Dashboards need real-time updates, widget/metric grid layout, and different information hierarchy than detail pages. Multi-entity overview focus.',
    whenToUse: [
      'Page shows overview of multiple entity types',
      'KPI metrics and charts are primary content',
      'Real-time or periodic data updates required',
      'Tab-based navigation with different views needed',
      'No single entity focus',
      'User needs to monitor metrics across system',
    ],
    whenNotToUse: [
      'Single entity focus (use DetailPageTemplate)',
      'CRUD operations on list (use WorkspaceTemplate)',
      'Standard listing with filters (use WorkspaceTemplate)',
      'Report generation (consider ReportTemplate)',
      'Form submission (use FormTemplate)',
    ],
    documentation: '/components/templates/README.md',
  },

  // report: {
  //   name: 'ReportTemplate',
  //   path: '/components/templates/ReportTemplate.tsx',
  //   useCase: 'Report generation and viewing pages',
  //   examples: [
  //     'SalesReport',
  //     'FinancialReport',
  //     'ActivityReport',
  //   ],
  //   created: '2024-12-27',
  //   createdBy: 'Development Team',
  //   reason: 'Reports have unique workflow: Configure filters → Generate → View results',
  //   whenToUse: [
  //     'Page purpose is to generate and view reports',
  //     'Needs filter configuration section',
  //     'Needs report generation action',
  //     'Displays tabular or chart data',
  //     'Export functionality required',
  //   ],
  //   whenNotToUse: [
  //     'Simple data display (use WorkspaceTemplate)',
  //     'Real-time dashboard (use DashboardTemplate)',
  //     'Interactive data exploration (custom component)',
  //   ],
  //   documentation: '/components/templates/README.md',
  // },

  // wizard: {
  //   name: 'WizardTemplate',
  //   path: '/components/templates/WizardTemplate.tsx',
  //   useCase: 'Multi-step processes and workflows',
  //   examples: [
  //     'PropertyOnboarding',
  //     'AgencySetup',
  //     'ComplexDealFlow',
  //   ],
  //   created: '2024-12-27',
  //   createdBy: 'Development Team',
  //   reason: 'Wizards need step-by-step navigation, progress indication, and multi-page flow',
  //   whenToUse: [
  //     'Multi-step process (3+ steps)',
  //     'Need progress indication',
  //     'Steps have dependencies',
  //     'Complex onboarding or setup flow',
  //     'User needs guidance through process',
  //   ],
  //   whenNotToUse: [
  //     'Simple form (use FormTemplate)',
  //     'Single-page process',
  //     'No clear step progression',
  //   ],
  //   documentation: '/components/templates/README.md',
  // },

  // Add new templates here following the same structure
  // Remember to document in DESIGN_SYSTEM_V4_COMPREHENSIVE_GUIDE.md
};

/**
 * Helper function to get template recommendation based on use case
 */
export function getTemplateRecommendation(useCase: string): TemplateRegistryEntry | null {
  const useCaseLower = useCase.toLowerCase();

  // Detail page keywords
  if (
    useCaseLower.includes('detail') ||
    useCaseLower.includes('view single') ||
    useCaseLower.includes('show one')
  ) {
    return TEMPLATE_REGISTRY.detail;
  }

  // Workspace keywords
  if (
    useCaseLower.includes('list') ||
    useCaseLower.includes('grid') ||
    useCaseLower.includes('workspace') ||
    useCaseLower.includes('multiple') ||
    useCaseLower.includes('all')
  ) {
    return TEMPLATE_REGISTRY.workspace;
  }

  // Form keywords
  if (
    useCaseLower.includes('create') ||
    useCaseLower.includes('edit') ||
    useCaseLower.includes('add') ||
    useCaseLower.includes('form')
  ) {
    return TEMPLATE_REGISTRY.form;
  }

  // Dashboard keywords
  if (
    useCaseLower.includes('dashboard') ||
    useCaseLower.includes('overview') ||
    useCaseLower.includes('metrics')
  ) {
    return TEMPLATE_REGISTRY.dashboard;
  }

  // Report keywords
  // if (
  //   useCaseLower.includes('report') ||
  //   useCaseLower.includes('generate') ||
  //   useCaseLower.includes('export')
  // ) {
  //   return TEMPLATE_REGISTRY.report;
  // }

  // Wizard keywords
  // if (
  //   useCaseLower.includes('wizard') ||
  //   useCaseLower.includes('step') ||
  //   useCaseLower.includes('onboarding') ||
  //   useCaseLower.includes('setup')
  // ) {
  //   return TEMPLATE_REGISTRY.wizard;
  // }

  return null;
}

/**
 * Helper function to list all available templates
 */
export function listAllTemplates(): TemplateRegistryEntry[] {
  return Object.values(TEMPLATE_REGISTRY);
}

/**
 * Helper function to get template by name
 */
export function getTemplateByName(name: string): TemplateRegistryEntry | undefined {
  return Object.values(TEMPLATE_REGISTRY).find(
    (template) => template.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Usage Examples:
 * 
 * // Get all templates
 * const allTemplates = listAllTemplates();
 * 
 * // Get recommendation
 * const recommendation = getTemplateRecommendation('I need to show a list of properties');
 * // Returns: WorkspaceTemplate
 * 
 * // Get specific template
 * const detailTemplate = getTemplateByName('DetailPageTemplate');
 */