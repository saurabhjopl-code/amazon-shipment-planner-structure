import { initUploader } from "./ui/uploader.js";
import { initTabs } from "./ui/tabs.js";
import { parseCSV } from "./core/parser.js";
import { calculate30DSales, attachDRR } from "./core/metrics.js";
import { buildFCStock } from "./core/fbaStock.js";
import { renderFCTable } from "./ui/tables.js";

document.addEventListener("DOMContentLoaded", () => {
  initUploader(handleGenerate);
  initTabs();
});

function handleGenerate(files) {
  const container = document.getElementById("amazonFcTables");
  container.innerHTML = ""; // clear previous results

  const readerOrders = new FileReader();
  const readerStock = new FileReader();

  readerOrders.onload = () => {
    const allOrders = parseCSV(readerOrders.result);
    const skuMetrics = attachDRR(calculate30DSales(allOrders));

    const skuMap = {};
    skuMetrics.forEach(r => (skuMap[r.sku] = r));

    readerStock.onload = () => {
      const rows = parseCSV(readerStock.result);
      const result = buildFCStock(rows);

      // Support both debug & normal mode
      const fcStock = result.fcStock || result;
      const debug = result.debug;

      if (debug) {
        const debugBox = document.createElement("pre");
        debugBox.style.background = "#fef3c7";
        debugBox.style.padding = "12px";
        debugBox.textContent =
          "FBA STOCK DEBUG\n" + JSON.stringify(debug, null, 2);
        container.appendChild(debugBox);
      }

      const fcs = Object.keys(fcStock);
      if (fcs.length === 0) {
        alert("No valid Amazon FC stock found (after exclusions)");
        return;
      }

      fcs.forEach(fc => {
        const rows = Object.keys(fcStock[fc]).map(sku => {
          const base = skuMap[sku] || { total30D: 0, drr: 0 };
          const fcQty = fcStock[fc][sku];
          const sc = base.drr > 0 ? fcQty / base.drr : Infinity;

          return {
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
          };
        });

        renderFCTable(fc, rows);
      });
    };

    readerStock.readAsText(files.fbaStock);
  };

  readerOrders.readAsText(files.allOrders);
}
