export const CHART_COLORS = {
  // Primary brand colors (most important data)
  primary: '#C17052',      // Terracotta - Primary brand color
  success: '#2D6A54',      // Forest Green - Success/positive data
  
  // Extended palette for multi-series
  blue: '#3B82F6',         // Info blue - Neutral positive
  purple: '#8B5CF6',       // Accent purple - Secondary emphasis
  orange: '#F59E0B',       // Warning orange - Attention/caution
  red: '#DC2626',          // Error red - Negative/destructive
  teal: '#14B8A6',         // Teal - Alternative positive
  pink: '#EC4899',         // Pink - Alternative accent
  
  // Neutral colors
  slate: '#363F47',        // Slate - Primary text/neutral
  charcoal: '#1A1D1F',     // Charcoal - Dark emphasis
  warmGray: '#8C8780',     // Warm gray - Muted data
  lightGray: '#D4CFC3',    // Light gray - Subtle elements
} as const;

/**
 * SEMANTIC CHART COLORS
 * For charts with semantic meaning
 */
export const SEMANTIC_CHART_COLORS = {
  success: '#2D6A54',      // Forest Green - Positive/success metrics
  warning: '#F59E0B',      // Orange - Warning/attention needed
  error: '#DC2626',        // Red - Error/negative metrics
  info: '#3B82F6',         // Blue - Informational data
  neutral: '#8C8780',      // Warm Gray - Neutral/inactive
} as const;

/**
 * SEQUENTIAL COLOR ARRAYS
 * For charts needing multiple distinct colors
 */

// Primary sequence (most common - up to 6 series)
export const PRIMARY_SEQUENCE = [
  '#2D6A54',  // Forest Green
  '#C17052',  // Terracotta
  '#3B82F6',  // Blue
  '#8B5CF6',  // Purple
  '#F59E0B',  // Orange
  '#14B8A6',  // Teal
] as const;

// Extended sequence (for charts with 7-10 series)
export const EXTENDED_SEQUENCE = [
  '#2D6A54',  // Forest Green
  '#C17052',  // Terracotta
  '#3B82F6',  // Blue
  '#8B5CF6',  // Purple
  '#F59E0B',  // Orange
  '#14B8A6',  // Teal
  '#DC2626',  // Red
  '#EC4899',  // Pink
  '#363F47',  // Slate
  '#8C8780',  // Warm Gray
] as const;

// Monochromatic sequence (shades of Forest Green - for single-category charts)
export const FOREST_GREEN_SEQUENCE = [
  '#163529',  // forest-700 (darkest)
  '#1E4637',  // forest-600
  '#255745',  // forest-500
  '#2D6A54',  // forest-400 (brand)
  '#7AB89D',  // forest-300
  '#B3D9C8',  // forest-200
  '#DFF0E9',  // forest-100 (lightest)
] as const;

// Monochromatic sequence (shades of Terracotta - for single-category emphasis)
export const TERRACOTTA_SEQUENCE = [
  '#6D3825',  // terracotta-700 (darkest)
  '#8F4A33',  // terracotta-600
  '#A85D42',  // terracotta-500
  '#C17052',  // terracotta-400 (brand)
  '#D99A7E',  // terracotta-300
  '#E9C4B0',  // terracotta-200
  '#F9E6DD',  // terracotta-100 (lightest)
] as const;

/**
 * CHART ELEMENT COLORS
 * For axes, grids, and other chart elements
 */
export const CHART_ELEMENTS = {
  // Axes and labels
  axis: '#363F47',           // Slate - Axis lines and labels
  axisLabel: '#6B7580',      // Lighter slate - Axis label text
  
  // Grid lines
  gridLight: '#E8E2D5',      // Warm Cream - Light grid lines
  gridMedium: '#D4CFC3',     // Neutral-300 - Medium grid lines
  gridDark: '#C5CBD1',       // Slate-200 - Dark grid lines
  
  // Background
  chartBackground: '#FFFFFF',      // White - Chart background
  tooltipBackground: '#FFFFFF',    // White - Tooltip background
  tooltipBorder: '#D4CFC3',        // Neutral-300 - Tooltip border
  
  // Interactive elements
  hover: '#C17052',          // Terracotta - Hover state
  selected: '#2D6A54',       // Forest Green - Selected state
  disabled: '#B8B3A8',       // Neutral-400 - Disabled state
} as const;

/**
 * AREA/LINE CHART GRADIENTS
 * Gradient configurations for area charts
 */
export const CHART_GRADIENTS = {
  forestGreen: {
    start: 'rgba(45, 106, 84, 0.3)',    // forest-400 at 30%
    end: 'rgba(45, 106, 84, 0.05)',     // forest-400 at 5%
  },
  terracotta: {
    start: 'rgba(193, 112, 82, 0.3)',   // terracotta-400 at 30%
    end: 'rgba(193, 112, 82, 0.05)',    // terracotta-400 at 5%
  },
  blue: {
    start: 'rgba(59, 130, 246, 0.3)',   // blue at 30%
    end: 'rgba(59, 130, 246, 0.05)',    // blue at 5%
  },
  purple: {
    start: 'rgba(139, 92, 246, 0.3)',   // purple at 30%
    end: 'rgba(139, 92, 246, 0.05)',    // purple at 5%
  },
} as const;

/**
 * PIE/DONUT CHART COLORS
 * Optimized for pie charts with good contrast
 */
export const PIE_CHART_COLORS = [
  '#2D6A54',  // Forest Green
  '#C17052',  // Terracotta
  '#3B82F6',  // Blue
  '#F59E0B',  // Orange
  '#8B5CF6',  // Purple
  '#14B8A6',  // Teal
  '#DC2626',  // Red
  '#EC4899',  // Pink
] as const;

/**
 * STATUS-BASED COLORS
 * For charts showing status distribution
 */
export const STATUS_COLORS = {
  // Property/Cycle statuses
  active: '#2D6A54',         // Forest Green
  available: '#2D6A54',      // Forest Green
  listed: '#2D6A54',         // Forest Green
  
  pending: '#C17052',        // Terracotta
  'in-progress': '#C17052',  // Terracotta
  'under-contract': '#C17052', // Terracotta
  negotiation: '#C17052',    // Terracotta
  
  processing: '#3B82F6',     // Blue
  prospecting: '#3B82F6',    // Blue
  'due-diligence': '#3B82F6', // Blue
  
  completed: '#8C8780',      // Warm Gray
  sold: '#8C8780',           // Warm Gray
  closed: '#8C8780',         // Warm Gray
  ended: '#8C8780',          // Warm Gray
  
  cancelled: '#DC2626',      // Red
  failed: '#DC2626',         // Red
  rejected: '#DC2626',       // Red
  expired: '#DC2626',        // Red
} as const;

/**
 * FINANCIAL CHART COLORS
 * For financial reports and accounting charts
 */
export const FINANCIAL_COLORS = {
  revenue: '#2D6A54',        // Forest Green - Positive income
  expense: '#DC2626',        // Red - Negative expense
  profit: '#14B8A6',         // Teal - Net positive
  loss: '#F59E0B',           // Orange - Net negative
  asset: '#3B82F6',          // Blue - Assets
  liability: '#8B5CF6',      // Purple - Liabilities
  equity: '#C17052',         // Terracotta - Equity
  budget: '#8C8780',         // Warm Gray - Budget/target
  actual: '#2D6A54',         // Forest Green - Actual performance
} as const;

/**
 * UTILITY FUNCTIONS
 */

/**
 * Get color from sequence by index (with wrapping)
 */
export const getSequenceColor = (index: number, sequence: readonly string[] = PRIMARY_SEQUENCE): string => {
  return sequence[index % sequence.length];
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
  return STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS] || CHART_COLORS.warmGray;
};

/**
 * Get financial color
 */
export const getFinancialColor = (type: string): string => {
  const normalizedType = type.toLowerCase();
  return FINANCIAL_COLORS[normalizedType as keyof typeof FINANCIAL_COLORS] || CHART_COLORS.slate;
};

/**
 * Create gradient definition for area charts
 */
export const createGradient = (gradientType: keyof typeof CHART_GRADIENTS) => {
  return CHART_GRADIENTS[gradientType];
};

/**
 * RECHARTS CONFIGURATION
 * Default configuration for Recharts components
 */
export const RECHARTS_CONFIG = {
  // CartesianGrid
  cartesianGrid: {
    strokeDasharray: '3 3',
    stroke: CHART_ELEMENTS.gridLight,
    strokeOpacity: 0.5,
  },
  
  // Axes
  xAxis: {
    stroke: CHART_ELEMENTS.axisLabel,
    style: { fontSize: '12px', fill: CHART_ELEMENTS.axisLabel },
  },
  
  yAxis: {
    stroke: CHART_ELEMENTS.axisLabel,
    style: { fontSize: '12px', fill: CHART_ELEMENTS.axisLabel },
  },
  
  // Tooltip
  tooltip: {
    contentStyle: {
      backgroundColor: CHART_ELEMENTS.tooltipBackground,
      border: `1px solid ${CHART_ELEMENTS.tooltipBorder}`,
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    labelStyle: {
      color: CHART_ELEMENTS.axis,
      fontWeight: 500,
    },
  },
  
  // Legend
  legend: {
    iconType: 'circle' as const,
    wrapperStyle: {
      fontSize: '12px',
      paddingTop: '16px',
    },
  },
} as const;

/**
 * CHART TYPE RECOMMENDATIONS
 * Recommended color schemes by chart type
 */
export const CHART_RECOMMENDATIONS = {
  // Line charts - use PRIMARY_SEQUENCE for multiple series
  lineChart: PRIMARY_SEQUENCE,
  
  // Bar charts - use PRIMARY_SEQUENCE for multiple series
  barChart: PRIMARY_SEQUENCE,
  
  // Area charts - use gradients for better visibility
  areaChart: PRIMARY_SEQUENCE,
  
  // Pie/Donut charts - use PIE_CHART_COLORS for good contrast
  pieChart: PIE_CHART_COLORS,
  
  // Status distribution - use STATUS_COLORS
  statusChart: Object.values(STATUS_COLORS),
  
  // Financial charts - use FINANCIAL_COLORS
  financialChart: Object.values(FINANCIAL_COLORS),
} as const;

/**
 * EXAMPLE USAGE:
 * 
 * // Import in your chart component
 * import { PRIMARY_SEQUENCE, CHART_ELEMENTS, RECHARTS_CONFIG } from '../lib/chartColors';
 * 
 * // Use in Recharts components
 * <LineChart data={data}>
 *   <CartesianGrid {...RECHARTS_CONFIG.cartesianGrid} />
 *   <XAxis {...RECHARTS_CONFIG.xAxis} />
 *   <YAxis {...RECHARTS_CONFIG.yAxis} />
 *   <Tooltip {...RECHARTS_CONFIG.tooltip} />
 *   <Legend {...RECHARTS_CONFIG.legend} />
 *   <Line dataKey="sales" stroke={PRIMARY_SEQUENCE[0]} />
 *   <Line dataKey="revenue" stroke={PRIMARY_SEQUENCE[1]} />
 * </LineChart>
 * 
 * // For pie charts with Cell components
 * <Pie data={data} dataKey="value">
 *   {data.map((entry, index) => (
 *     <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
 *   ))}
 * </Pie>
 */
