/**
 * Export Utilities
 * Functions for exporting data to CSV and JSON formats
 */

import { Property, Deal, Contact } from '../types';
import { formatPKR } from './currency';
import { formatDate } from './validation';

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], headers: string[]): string {
  const rows = [headers];
  
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      
      // Handle different types
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      // Escape commas and quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    rows.push(row);
  });
  
  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Download file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generic export to CSV
 * Accepts an array of objects and exports to CSV
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csv = convertToCSV(data, headers);
  const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  
  downloadFile(csv, csvFilename, 'text/csv;charset=utf-8;');
}

/**
 * Export properties to CSV
 */
export function exportPropertiesToCSV(properties: Property[]) {
  const data = properties.map(p => ({
    ID: p.id,
    Title: p.title || '',
    Address: p.address,
    Type: p.propertyType,
    Status: p.status,
    Price: p.price,
    Area: p.area,
    AreaUnit: p.areaUnit,
    Bedrooms: p.bedrooms || '',
    Bathrooms: p.bathrooms || '',
    Owner: p.currentOwnerId || '',
    OwnerType: p.currentOwnerType,
    AgentID: p.agentId || '',
    CreatedAt: formatDate(p.createdAt),
    UpdatedAt: formatDate(p.updatedAt),
  }));
  
  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `properties_export_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export deals to CSV
 */
export function exportDealsToCSV(deals: Deal[]) {
  const data = deals.map(d => ({
    ID: d.id,
    PropertyID: d.propertyId,
    DealType: d.dealType,
    Stage: d.stage,
    Status: d.status,
    BuyerID: d.buyerId || '',
    SellerID: d.sellerId || '',
    AgentID: d.agentId || '',
    DealValue: d.dealValue,
    Commission: d.commission || '',
    CommissionRate: d.commissionRate || '',
    CreatedAt: formatDate(d.createdAt),
    ExpectedClosingDate: d.expectedClosingDate ? formatDate(d.expectedClosingDate) : '',
  }));
  
  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `deals_export_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export contacts to CSV
 */
export function exportContactsToCSV(contacts: Contact[]) {
  const data = contacts.map(c => ({
    ID: c.id,
    Name: c.name,
    Email: c.email || '',
    Phone: c.phone || '',
    Type: c.type,
    Role: c.role || '',
    Status: c.status || '',
    Source: c.source || '',
    AssignedAgent: c.assignedAgent || '',
    CreatedAt: formatDate(c.createdAt),
    LastContactedAt: c.lastContactedAt ? formatDate(c.lastContactedAt) : '',
  }));
  
  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const jsonFilename = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  
  downloadFile(json, jsonFilename, 'application/json');
}

/**
 * Export properties with financials to CSV
 */
export function exportPropertiesWithFinancialsToCSV(
  propertiesWithFinancials: Array<{
    property: Property;
    totalIncome: number;
    totalExpenses: number;
    operatingProfit: number;
    acquisitionCost: number;
    roi: number;
  }>
) {
  const data = propertiesWithFinancials.map(item => ({
    ID: item.property.id,
    Title: item.property.title || '',
    Address: item.property.address,
    Type: item.property.propertyType,
    Price: formatPKR(item.property.price),
    AcquisitionCost: formatPKR(item.acquisitionCost),
    TotalIncome: formatPKR(item.totalIncome),
    TotalExpenses: formatPKR(item.totalExpenses),
    OperatingProfit: formatPKR(item.operatingProfit),
    ROI: `${item.roi.toFixed(2)}%`,
    Status: item.property.status,
  }));
  
  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `properties_financial_report_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Print current page
 */
export function printCurrentPage() {
  window.print();
}
