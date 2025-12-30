const EXCLUDED_FCS = ["XHNF", "QWZ8"];

function parseDateToTimestamp(dateStr) {
  if (!dateStr) return 0;

  // Handle YYYY-MM-DD
  if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
    return new Date(dateStr).getTime();
  }

  // Handle DD-MM-YYYY or DD/MM/YYYY
  const parts = dateStr.includes("/")
    ? dateStr.split("/")
    : dateStr.split("-");

  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return new Date(`${yyyy}-${mm}-${dd}`).getTime();
  }

  return 0;
}

export function buildFCStock(rows) {
  const fcStock = {};

  if (!rows || rows.length === 0) return {};

  // Detect headers safely
  const sample = rows[0];
  const dateKey = Object.keys(sample).find(k => k.toLowerCase() === "date");
  const locationKey = Object.keys(sample).find(k =>
    ["location", "warehouse", "fulfillment center"].includes(k.toLowerCase())
  );
  const skuKey = Object.keys(sample).find(k => k.toLowerCase() === "msku");
  const dispKey = Object.keys(sample).find(k => k.toLowerCase() === "disposition");
  const stockKey = Object.keys(sample).find(k =>
    k.toLowerCase().includes("ending")
  );

  if (!dateKey || !locationKey || !skuKey || !dispKey || !stockKey) {
    console.error("FBA Stock headers not detected correctly");
    return {};
  }

  // Find latest date using timestamps
  let latestTs = 0;
  rows.forEach(r => {
    const ts = parseDateToTimestamp(r[dateKey]);
    if (ts > latestTs) latestTs = ts;
  });

  rows.forEach(row => {
    const ts = parseDateToTimestamp(row[dateKey]);
    if (ts !== latestTs) return;

    if (row[dispKey]?.toUpperCase() !== "SELLABLE") return;

    const fc = row[locationKey];
    if (!fc || EXCLUDED_FCS.includes(fc)) return;

    const sku = row[skuKey];
    const stock = Number(row[stockKey] || 0);

    if (!sku || stock <= 0) return;

    if (!fcStock[fc]) fcStock[fc] = {};
    fcStock[fc][sku] = (fcStock[fc][sku] || 0) + stock;
  });

  return fcStock;
}
