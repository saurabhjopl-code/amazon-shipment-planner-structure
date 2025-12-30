/**
 * Amazon FC Stock Engine (FINAL – Visible Empty-State)
 * ---------------------------------------------------
 * - Always returns FC keys if stock exists
 * - Does NOT hide FCs just because sales are zero
 * - Never silently returns empty without logging
 */

const EXCLUDED_FCS = ["XHNF", "QWZ8"];
const TARGET_SC_DAYS = 45;

export function buildAmazonFcStockPlan(fbaStockRows, skuMetrics) {
  const fcStockMap = {};
  const skuMap = {};
  const seenFcs = new Set();

  if (!fbaStockRows || fbaStockRows.length === 0) {
    console.warn("FBA Stock file empty");
    return {};
  }

  /* ---------------- SKU METRICS MAP ---------------- */
  skuMetrics.forEach(r => {
    skuMap[String(r.sku).trim()] = {
      total30D: r.total30D,
      drr: r.drr
    };
  });

  /* ---------------- HEADER DETECTION ---------------- */
  const normalize = s =>
    String(s || "")
      .replace(/\ufeff/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const headers = Object.keys(fbaStockRows[0]).map(h => ({
    raw: h,
    norm: normalize(h)
  }));

  const findHeader = keywords =>
    headers.find(h =>
      keywords.some(k => h.norm.includes(k))
    )?.raw;

  const skuKey = findHeader(["msku", "merchant sku", "seller sku"]);
  const fcKey = findHeader(["location", "warehouse", "fc"]);
  const stockKey = findHeader([
    "ending warehouse",
    "ending balance",
    "warehouse balance",
    "available"
  ]);

  if (!skuKey || !fcKey || !stockKey) {
    console.error("FBA Stock header scan:", headers);
    console.warn("No usable headers found in FBA stock");
    return {};
  }

  /* ---------------- AGGREGATE STOCK ---------------- */
  fbaStockRows.forEach(row => {
    const sku = String(row[skuKey] || "").trim();
    if (!sku) return;

    const fc = String(row[fcKey] || "").trim();
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    const stock = Number(
      String(row[stockKey] || "0").replace(/,/g, "")
    );
    if (isNaN(stock) || stock < 0) return;

    seenFcs.add(fc);

    if (!fcStockMap[fc]) fcStockMap[fc] = {};
    fcStockMap[fc][sku] = (fcStockMap[fc][sku] || 0) + stock;
  });

  if (seenFcs.size === 0) {
    console.warn("No Amazon FCs detected after exclusions");
  }

  /* ---------------- BUILD PLAN ---------------- */
  const result = {};

  seenFcs.forEach(fc => {
    const skuStock = fcStockMap[fc] || {};

    result[fc] = Object.keys(skuStock).map(sku => {
      const base = skuMap[sku] || { total30D: 0, drr: 0 };
      const fcStock = skuStock[sku];
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
