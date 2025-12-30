import { parseAmazonDate, isWithinLastNDays } from "./dateUtils.js";

export function calculate30DSales(allOrdersRows) {
  const skuMap = {};

  allOrdersRows.forEach(row => {
    if (row["sales-channel"] !== "Amazon.in") return;

    const qty = Number(row["quantity"] || 0);
    if (qty <= 0) return;

    const dateObj = parseAmazonDate(row["purchase-date"]);
    if (!dateObj) return;

    if (!isWithinLastNDays(dateObj.iso, 30)) return;

    const sku = row["sku"];
    if (!sku) return;

    if (!skuMap[sku]) {
      skuMap[sku] = {
        sku,
        asin: row["asin"],
        total30D: 0
      };
    }

    skuMap[sku].total30D += qty;
  });

  return Object.values(skuMap);
}

export function attachDRR(skuSales) {
  return skuSales.map(item => {
    const drr = item.total30D / 30;

    return {
      ...item,
      drr: Number(drr.toFixed(4))
    };
  });
}
