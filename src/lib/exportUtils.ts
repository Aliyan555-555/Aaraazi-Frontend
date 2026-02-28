/**
 * Export Utilities
 * Client-side CSV generation for contacts, mirroring the prototype's exportContactsToCSV.
 */

// ============================================================================
// Types
// ============================================================================

interface ExportableContact {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  cnic?: string | null;
  type: string;
  category?: string | null;
  status: string;
  address?: string | null;
  tags?: string | null;
  agentId?: string | null;
  createdAt: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Escapes a value for safe CSV inclusion.
 * Wraps in double-quotes and escapes internal quotes.
 */
function csvEscape(value: string | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildRow(cells: (string | null | undefined)[]): string {
  return cells.map(csvEscape).join(',');
}

// ============================================================================
// Contacts CSV Export
// ============================================================================

const CONTACT_HEADERS = [
  'ID',
  'Name',
  'Phone',
  'Email',
  'CNIC',
  'Type',
  'Category',
  'Status',
  'Address',
  'Tags',
  'Agent ID',
  'Created At',
];

/**
 * Converts an array of contacts into a CSV string and triggers a browser download.
 *
 * @param contacts - Array of contact objects
 * @param filename - Optional filename (without .csv extension)
 */
export function exportContactsToCSV(
  contacts: ExportableContact[],
  filename = 'contacts',
): void {
  const rows = [
    CONTACT_HEADERS.join(','),
    ...contacts.map((c) =>
      buildRow([
        c.id,
        c.name,
        c.phone,
        c.email,
        c.cnic,
        c.type,
        c.category,
        c.status,
        c.address,
        c.tags,
        c.agentId,
        c.createdAt,
      ]),
    ),
  ];

  const csv = rows.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${formatDateForFilename(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Interactions CSV Export
// ============================================================================

interface ExportableInteraction {
  id: string;
  type: string;
  direction: string;
  summary: string;
  notes?: string | null;
  date: string;
  contactId?: string | null;
  agentId?: string | null;
  createdAt: string;
}

const INTERACTION_HEADERS = [
  'ID',
  'Type',
  'Direction',
  'Summary',
  'Notes',
  'Date',
  'Contact ID',
  'Agent ID',
  'Created At',
];

export function exportInteractionsToCSV(
  interactions: ExportableInteraction[],
  filename = 'interactions',
): void {
  const rows = [
    INTERACTION_HEADERS.join(','),
    ...interactions.map((i) =>
      buildRow([
        i.id,
        i.type,
        i.direction,
        i.summary,
        i.notes,
        i.date,
        i.contactId,
        i.agentId,
        i.createdAt,
      ]),
    ),
  ];

  const csv = rows.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${formatDateForFilename(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Shared helpers
// ============================================================================

function formatDateForFilename(date: Date): string {
  return date.toISOString().slice(0, 10);
}
