/**
 * Export Utilities
 * Helper functions for exporting data to CSV/Excel
 */

export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
): string {
  if (!data || !data.length) return "";

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          const value = row[fieldName];
          // Handle strings with commas
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return JSON.stringify(value);
        })
        .join(","),
    ),
  ].join("\n");

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportContactsToCSV(contacts: any[]) {
  if (!contacts || !contacts.length) return;

  const exportData = contacts.map((c) => ({
    Name: c.name,
    Phone: c.phone,
    Email: c.email || "",
    Type: c.type,
    Category: c.category || "",
    Status: c.status,
    Address: c.address || "",
    Notes: c.notes || c.preferences?.notes || "",
    CreatedAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
  }));

  const csv = convertToCSV(exportData);
  downloadCSV(
    csv,
    `contacts_export_${new Date().toISOString().split("T")[0]}.csv`,
  );
}
