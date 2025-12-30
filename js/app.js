import { initUploader } from "./ui/uploader.js";
import { initTabs } from "./ui/tabs.js";
import { parseCSV } from "./core/parser.js";
import { calculate30DSales, attachDRR } from "./core/metrics.js";
import { buildFCStock } from "./core/fbaStock.js";
import { renderFCTable } from "./ui/tables.js";

document.addEventListener("DOMContentLoaded", () => {
  initUploader(handleGenerate);
  initTabs();

  document.getElementById("exportAllBtn").onclick = () =>
    alert("Excel export will be enabled in next phase");
});

function handleGenerate(files) {
  // CLEAR previous results
  document.getElementById("amazonFcTables").innerHTML = "";

  const readerOrders = new FileReader();
  const readerStock = new FileReader();

  readerOrders.onload = () => {
    const allOrders = parseCSV(readerOrders.result);
    const skuMetrics = attachDRR(calculate30DSales(allOrders));

    // Build SKU lookup
    const skuMap = {};
    skuMetrics.forEach(r => {
      skuMap[r.sku] = r;
    });

    readerStock.onload = () => {
      const fbaStockRows = parseCSV(readerStock.result);

      if (!fbaStockRows || fbaStockRows.length === 0) {
        alert("FBA Stock file is empty or invalid");
        return;
      }

      const fcStock = buildFCStock(fbaStockRows);

      const fcCodes = Object.keys(fcStock);

      if (fcCodes.length === 0) {
        alert("No valid Amazon FC stock found (after exclusions)");
        return;
      }

      fcCodes.forEach(fc => {
        const rows = [];

        Object.keys(fcStock[fc]).forEach(sku => {
          const base = skuMap[sku] || { total30D: 0, drr: 0 };
          const fcQty = fcStock[fc][sku];

          const sc =
            base.drr > 0 ? fcQty / base.drr : Infinity;

          rows.push({
            sku,
            total30D: base.total30D,
            drr: base.drr,
            fcStock: fcQty,
            sc: sc === Infinity ? "∞" : Number(sc.toFixed(1)),
            sendQty:
              base.drr > 0 && sc < 45
                ? Math.max(Math.floor(45 * base.drr - fcQty), 0)
                : 0,
            recallQty:
              base.drr > 0 && sc > 45
                ? Math.max(Math.floor(fcQty - 45 * base.drr), 0)
                : 0
          });
        });

        if (rows.length > 0) {
          renderFCTable(fc, rows);
        }
      });

      document.getElementById("exportAllBtn").disabled = false;
    };

    readerStock.readAsText(files.fbaStock);
  };

  readerOrders.readAsText(files.allOrders);
}
