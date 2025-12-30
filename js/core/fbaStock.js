export function buildFCStock(rows) {
  const fcStock = {};
  const debug = {
    totalRows: rows.length,
    detectedHeaders: Object.keys(rows[0] || {}),
    usedStockKey: null,
    usedSkuKey: null,
    usedFcKey: null
  };

  if (!rows || rows.length === 0) {
    return { fcStock: {}, debug };
  }

  // normalize headers
  const normalize = s => s.trim().toLowerCase();
  const headerMap = {};
  Object.keys(rows[0]).forEach(k => {
    headerMap[normalize(k)] = k;
  });

  // extremely tolerant detection
  const skuKey =
    headerMap["msku"] ||
    headerMap["merchant sku"] ||
    headerMap["sku"];

  const fcKey =
    headerMap["location"] ||
    headerMap["location id"] ||
    headerMap["warehouse"];

  const stockKey =
    headerMap["ending warehouse balance"] ||
    headerMap["ending balance"] ||
    Object.keys(headerMap).find(k => k.includes("ending"));

  debug.usedSkuKey = skuKey;
  debug.usedFcKey = fcKey;
  debug.usedStockKey = stockKey;

  if (!skuKey || !fcKey || !stockKey) {
    return { fcStock: {}, debug };
  }

  rows.forEach(row => {
    const sku = String(row[skuKey] || "").trim();
    const fc = String(row[fcKey] || "").trim();
    const stock = Number(row[stockKey] || 0);

    if (!sku || !fc || stock <= 0) return;

    if (!fcStock[fc]) fcStock[fc] = {};
    fcStock[fc][sku] = (fcStock[fc][sku] || 0) + stock;
  });

  return { fcStock, debug };
}
