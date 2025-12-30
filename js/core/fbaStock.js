const EXCLUDED_FCS = ["XHNF", "QWZ8"];

export function buildFCStock(rows) {
  const fcStock = {};

  if (!rows || rows.length === 0) {
    console.error("FBA Stock file is empty");
    return {};
  }

  // Normalize header keys (trim + lowercase)
  const normalize = k => k.trim().toLowerCase();

  const headers = Object.keys(rows[0]).reduce((acc, k) => {
    acc[normalize(k)] = k;
    return acc;
  }, {});

  const skuKey = headers["msku"];
  const locationKey = headers["location"] || headers["warehouse"];
  const dispKey = headers["disposition"];
  const stockKey = Object.keys(headers).find(k =>
    k.includes("ending")
  );

  if (!skuKey || !locationKey || !stockKey) {
    console.error("Required FBA Stock headers missing", headers);
    return {};
  }

  rows.forEach(row => {
    const fc = row[locationKey]?.trim();
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    const sku = row[skuKey]?.trim();
    if (!sku) return;

    const disp = (row[dispKey] || "").toString().trim().toUpperCase();
    if (disp && disp !== "SELLABLE") return; // tolerate blanks

    const stock = Number(row[headers[stockKey]] || 0);
    if (stock <= 0) return;

    if (!fcStock[fc]) fcStock[fc] = {};
    fcStock[fc][sku] = (fcStock[fc][sku] || 0) + stock;
  });

  return fcStock;
}
