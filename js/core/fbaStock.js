const EXCLUDED_FCS = ["XHNF", "QWZ8"];

export function buildFCStock(rows) {
  const fcStock = {};

  // Find latest date
  const dates = rows
    .map(r => r["Date"])
    .filter(Boolean)
    .sort();

  if (dates.length === 0) return {};

  const latestDate = dates[dates.length - 1];

  rows.forEach(row => {
    if (row["Date"] !== latestDate) return;
    if (row["Disposition"] !== "SELLABLE") return;

    const fc = row["Location"];
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    const sku = row["MSKU"];
    const stock = Number(row["Ending Warehouse Balance"] || 0);

    if (!sku || stock <= 0) return;

    if (!fcStock[fc]) fcStock[fc] = {};
    if (!fcStock[fc][sku]) fcStock[fc][sku] = 0;

    fcStock[fc][sku] += stock;
  });

  return fcStock;
}
