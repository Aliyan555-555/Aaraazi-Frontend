/**
 * Custom Report Builder - Business Logic (stub)
 * UI-only: no localStorage, no data fetching.
 */

import {
  CustomReportTemplate,
  ReportConfiguration,
  CustomGeneratedReport,
  ReportColumn,
  AvailableField,
} from "../types/custom-reports";

export const saveCustomReport = (_template: CustomReportTemplate): void => {
  // no-op
};

export const getCustomReports = (): CustomReportTemplate[] => {
  return [];
};

export const getCustomReportById = (_id: string): CustomReportTemplate | null => {
  return null;
};

export const deleteCustomReport = (_id: string): void => {
  // no-op
};

export const updateCustomReport = (
  _id: string,
  _updates: Partial<CustomReportTemplate>
): void => {
  // no-op
};

export const incrementReportGeneration = (_templateId: string): void => {
  // no-op
};

export const generateReport = (
  config: ReportConfiguration,
  userId: string,
  _userRole: "admin" | "agent",
): CustomGeneratedReport => {
  const columns: ReportColumn[] = (config.fields || []).map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
  }));

  return {
    id: `report_${Date.now()}`,
    templateId: "",
    templateName: "Custom Report",
    config,
    data: {
      rows: [],
      summary: {},
      rowCount: 0,
      filteredRowCount: 0,
    },
    columns,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
    generatedByName: "User",
    parameters: {
      dateRange: { label: "All Time", startDate: "", endDate: "" },
      filters: {},
      dimensions: [],
      metrics: [],
    },
    exports: [],
  };
};

export const getAvailableFields = (_source: string): AvailableField[] => {
  return [];
};

export const validateReportConfig = (
  config: Partial<ReportConfiguration>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.dataSources || config.dataSources.length === 0) {
    errors.push("At least one data source must be selected");
  }

  if (!config.fields || config.fields.length === 0) {
    errors.push("At least one field must be selected");
  }

  if (
    config.grouping &&
    (!config.grouping.groupBy || config.grouping.groupBy.length === 0)
  ) {
    errors.push("Group by field must be selected when grouping is enabled");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
