/**
 * Seller FC Recommendation Engine (v1.5)
 * --------------------------------------
 * INPUT:
 *  - skuMetrics        → from v1.1 (sku, total30D, drr)
 *  - fcDemand          → from v1.1 (FC → SKU → 30D sale)
 *  - sellerStockMap    → from v1.3
 *
 * OUTPUT:
 *  [
 *    {
 *      sku,
 *      uniwareSku,
 *      total30D,
 *      drr,
 *      sellerStock,
 *      sc,
 *      decision,
 *      recommendedFc,
 *      sendQty,
 *      remark
 *    }
 *  ]
 */

const TARGET_SC_DAYS = 45;

export function buildSellerFcPlan(
  skuMetrics,
  fcDemand,
  sellerStockMap
) {
  const skuMetricMap = {};
  skuMetrics.forEach(r => {
    skuMetricMap[r.sku] = r;
  });

  const result = [];

  Object.keys(sellerStockMap).forEach(sku => {
    const stockInfo = sellerStockMap[sku];
    const metric = skuMetricMap[sku] || {
      total30D: 0,
      drr: 0
    };

    const sellerStock = stockInfo.sellerStock;
    const drr = metric.drr || 0;

    // Identify FCs with demand
    const fcSales = [];
    Object.keys(fcDemand).forEach(fc => {
      const qty = fcDemand[fc][sku] || 0;
      if (qty > 0) {
        fcSales.push({ fc, qty });
      }
    });

    if (fcSales.length === 0) {
      result.push({
        sku,
        uniwareSku: stockInfo.uniwareSku,
        total30D: metric.total30D,
        drr,
        sellerStock,
        sc: "∞",
        decision: "NO SEND",
        recommendedFc: "",
        sendQty: 0,
        remark: "No FC demand"
      });
      return;
    }

    // Pick FC with highest demand
    fcSales.sort((a, b) => b.qty - a.qty);
    const recommendedFc = fcSales[0].fc;

    // Seller SC
    const sc =
      drr > 0 ? sellerStock / drr : Infinity;

    // Seller stock threshold
    if (!stockInfo.allowSend) {
      result.push({
        sku,
        uniwareSku: stockInfo.uniwareSku,
        total30D: metric.total30D,
        drr,
        sellerStock,
        sc: sc === Infinity ? "∞" : sc.toFixed(1),
        decision: "NO SEND",
        recommendedFc,
        sendQty: 0,
        remark: stockInfo.remark
      });
      return;
    }

    // Decision rule
    if (sc < TARGET_SC_DAYS) {
      const sendQty = Math.max(
        Math.floor(TARGET_SC_DAYS * drr - sellerStock),
        0
      );

      result.push({
        sku,
        uniwareSku: stockInfo.uniwareSku,
        total30D: metric.total30D,
        drr,
        sellerStock,
        sc: sc.toFixed(1),
        decision: "SEND",
        recommendedFc,
        sendQty,
        remark: ""
      });
    } else {
      result.push({
        sku,
        uniwareSku: stockInfo.uniwareSku,
        total30D: metric.total30D,
        drr,
        sellerStock,
        sc: sc.toFixed(1),
        decision: "NO SEND",
        recommendedFc,
        sendQty: 0,
        remark: "Sufficient stock cover"
      });
    }
  });

  return result;
}
