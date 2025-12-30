/**
 * Amazon FC Stock Engine (FINAL – STRICT HEADER MAPPING)
 * -----------------------------------------------------
 * Uses ONLY official Amazon FBA Stock headers
 * No fuzzy detection, no guessing
 */

const EXCLUDED_FCS = ["XHNF", "QWZ8"];
const TARGET_SC_DAYS = 45;

export function buildAmazonFcStockPlan(fbaStockRows, skuMetrics) {
  const result = {};
  const skuMap = {};

  if (!Array.isArray(fbaStockRows) || fbaStockRows.length === 0) {
    return {};
  }

  /* ---------------- SKU METRICS ---------------- */
  skuMetrics.forEach(r => {
    skuMap[String(r.sku).trim()] = {
      total30D: r.total30D,
      drr: r.drr
    };
  });

  /* ---------------- REQUIRED HEADERS ---------------- */
  const REQUIRED_HEADERS = [
    "MSKU",
    "Location",
    "Disposition",
    "Ending Warehouse Balance"
  ];

  const headers = Object.keys(fbaStockRows[0]);

  for (const h of REQUIRED_HEADERS) {
    if (!headers.includes(h)) {
      throw new Error(`Missing required FBA Stock column: ${h}`);
    }
  }

  /* ---------------- PROCESS ROWS ---------------- */
  fbaStockRows.forEach(row => {
    const disposition = String(row["Disposition"] || "").trim();
    if (disposition !== "SELLABLE") return;

    const fc = String(row["Location"] || "").trim();
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    const sku = String(row["MSKU"] || "").trim();
    if (!sku) return;

    const stock = Number(
      String(row["Ending Warehouse Balance"] || "0").replace(/,/g, "")
    );
    if (isNaN(stock) || stock <= 0) return;

    if (!result[fc]) result[fc] = {};
    result[fc][sku] = (result[fc][sku] || 0) + stock;
  });

  /* ---------------- BUILD FINAL OUTPUT ---------------- */
  const finalOutput = {};

  Object.keys(result).forEach(fc => {
    finalOutput[fc] = Object.keys(result[fc]).map(sku => {
      const base = skuMap[sku] || { total30D: 0, drr: 0 };
      const fcStock = result[fc][sku];
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

  return finalOutput;
}
