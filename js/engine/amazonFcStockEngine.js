/**
 * Amazon FC Stock Engine (FINAL – STRICT LOGIC, FLEXIBLE HEADERS)
 * --------------------------------------------------------------
 * Correct per your original specification
 * Safe against Amazon CSV header quirks
 */

const EXCLUDED_FCS = ["XHNF", "QWZ8"];
const TARGET_SC_DAYS = 45;

export function buildAmazonFcStockPlan(fbaStockRows, skuMetrics) {
  if (!Array.isArray(fbaStockRows) || fbaStockRows.length === 0) {
    return {};
  }

  /* ---------------- SKU METRICS MAP ---------------- */
  const skuMap = {};
  skuMetrics.forEach(r => {
    skuMap[String(r.sku).trim()] = {
      total30D: r.total30D,
      drr: r.drr
    };
  });

  /* ---------------- HEADER NORMALIZATION ---------------- */
  const normalize = s =>
    String(s || "")
      .replace(/\ufeff/g, "")   // remove BOM
      .trim()
      .toLowerCase();

  const headerMap = {};
  Object.keys(fbaStockRows[0]).forEach(h => {
    headerMap[normalize(h)] = h;
  });

  const skuKey =
    headerMap["msku"] ||
    headerMap["merchant sku"] ||
    headerMap["seller sku"];

  const fcKey = headerMap["location"];
  const dispositionKey = headerMap["disposition"];
  const stockKey = headerMap["ending warehouse balance"];

  if (!skuKey || !fcKey || !dispositionKey || !stockKey) {
    console.error("Detected headers:", Object.keys(fbaStockRows[0]));
    throw new Error(
      "FBA Stock file does not match required Amazon format"
    );
  }

  /* ---------------- PROCESS ROWS ---------------- */
  const fcSkuStock = {};

  fbaStockRows.forEach(row => {
    const disposition = String(row[dispositionKey] || "").trim();
    if (disposition !== "SELLABLE") return;

    const fc = String(row[fcKey] || "").trim();
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    const sku = String(row[skuKey] || "").trim();
    if (!sku) return;

    const stock = Number(
      String(row[stockKey] || "0").replace(/,/g, "")
    );
    if (isNaN(stock) || stock <= 0) return;

    if (!fcSkuStock[fc]) fcSkuStock[fc] = {};
    fcSkuStock[fc][sku] = (fcSkuStock[fc][sku] || 0) + stock;
  });

  /* ---------------- BUILD OUTPUT ---------------- */
  const result = {};

  Object.keys(fcSkuStock).forEach(fc => {
    result[fc] = Object.keys(fcSkuStock[fc]).map(sku => {
      const base = skuMap[sku] || { total30D: 0, drr: 0 };
      const fcStock = fcSkuStock[fc][sku];
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
