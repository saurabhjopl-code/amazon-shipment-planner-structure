const EXCLUDED_FCS = ["XHNF", "QWZ8"];

export function buildFCStock(fbaStockRows) {
  const fcStock = {};

  // find latest date
  const dates = fbaStockRows.map(r => r["Date"]).filter(Boolean);
  const latestDate = dates.sort().pop();

  fbaStockRows.forEach(row => {
    if (row["Date"] !== latestDate) return;
    if (row["Disposition"] !== "SELLABLE") return;

    const fc = row["Location"];
    if (EXCLUDED_FCS.includes(fc)) return;

    const sku = row["MSKU"];
    const stock = Number(row["Ending Warehouse Balance"] || 0);

    if (!sku || stock <= 0) return;

    if (!fcStock[fc]) fcStock[fc] = {};
    if (!fcStock[fc][sku]) fcStock[fc][sku] = 0;

    fcStock[fc][sku] += stock;
  });

  return fcStock;
}
