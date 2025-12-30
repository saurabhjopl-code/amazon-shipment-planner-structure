import { initUploader } from "./ui/uploader.js";
import { initTabs } from "./ui/tabs.js";
import { parseCSV } from "./core/parser.js";
import { calculate30DSales, attachDRR } from "./core/metrics.js";
import { renderFCTable } from "./ui/tables.js";

document.addEventListener("DOMContentLoaded", () => {
  initUploader(handleGenerate);
  initTabs();

  document.getElementById("exportAllBtn").onclick = () =>
    alert("Excel export will be enabled in next phase");
});

function handleGenerate(files) {
  const reader = new FileReader();

  reader.onload = () => {
    const rows = parseCSV(reader.result);
    const sales30D = calculate30DSales(rows);
    const skuMetrics = attachDRR(sales30D);

    // TEMP single FC placeholder
    renderFCTable("ALL_FC", skuMetrics);

    document.getElementById("exportAllBtn").disabled = false;
  };

  reader.readAsText(files.allOrders);
}
