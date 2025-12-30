/**
 * Amazon FC Stock Engine (STABLE BASELINE – v1.1 RESTORED)
 * -------------------------------------------------------
 * Goal: NEVER return empty due to logic
 * Business rules will be layered later
 */

const EXCLUDED_FCS = ["XHNF", "QWZ8"];
const TARGET_SC_DAYS = 45;

export function buildAmazonFcStockPlan(fbaStockRows, skuMetrics = []) {
  const result = {};
  if (!Array.isArray(fbaStockRows) || fbaStockRows.length === 0) {
    return result;
  }

  /* ---------- SKU METRICS MAP ---------- */
  const skuMap = {};
  skuMetrics.forEach(r => {
    skuMap[String(r.sku).trim()] = {
      total30D: r.total30D || 0,
      drr: r.drr || 0
    };
  });

  /* ---------- HEADER DETECTION (NON-BLOCKING) ---------- */
  const normalize = s =>
    String(s || "").replace(/\ufeff/g, "").trim().toLowerCase();

  const headers = Object.keys(fbaStockRows[0]);
  const find = keys =>
    headers.find(h =>
      keys.some(k => normalize(h).includes(k))
    );

  const skuKey = find(["msku", "sku"]);
  const fcKey = find(["location", "warehouse", "fc"]);
  const stockKey = find(["ending", "balance", "available"]);

  /* ---------- PROCESS ROWS (NO HARD FILTERS) ---------- */
  fbaStockRows.forEach(row => {
    const fc = String(row[fcKey] || "").trim();
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    if (!result[fc]) result[fc] = [];

    const sku = String(row[skuKey] || "").trim();
    const stock = Number(
      String(row[stockKey] || "0").replace(/,/g, "")
    );

    const base = skuMap[sku] || { total30D: 0, drr: 0 };
    const drr = base.drr;
    const sc = drr > 0 ? stock / drr : "∞";

    result[fc].push({
      sku,
      total30D: base.total30D,
      drr,
      fcStock: isNaN(stock) ? 0 : stock,
      sc,
      sendQty:
        drr > 0 && sc < TARGET_SC_DAYS
          ? Math.max(Math.floor(TARGET_SC_DAYS * drr - stock), 0)
          : 0,
      recallQty:
        drr > 0 && sc > TARGET_SC_DAYS
          ? Math.max(Math.floor(stock - TARGET_SC_DAYS * drr), 0)
          : 0
    });
  });

  return result;
}
