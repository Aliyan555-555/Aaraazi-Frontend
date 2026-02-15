# aaraazi Templates - Design System V4.1

**Templates Directory** - Extended templates for special use cases

---

## 📚 Overview

This directory contains **extended templates** that go beyond the 3 core templates (DetailPageTemplate, WorkspaceTemplate, FormTemplate). These templates are created for specific contexts that require unique patterns not covered by the core templates.

---

## 🎯 Available Templates

### DashboardTemplate ✅

**Purpose**: Widget-based dashboards with real-time data, KPI metrics, and charts

**When to Use**:
- Page shows overview of multiple entity types
- KPI metrics and charts are primary content
- Real-time or periodic data updates required
- Tab-based navigation with different views
- Multi-entity overview focus

**When NOT to Use**:
- Single entity focus → Use `DetailPageTemplate`
- CRUD operations on list → Use `WorkspaceTemplate`
- Report generation → Consider `ReportTemplate`

**File**: `DashboardTemplate.tsx`

**Example**: `DashboardTemplateExample.tsx`

**Usage**:
```tsx
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';

<DashboardTemplate
  title="Sales Dashboard"
  description="Overview of sales performance"
  metrics={[
    { label: 'Revenue', value: 'PKR 5M', icon: <DollarSign />, trend: 12 },
    { label: 'Properties Sold', value: '45', icon: <Home />, trend: 8 },
  ]}
  primaryAction={{
    label: 'Export Report',
    onClick: handleExport,
  }}
  tabs={[
    { id: 'overview', label: 'Overview', content: <OverviewContent /> },
    { id: 'agents', label: 'Agents', content: <AgentsContent /> },
  ]}
/>
```

**Where Used**:
- Main Dashboard (`/components/Dashboard.tsx`)
- Agency Analytics Dashboard (`/components/AgencyAnalyticsDashboard.tsx`)
- Sales Dashboard
- Performance Dashboard

---

## 🔧 How to Create a New Template

### Decision Framework

Before creating a new template, ask:

1. **Can I use a core template?** (DetailPageTemplate, WorkspaceTemplate, FormTemplate)
   - If YES → Use it
   - If NO → Continue to #2

2. **Can I extend a core template?** (customContent, custom props)
   - If YES → Extend it
   - If NO → Continue to #3

3. **Will this pattern be used 2+ times?**
   - If YES → Create new template
   - If NO → Build custom component (not a template)

### Creation Checklist

When creating a new template, ensure:

- [ ] **Documented reason** - Why is this template needed?
- [ ] **Multiple use cases** - Where will it be used? (min 2-3 places)
- [ ] **Follows UX Laws** - Fitts, Miller, Hick, Jakob, Aesthetic-Usability
- [ ] **Uses design tokens** - 8px grid, CSS variables, no typography classes
- [ ] **Accessible** - WCAG 2.1 AA, keyboard nav, ARIA labels
- [ ] **TypeScript interfaces** - Full prop type definitions
- [ ] **JSDoc comments** - Comprehensive documentation
- [ ] **Example implementation** - At least one reference example
- [ ] **Added to registry** - Updated `index.ts` with template info
- [ ] **Updated docs** - Added to this README and main design system docs

### Template Structure

```tsx
/**
 * TemplateName - Template for [use case]
 * 
 * PURPOSE:
 * [What does this template provide?]
 * 
 * WHY NEW TEMPLATE?
 * [Why can't core templates handle this?]
 * 
 * WHEN TO USE:
 * - [Scenario 1]
 * - [Scenario 2]
 * 
 * WHEN NOT TO USE:
 * - [Alternative 1] (use [TemplateX])
 * - [Alternative 2] (use [TemplateY])
 * 
 * FOLLOWS DESIGN SYSTEM V4.1:
 * - UX Laws: [List specific laws applied]
 * - Design Tokens: [List tokens used]
 * - Accessibility: [List standards met]
 * 
 * @example
 * <TemplateName
 *   prop1="value"
 *   prop2={data}
 * />
 */

import React from 'react';
// imports...

export interface TemplateNameProps {
  // TypeScript props
}

export const TemplateName: React.FC<TemplateNameProps> = (props) => {
  // Implementation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Template content */}
    </div>
  );
};

export default TemplateName;
```

---

## 📖 Template Registry

All templates are registered in `index.ts`. This registry:
- Lists all available templates
- Documents when to use each template
- Provides helper functions for template recommendations
- Prevents template duplication

**Usage**:
```tsx
import { 
  TEMPLATE_REGISTRY, 
  listAllTemplates, 
  getTemplateRecommendation 
} from '@/components/templates';

// Get all templates
const allTemplates = listAllTemplates();

// Get recommendation
const recommendation = getTemplateRecommendation('dashboard with metrics');
// Returns: DashboardTemplate

// Check registry
console.log(TEMPLATE_REGISTRY.dashboard);
// {
//   name: 'DashboardTemplate',
//   path: '/components/templates/DashboardTemplate.tsx',
//   useCase: 'Widget-based dashboards...',
//   ...
// }
```

---

## 🎨 Design System Compliance

All templates in this directory MUST follow Design System V4.1 standards:

### UX Laws (Mandatory)

**Fitts's Law**: Primary action buttons min 44x44px
```tsx
<Button className="h-11 min-w-[120px]">Primary Action</Button>
```

**Miller's Law**: Max 5-7 items in groups
```tsx
// ✅ GOOD: Max 5 metrics
metrics={metrics.slice(0, 5)}

// ❌ BAD: Too many metrics
metrics={metrics} // 12 metrics
```

**Hick's Law**: Max 3 primary actions
```tsx
// ✅ GOOD: 1 primary, rest in dropdown
primaryAction={mainAction}
secondaryActions={[...otherActions]} // In dropdown

// ❌ BAD: Too many primary actions
<Button>Action 1</Button>
<Button>Action 2</Button>
<Button>Action 3</Button>
<Button>Action 4</Button>
```

**Jakob's Law**: Standard placement
- Breadcrumbs: Top-left
- Primary actions: Top-right
- Back button: Top-left
- Tabs: Below header

**Aesthetic-Usability Effect**:
- 8px grid spacing
- Consistent colors from CSS variables
- Smooth transitions

### Design Tokens (Required)

**Colors**: Use CSS variables
```tsx
// ✅ GOOD
className="bg-primary text-white"
className="bg-muted"

// ❌ BAD
className="bg-blue-500"
style={{ backgroundColor: '#030213' }}
```

**Spacing**: 8px grid only
```tsx
// ✅ GOOD
className="p-4 gap-4 mb-6"

// ❌ BAD
className="p-3 gap-5 mb-7"
```

**Typography**: Let CSS handle it
```tsx
// ✅ GOOD
<h1>{title}</h1>
<p>{description}</p>

// ❌ BAD
<h1 className="text-2xl font-bold">{title}</h1>
<p className="text-base">{description}</p>
```

### Accessibility (Non-Negotiable)

**ARIA Labels**:
```tsx
<Button
  onClick={handleAction}
  aria-label="Descriptive action name"
>
  <Icon />
  <span className="sr-only">Action for screen readers</span>
</Button>
```

**Keyboard Navigation**:
- Tab to navigate
- Enter to activate
- Escape to close/cancel
- Arrows for lists

**Focus Indicators**:
```tsx
className="focus:outline-none focus:ring-2 focus:ring-blue-500"
```

**Color Contrast**: WCAG 2.1 AA (4.5:1 minimum)

---

## 📊 Template Comparison

| Template | Use Case | Metrics | Tabs | Real-time | Charts |
|----------|----------|---------|------|-----------|--------|
| **DashboardTemplate** | Overview, KPIs | ✅ | ✅ | ✅ | ✅ |
| **DetailPageTemplate** | Single entity | ✅ | ✅ | ❌ | ❌ |
| **WorkspaceTemplate** | List/Grid | ✅ | ❌ | ❌ | ❌ |
| **FormTemplate** | Create/Edit | ❌ | ❌ | ❌ | ❌ |

---

## 🔄 Migration Guide

### Migrating to DashboardTemplate

**Before** (Custom Dashboard):
```tsx
export const CustomDashboard = ({ user }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-6 border-b">
        <h1>{title}</h1>
        <div className="grid grid-cols-5 gap-4 mt-4">
          {metrics.map(m => <MetricCard {...m} />)}
        </div>
      </div>
      <div>
        {/* Content */}
      </div>
    </div>
  );
};
```

**After** (DashboardTemplate):
```tsx
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';

export const CustomDashboard = ({ user }) => {
  return (
    <DashboardTemplate
      title={title}
      metrics={metrics}
      tabs={tabs}
      primaryAction={primaryAction}
    />
  );
};
```

**Benefits**:
- ✅ 70% less code
- ✅ Built-in UX Laws compliance
- ✅ Automatic accessibility
- ✅ Consistent with other dashboards
- ✅ Easier to maintain

---

## 🎓 Examples

### Example 1: Simple Dashboard

```tsx
<DashboardTemplate
  title="Sales Dashboard"
  metrics={[
    { label: 'Revenue', value: 'PKR 5M', icon: <DollarSign /> },
    { label: 'Deals', value: '45', icon: <Handshake /> },
  ]}
  content={<SalesContent />}
/>
```

### Example 2: Multi-Tab Dashboard

```tsx
<DashboardTemplate
  title="Agency Dashboard"
  metrics={metrics}
  tabs={[
    { id: 'overview', label: 'Overview', content: <Overview /> },
    { id: 'agents', label: 'Agents', content: <Agents />, badge: 12 },
    { id: 'properties', label: 'Properties', content: <Properties /> },
  ]}
/>
```

### Example 3: Real-time Dashboard

```tsx
<DashboardTemplate
  title="Live Metrics"
  metrics={metrics}
  refreshInterval={5000} // Update every 5 seconds
  onRefresh={fetchLatestData}
  lastUpdated={lastUpdateTime}
  tabs={tabs}
/>
```

---

## 🆘 Common Questions

**Q: When should I create a new template?**  
A: Only when:
1. Core templates don't fit (after trying to extend)
2. Pattern will be used 2+ times
3. Represents a distinct page type

**Q: Can I modify existing templates?**  
A: Yes, add new optional props. Don't change core behavior without team discussion.

**Q: What if my use case is unique?**  
A: Build a custom component (not a template). Templates are for repeatable patterns.

**Q: How do I document a new template?**  
A: Follow the creation checklist above. Add to registry, create example, update docs.

---

## 📚 Related Documentation

- **Design System Index**: `/DESIGN_SYSTEM_INDEX.md`
- **Comprehensive Guide**: `/DESIGN_SYSTEM_V4_COMPREHENSIVE_GUIDE.md`
- **Flexibility Guide**: `/DESIGN_SYSTEM_FLEXIBILITY_ADDENDUM.md`
- **Quick Reference**: `/DESIGN_SYSTEM_QUICK_REFERENCE_CARD.md`
- **Guidelines**: `/Guidelines.md`

---

## ✅ Quality Checklist

Before submitting a new template:

- [ ] Follows all UX Laws
- [ ] Uses design tokens (8px grid, CSS variables)
- [ ] Accessible (WCAG 2.1 AA)
- [ ] TypeScript interfaces defined
- [ ] JSDoc comments complete
- [ ] Example implementation created
- [ ] Added to template registry
- [ ] README updated
- [ ] Design system docs updated
- [ ] Tested with keyboard navigation
- [ ] Tested with screen reader
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Performance optimized

---

**Version**: 4.1.0  
**Last Updated**: December 27, 2024  
**Maintainer**: aaraazi Development Team

**Create templates wisely. Document thoroughly. Build consistently.** 🚀
