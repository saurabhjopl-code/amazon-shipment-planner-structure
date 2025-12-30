/**
 * Amazon FC Stock Engine (v1.2 – Hardened)
 * ---------------------------------------
 * Robust against real Amazon FBA Stock exports
 */

const EXCLUDED_FCS = ["XHNF", "QWZ8"];
const TARGET_SC_DAYS = 45;

export function buildAmazonFcStockPlan(fbaStockRows, skuMetrics) {
  const fcStockMap = {};
  const skuMap = {};

  /* ---------------- SKU METRICS MAP ---------------- */
  skuMetrics.forEach(r => {
    skuMap[String(r.sku).trim()] = {
      total30D: r.total30D,
      drr: r.drr
    };
  });

  if (!fbaStockRows || fbaStockRows.length === 0) {
    console.warn("FBA Stock file empty");
    return {};
  }

  /* ---------------- HEADER NORMALIZATION ---------------- */
  const normalize = s =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const headerMap = {};
  Object.keys(fbaStockRows[0]).forEach(h => {
    headerMap[normalize(h)] = h;
  });

  const skuKey =
    headerMap["msku"] ||
    headerMap["merchant sku"];

  const fcKey =
    headerMap["location"] ||
    headerMap["warehouse"];

  const stockKey =
    headerMap["ending warehouse balance"] ||
    headerMap["ending balance"];

  if (!skuKey || !fcKey || !stockKey) {
    console.error("Detected headers:", headerMap);
    throw new Error("FBA Stock headers not detected correctly");
  }

  /* ---------------- AGGREGATE FC STOCK ---------------- */
  fbaStockRows.forEach(row => {
    const sku = String(row[skuKey] || "").trim();
    if (!sku) return;

    const fc = String(row[fcKey] || "").trim();
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    const stock = Number(row[stockKey] || 0);
    if (stock <= 0) return;

    if (!fcStockMap[fc]) fcStockMap[fc] = {};
    fcStockMap[fc][sku] = (fcStockMap[fc][sku] || 0) + stock;
  });

  /* ---------------- BUILD FINAL PLAN ---------------- */
  const result = {};

  Object.keys(fcStockMap).forEach(fc => {
    result[fc] = Object.keys(fcStockMap[fc]).map(sku => {
      const base = skuMap[sku] || { total30D: 0, drr: 0 };
      const fcStock = fcStockMap[fc][sku];
      const drr = base.drr || 0;

      const sc = drr > 0 ? fcStock / drr : Infinity;

      const sendQty =
        drr > 0 && sc < TARGET_SC_DAYS
          ? Math.max(Math.floor(TARGET_SC_DAYS * drr - fcStock), 0)
          : 0;

      const recallQty =
        drr > 0 && sc > TARGET_SC_DAYS
          ? Math.max(Math.floor(fcStock - TARGET_SC_DAYS * drr), 0)
          : 0;

      return {
        sku,
        total30D: base.total30D,
        drr,
        fcStock,
        sc: sc === Infinity ? "∞" : Number(sc.toFixed(1)),
        sendQty,
        recallQty
      };
    });
  });

  return result;
}
