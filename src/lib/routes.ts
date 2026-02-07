/**
 * Centralized Route Registry
 *
 * Replaces hardcoded validPages array in App.tsx with a maintainable,
 * extensible route system that prevents valid routes from being rejected.
 *
 * Benefits:
 * - Single source of truth for all routes
 * - Easy to add new routes
 * - Type-safe route definitions
 * - Route metadata support
 */

export interface RouteDefinition {
  /** Route path (e.g., 'dashboard', 'property-detail') */
  path: string;
  /** Human-readable name */
  name: string;
  /** Route category for organization */
  category:
    | "dashboard"
    | "properties"
    | "contacts"
    | "leads"
    | "deals"
    | "financials"
    | "tasks"
    | "reports"
    | "settings"
    | "admin";
  /** Whether this route requires authentication */
  requiresAuth?: boolean;
  /** Whether this route requires specific permissions */
  requiredPermissions?: string[];
  /** Route description */
  description?: string;
}

/**
 * Centralized Route Registry
 *
 * Add all valid routes here. The navigation system will use this
 * instead of a hardcoded array, making it easy to add new routes
 * without modifying App.tsx.
 */
export const ROUTE_REGISTRY: RouteDefinition[] = [
  // Dashboard Routes
  { path: "dashboard", name: "Dashboard", category: "dashboard" },
  {
    path: "properties-dashboard",
    name: "Properties Dashboard",
    category: "dashboard",
  },

  // Property Routes
  { path: "inventory", name: "Property Inventory", category: "properties" },
  { path: "add-property", name: "Add Property", category: "properties" },
  { path: "property-detail", name: "Property Details", category: "properties" },

  // Lead Routes
  { path: "add-lead", name: "Add Lead", category: "leads" },
  { path: "leads", name: "Leads", category: "leads" },
  { path: "lead-details", name: "Lead Details", category: "leads" },

  // Contact Routes
  { path: "contacts", name: "Contacts", category: "contacts" },
  { path: "contact-details", name: "Contact Details", category: "contacts" },
  { path: "add-contact", name: "Add Contact", category: "contacts" },
  { path: "edit-contact", name: "Edit Contact", category: "contacts" },

  // Deal Routes
  { path: "deals", name: "Deals", category: "deals" },
  { path: "deal-details", name: "Deal Details", category: "deals" },
  { path: "deal-detail", name: "Deal Detail", category: "deals" }, // Alternative naming

  // Transaction Cycle Routes
  { path: "sell-cycles", name: "Sell Cycles", category: "properties" },
  {
    path: "sell-cycle-detail",
    name: "Sell Cycle Details",
    category: "properties",
  },
  { path: "purchase-cycles", name: "Purchase Cycles", category: "properties" },
  {
    path: "purchase-cycle-detail",
    name: "Purchase Cycle Details",
    category: "properties",
  },
  { path: "rent-cycles", name: "Rent Cycles", category: "properties" },
  {
    path: "rent-cycle-detail",
    name: "Rent Cycle Details",
    category: "properties",
  },

  // Requirement Routes
  {
    path: "buyer-requirements",
    name: "Buyer Requirements",
    category: "contacts",
  },
  {
    path: "buyer-requirement-detail",
    name: "Buyer Requirement Details",
    category: "contacts",
  },
  {
    path: "rent-requirements",
    name: "Rent Requirements",
    category: "contacts",
  },
  {
    path: "rent-requirement-detail",
    name: "Rent Requirement Details",
    category: "contacts",
  },

  // Financial Routes
  { path: "financials", name: "Financials", category: "financials" },
  { path: "budgeting", name: "Budgeting", category: "financials" },
  { path: "portfolio", name: "Portfolio", category: "financials" },
  {
    path: "project-accounting",
    name: "Project Accounting",
    category: "financials",
  },
  {
    path: "banking-treasury",
    name: "Banking & Treasury",
    category: "financials",
  },
  {
    path: "advanced-financials",
    name: "Advanced Financials",
    category: "financials",
  },
  { path: "reports", name: "Reports", category: "financials" },

  // Task Routes
  { path: "tasks", name: "Tasks", category: "tasks" },
  { path: "task-details", name: "Task Details", category: "tasks" },

  // Project Routes
  { path: "projects", name: "Projects", category: "properties" },
  { path: "add-project", name: "Add Project", category: "properties" },
  { path: "edit-project", name: "Edit Project", category: "properties" },
  { path: "project-detail", name: "Project Details", category: "properties" },

  // Land Acquisition Routes
  {
    path: "land-acquisition",
    name: "Land Acquisition",
    category: "properties",
  },
  { path: "add-land-parcel", name: "Add Land Parcel", category: "properties" },
  {
    path: "edit-land-parcel",
    name: "Edit Land Parcel",
    category: "properties",
  },
  {
    path: "land-parcel-detail",
    name: "Land Parcel Details",
    category: "properties",
  },

  // Procurement Routes
  { path: "procurement", name: "Procurement", category: "properties" },
  {
    path: "smart-procurement",
    name: "Smart Procurement",
    category: "properties",
  },
  {
    path: "supplier-management",
    name: "Supplier Management",
    category: "properties",
  },
  {
    path: "central-inventory",
    name: "Central Inventory",
    category: "properties",
  },
  { path: "goods-receipt", name: "Goods Receipt", category: "properties" },

  // Other Routes
  { path: "buyer-workspace", name: "Buyer Workspace", category: "contacts" },
  {
    path: "feasibility-calculator",
    name: "Feasibility Calculator",
    category: "properties",
  },
  { path: "agency", name: "Agency", category: "settings" },
  { path: "analytics", name: "Analytics", category: "reports" },
  { path: "documents", name: "Documents", category: "settings" },
  {
    path: "document-templates",
    name: "Document Templates",
    category: "settings",
  },
  { path: "notifications", name: "Notifications", category: "settings" },
  { path: "user-profile", name: "User Profile", category: "settings" },
  { path: "settings", name: "Settings", category: "settings" },
];

/**
 * Get all valid route paths
 */
export function getValidRoutePaths(): string[] {
  return ROUTE_REGISTRY.map((route) => route.path);
}

/**
 * Check if a route path is valid
 */
export function isValidRoute(path: string): boolean {
  const route = getRouteDefinition(path);
  return route !== undefined;
}

/**
 * Get route definition by path
 */
export function getRouteDefinition(path: string): RouteDefinition | undefined {
  return ROUTE_REGISTRY.find((route) => route.path === path);
}

/**
 * Get routes by category
 */
export function getRoutesByCategory(
  category: RouteDefinition["category"],
): RouteDefinition[] {
  return ROUTE_REGISTRY.filter((route) => route.category === category);
}

/**
 * Parse route string and extract path and query params
 */
export function parseRoute(route: string): {
  path: string;
  queryParams: Record<string, string>;
} {
  const [path, queryString] = route.split("?");
  const queryParams: Record<string, string> = {};

  if (queryString) {
    queryString.split("&").forEach((param) => {
      const [key, value] = param.split("=");
      if (key) {
        queryParams[decodeURIComponent(key)] = decodeURIComponent(value || "");
      }
    });
  }

  return { path, queryParams };
}
