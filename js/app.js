import { initUploader } from "./ui/uploader.js";
import { initTabs } from "./ui/tabs.js";
import { parseCSV } from "./core/parser.js";
import { calculate30DSales, attachDRR } from "./core/metrics.js";
import { renderTable, resetPagination, showMore } from "./ui/tables.js";

let appState = {
  skuMetrics: []
};

document.addEventListener("DOMContentLoaded", () => {
  initUploader(handleGenerate);
  initTabs();

  document.getElementById("showMoreBtn").onclick = () =>
    showMore(appState.skuMetrics);

  document.getElementById("collapseBtn").onclick = () =>
    resetPagination(appState.skuMetrics);

  document.getElementById("exportAllBtn").onclick = () =>
    alert("Excel export will be enabled in next phase");

  document.getElementById("exportCurrentBtn").onclick = () =>
    alert("FC export will be enabled in next phase");
});

function handleGenerate(files) {
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCSV(reader.result);
    const sales30D = calculate30DSales(rows);
    appState.skuMetrics = attachDRR(sales30D);

    resetPagination(appState.skuMetrics);
    document.getElementById("exportAllBtn").disabled = false;
  };
  reader.readAsText(files.allOrders);
}
