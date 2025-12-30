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
  document.getElementById("amazonFcTables").innerHTML = "";

  const readerOrders = new FileReader();
  const readerStock = new FileReader();

  readerOrders.onload = () => {
    const allOrders = parseCSV(readerOrders.result);
    const skuMetrics = attachDRR(calculate30DSales(allOrders));

    const skuMap = {};
    skuMetrics.forEach(r => (skuMap[r.sku] = r));

    readerStock.onload = () => {
      const rows = parseCSV(readerStock.result);
      const { fcStock, debug } = buildFCStock(rows);

      // 🔥 SHOW DEBUG INFO ON SCREEN
      const debugDiv = document.createElement("pre");
      debugDiv.style.background = "#fef3c7";
      debugDiv.style.padding = "12px";
      debugDiv.style.margin = "12px";
      debugDiv.textContent =
        "FBA STOCK DEBUG INFO\n" +
        JSON.stringify(debug, null, 2);

      document.getElementById("amazonFcTables").appendChild(debugDiv);

      const fcs = Object.keys(fcStock);
      if (fcs.length === 0) return;

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
            sc: sc === Infinity ? "∞" : sc.toFixed(1),
            sendQty: sc < 45 ? Math.max(Math.floor(45 * base.drr - fcQty), 0) : 0,
            recallQty: sc > 45 ? Math.max(Math.floor(fcQty - 45 * base.drr), 0) : 0
          };
        });

        renderFCTable(fc, rows);
      });
    };

    readerStock.readAsText(files.fbaStock);
  };

  readerOrders.readAsText(files.allOrders);
}
