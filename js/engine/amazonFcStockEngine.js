/**
 * Amazon FC Stock Engine – SAFE MODE (DEBUG)
 * ------------------------------------------
 * Purpose: prove FC + SKU data exists
 */

export function buildAmazonFcStockPlan(fbaStockRows) {
  const result = {};

  if (!Array.isArray(fbaStockRows) || fbaStockRows.length === 0) {
    console.warn("FBA Stock empty");
    return result;
  }

  const headers = Object.keys(fbaStockRows[0]);
  console.log("FBA STOCK HEADERS:", headers);

  const normalize = s =>
    String(s || "").replace(/\ufeff/g, "").trim().toLowerCase();

  const find = keys =>
    headers.find(h =>
      keys.some(k => normalize(h).includes(k))
    );

  const skuKey = find(["sku"]);
  const fcKey = find(["location", "warehouse", "fc"]);
  const stockKey = find(["ending", "balance", "available", "on hand"]);

  console.log("Detected keys:", { skuKey, fcKey, stockKey });

  fbaStockRows.forEach(row => {
    const fc = row[fcKey];
    const sku = row[skuKey];
    const stock = Number(
      String(row[stockKey] || "0").replace(/,/g, "")
    );

    if (!fc || !sku || isNaN(stock)) return;

    if (!result[fc]) result[fc] = [];
    result[fc].push({
      sku,
      fcStock: stock
    });
  });

  console.log("FC RESULT KEYS:", Object.keys(result));
  return result;
}
