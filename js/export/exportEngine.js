/**
 * Export Engine (v1.6)
 * -------------------
 * Supports:
 *  - CSV export
 *  - Excel (.xlsx) multi-sheet export
 *
 * EXPECTED DATA SHAPES
 *
 * amazonFcPlans = {
 *   FC_CODE: [ { col1, col2, ... } ]
 * }
 *
 * sellerFcPlan = [ { col1, col2, ... } ]
 */

import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

/* ---------------- CSV EXPORT ---------------- */

export function exportCsv(filename, rows) {
  if (!rows || rows.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r =>
      headers.map(h => `"${r[h] ?? ""}"`).join(",")
    )
  ].join("\n");

  downloadFile(csv, filename, "text/csv");
}

/* ---------------- EXCEL EXPORT ---------------- */

export function exportAllToExcel(
  amazonFcPlans,
  sellerFcPlan,
  filename = "Amazon_Shipment_Plan.xlsx"
) {
  const wb = XLSX.utils.book_new();

  // Amazon FC sheets
  Object.keys(amazonFcPlans).forEach(fc => {
    const rows = amazonFcPlans[fc];
    if (!rows || rows.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, fc);
  });

  // Seller FC sheet
  if (sellerFcPlan && sellerFcPlan.length > 0) {
    const ws = XLSX.utils.json_to_sheet(sellerFcPlan);
    XLSX.utils.book_append_sheet(wb, ws, "Seller_FC");
  }

  XLSX.writeFile(wb, filename);
}

/* ---------------- HELPERS ---------------- */

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
