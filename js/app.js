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
  const readerOrders = new FileReader();
  const readerStock = new FileReader();

  readerOrders.onload = () => {
    const allOrders = parseCSV(readerOrders.result);
    const skuMetrics = attachDRR(calculate30DSales(allOrders));

    // SKU lookup
    const skuMap = {};
    skuMetrics.forEach(r => {
      skuMap[r.sku] = r;
    });

    readerStock.onload = () => {
      const fbaStockRows = parseCSV(readerStock.result);
      const fcStock = buildFCStock(fbaStockRows);

      Object.keys(fcStock).forEach(fc => {
        const fcRows = Object.keys(fcStock[fc]).map(sku => {
          const base = skuMap[sku] || {
            sku,
            total30D: 0,
            drr: 0
          };

          const fcQty = fcStock[fc][sku];
          const sc = base.drr > 0 ? (fcQty / base.drr) : Infinity;

          return {
            sku,
            total30D: base.total30D,
            drr: base.drr,
            fcStock: fcQty,
            sc: Number(sc.toFixed(1)),
            sendQty: sc < 45 && base.drr > 0
              ? Math.max(Math.floor(45 * base.drr - fcQty), 0)
              : 0,
            recallQty: sc > 45 && base.drr > 0
              ? Math.max(Math.floor(fcQty - 45 * base.drr), 0)
              : 0
          };
        });

        renderFCTable(fc, fcRows);
      });

      document.getElementById("exportAllBtn").disabled = false;
    };

    readerStock.readAsText(files.fbaStock);
  };

  readerOrders.readAsText(files.allOrders);
}
