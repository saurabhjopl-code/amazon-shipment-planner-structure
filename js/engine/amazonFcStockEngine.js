/**
 * Amazon FC Stock Engine (FINAL – ERROR-PROOF)
 * -------------------------------------------
 * - No hard failures
 * - Amazon CSV tolerant
 * - Business-rule strict
 */

const EXCLUDED_FCS = ["XHNF", "QWZ8"];
const TARGET_SC_DAYS = 45;

export function buildAmazonFcStockPlan(fbaStockRows, skuMetrics) {
  const output = {};
  if (!Array.isArray(fbaStockRows) || fbaStockRows.length === 0) {
    console.warn("FBA Stock: empty file");
    return output;
  }

  /* ---------------- SKU METRICS ---------------- */
  const skuMap = {};
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

  const headers = Object.keys(fbaStockRows[0]);
  const headerNorm = headers.map(h => ({
    raw: h,
    norm: normalize(h)
  }));

  const pick = keys =>
    headerNorm.find(h => keys.some(k => h.norm.includes(k)))?.raw;

  const skuKey = pick(["msku", "merchant sku", "seller sku", "sku"]);
  const fcKey = pick(["location", "warehouse", "fc"]);
  const dispositionKey = pick(["disposition", "inventory condition"]);
  const stockKey = pick([
    "ending warehouse",
    "ending balance",
    "available",
    "on hand"
  ]);

  if (!skuKey || !fcKey || !dispositionKey || !stockKey) {
    console.warn("FBA Stock: unable to confidently map headers", headers);
    return output; // SAFE EXIT — NO CRASH
  }

  /* ---------------- PROCESS ROWS ---------------- */
  fbaStockRows.forEach(row => {
    const disposition = String(row[dispositionKey] || "").trim();
    if (disposition !== "SELLABLE") return;

    let fc = String(row[fcKey] || "")
      .replace(/"/g, "")
      .trim();

    if (!fc || EXCLUDED_FCS.includes(fc)) return;
    if (/^[0-9]+$/.test(fc)) return; // guard junk

    const sku = String(row[skuKey] || "").trim();
    if (!sku) return;

    const stock = Number(
      String(row[stockKey] || "0").replace(/,/g, "")
    );
    if (isNaN(stock) || stock <= 0) return;

    if (!output[fc]) output[fc] = {};
    output[fc][sku] = (output[fc][sku] || 0) + stock;
  });

  /* ---------------- BUILD FINAL STRUCTURE ---------------- */
  const finalResult = {};
  Object.keys(output).forEach(fc => {
    finalResult[fc] = Object.keys(output[fc]).map(sku => {
      const base = skuMap[sku] || { total30D: 0, drr: 0 };
      const fcStock = output[fc][sku];
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

  return finalResult;
}
