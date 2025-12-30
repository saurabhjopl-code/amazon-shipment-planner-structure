/**
 * Amazon FC Stock Engine (FINAL – NEVER EMPTY)
 * --------------------------------------------
 * Guarantees FC keys always returned
 */

const EXCLUDED_FCS = ["XHNF", "QWZ8"];
const TARGET_SC_DAYS = 45;

export function buildAmazonFcStockPlan(fbaStockRows, skuMetrics) {
  const fcSkuStock = {};
  const skuMap = {};
  const allFcs = new Set();

  if (!Array.isArray(fbaStockRows)) return {};

  // SKU metrics
  skuMetrics.forEach(r => {
    skuMap[String(r.sku).trim()] = {
      total30D: r.total30D,
      drr: r.drr
    };
  });

  // Normalize
  const norm = s =>
    String(s || "")
      .replace(/\ufeff/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const headers = Object.keys(fbaStockRows[0] || {}).map(h => ({
    raw: h,
    norm: norm(h)
  }));

  const find = keys =>
    headers.find(h => keys.some(k => h.norm.includes(k)))?.raw;

  const skuKey = find(["msku", "seller sku"]);
  const fcKey = find(["location", "warehouse", "fc"]);
  const stockKey = find(["ending warehouse", "ending balance"]);

  if (!skuKey || !fcKey) return {};

  fbaStockRows.forEach(row => {
    const fc = String(row[fcKey] || "").trim();
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    allFcs.add(fc);

    const sku = String(row[skuKey] || "").trim();
    if (!sku) return;

    const stock = Number(
      String(row[stockKey] || "0").replace(/,/g, "")
    );

    if (!fcSkuStock[fc]) fcSkuStock[fc] = {};
    if (!isNaN(stock) && stock > 0) {
      fcSkuStock[fc][sku] = (fcSkuStock[fc][sku] || 0) + stock;
    }
  });

  // 🚨 CRITICAL FIX: Always return FC keys
  const result = {};
  allFcs.forEach(fc => {
    const skuStocks = fcSkuStock[fc] || {};
    result[fc] = Object.keys(skuStocks).map(sku => {
      const base = skuMap[sku] || { total30D: 0, drr: 0 };
      const fcStock = skuStocks[sku];
      const drr = base.drr || 0;
      const sc = drr > 0 ? fcStock / drr : "∞";

      return {
        sku,
        total30D: base.total30D,
        drr,
        fcStock,
        sc,
        sendQty:
          drr > 0 && sc < TARGET_SC_DAYS
            ? Math.max(Math.floor(TARGET_SC_DAYS * drr - fcStock), 0)
            : 0,
        recallQty:
          drr > 0 && sc > TARGET_SC_DAYS
            ? Math.max(Math.floor(fcStock - TARGET_SC_DAYS * drr), 0)
            : 0
      };
    });
  });

  return result;
}
