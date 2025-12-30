import { initUploader } from "./ui/uploader.js";
import { initTabs } from "./ui/tabs.js";
import { parseCSV } from "./core/parser.js";
import { calculate30DSales, attachDRR } from "./core/metrics.js";
import { buildFCDemand } from "./core/fcDemand.js";
import { renderFCTable } from "./ui/tables.js";

document.addEventListener("DOMContentLoaded", () => {
  initUploader(handleGenerate);
  initTabs();

  document.getElementById("exportAllBtn").onclick = () =>
    alert("Excel export will be enabled in next phase");
});

function handleGenerate(files) {
  const readerAll = new FileReader();
  const readerFba = new FileReader();

  readerAll.onload = () => {
    const allOrders = parseCSV(readerAll.result);
    const baseSales = attachDRR(calculate30DSales(allOrders));

    // Build quick lookup by SKU
    const skuMap = {};
    baseSales.forEach(r => {
      skuMap[r.sku] = r;
    });

    readerFba.onload = () => {
      const fbaOrders = parseCSV(readerFba.result);
      const fcDemand = buildFCDemand(fbaOrders);

      Object.keys(fcDemand).forEach(fc => {
        // 🔒 ONLY SKUs sold in this FC
        const fcRows = Object.keys(fcDemand[fc]).map(sku => {
          const base = skuMap[sku];
          if (!base) return null;

          return {
            ...base,
            fc30D: fcDemand[fc][sku]
          };
        }).filter(Boolean);

        // Render FC table with FC-specific rows only
        renderFCTable(fc, fcRows);
      });

      document.getElementById("exportAllBtn").disabled = false;
    };

    readerFba.readAsText(files.fbaOrders);
  };

  readerAll.readAsText(files.allOrders);
}
