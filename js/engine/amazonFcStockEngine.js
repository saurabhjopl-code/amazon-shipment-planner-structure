/**
 * Amazon FC Stock Engine (v1.2)
 * --------------------------------
 * INPUT:
 *  - fbaStockRows (parsed CSV rows)
 *  - skuMetrics (from v1.1: sku, total30D, drr)
 *
 * OUTPUT:
 *  {
 *    [fcCode]: [
 *      {
 *        sku,
 *        total30D,
 *        drr,
 *        fcStock,
 *        sc,
 *        sendQty,
 *        recallQty
 *      }
 *    ]
 *  }
 */

const EXCLUDED_FCS = ["XHNF", "QWZ8"];
const TARGET_SC_DAYS = 45;

export function buildAmazonFcStockPlan(fbaStockRows, skuMetrics) {
  const fcStockMap = {};
  const skuMap = {};

  // Build SKU lookup from v1.1 metrics
  skuMetrics.forEach(r => {
    skuMap[r.sku] = {
      total30D: r.total30D,
      drr: r.drr
    };
  });

  // Defensive header handling
  const normalize = s => s.trim().toLowerCase();
  const headerMap = {};
  Object.keys(fbaStockRows[0] || {}).forEach(k => {
    headerMap[normalize(k)] = k;
  });

  const skuKey = headerMap["msku"] || headerMap["merchant sku"];
  const fcKey =
    headerMap["location"] ||
    headerMap["location id"] ||
    headerMap["warehouse"];
  const stockKey = Object.keys(headerMap).find(k =>
    k.includes("ending")
  );

  if (!skuKey || !fcKey || !stockKey) {
    throw new Error("FBA Stock headers not detected correctly");
  }

  // Aggregate FC stock
  fbaStockRows.forEach(row => {
    const fc = String(row[fcKey] || "").trim();
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    const sku = String(row[skuKey] || "").trim();
    if (!sku) return;

    const stock = Number(row[headerMap[stockKey]] || 0);
    if (stock <= 0) return;

    if (!fcStockMap[fc]) fcStockMap[fc] = {};
    fcStockMap[fc][sku] = (fcStockMap[fc][sku] || 0) + stock;
  });

  // Build final FC-wise plan
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
