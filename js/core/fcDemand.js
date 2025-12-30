export function buildFCDemand(fbaOrdersRows) {
  const fcDemand = {};

  fbaOrdersRows.forEach(row => {
    if (row["Sales Channel"] !== "amazon.in") return;

    const sku = row["Merchant SKU"];
    const fc = row["FC"];
    const qty = Number(row["Shipped Quantity"] || 0);

    if (!sku || !fc || qty <= 0) return;

    if (!fcDemand[fc]) fcDemand[fc] = {};
    if (!fcDemand[fc][sku]) fcDemand[fc][sku] = 0;

    fcDemand[fc][sku] += qty;
  });

  return fcDemand;
}
