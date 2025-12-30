/**
 * Amazon FC Stock Engine (v1.1 + SAFE FC FIX)
 * ------------------------------------------
 * ONLY CHANGE from v1.1:
 * - FC is taken strictly from `Location`
 * - Numeric / junk FCs ignored
 * - Everything else unchanged
 */

const EXCLUDED_FCS = ["XHNF", "QWZ8"];
const TARGET_SC_DAYS = 45;

export function buildAmazonFcStockPlan(fbaStockRows, skuMetrics = []) {
  const result = {};
  if (!Array.isArray(fbaStockRows) || fbaStockRows.length === 0) {
    return result;
  }

  /* ---------- SKU METRICS MAP (UNCHANGED) ---------- */
  const skuMap = {};
  skuMetrics.forEach(r => {
    skuMap[String(r.sku).trim()] = {
      total30D: r.total30D || 0,
      drr: r.drr || 0
    };
  });

  /* ---------- REQUIRED COLUMN ---------- */
  if (!("Location" in fbaStockRows[0])) {
    console.warn("FBA Stock: Location column missing");
    return result;
  }

  /* ---------- SKU & STOCK KEYS (v1.1 STYLE) ---------- */
  const skuKey =
    "MSKU" in fbaStockRows[0]
      ? "MSKU"
      : "Merchant SKU" in fbaStockRows[0]
      ? "Merchant SKU"
      : "Seller SKU";

  const stockKey =
    "Ending Warehouse Balance" in fbaStockRows[0]
      ? "Ending Warehouse Balance"
      : "Available";

  /* ---------- PROCESS ROWS ---------- */
  fbaStockRows.forEach(row => {
    const fc = String(row["Location"] || "").trim();

    // 🔒 SAFE FC FIX
    if (!fc) return;
    if (/^[0-9]+$/.test(fc)) return; // ignore "28", "32", etc
    if (EXCLUDED_FCS.includes(fc)) return;

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
