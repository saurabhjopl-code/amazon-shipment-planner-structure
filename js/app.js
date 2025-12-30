import { initUploader } from "./ui/uploader.js";
import { initTabs } from "./ui/tabs.js";
import { parseCSV } from "./core/parser.js";
import { calculate30DSales, attachDRR } from "./core/metrics.js";

let appState = {
  allOrders: [],
  skuMetrics: []
};

document.addEventListener("DOMContentLoaded", () => {
  initUploader(handleGenerate);
  initTabs();
});

function handleGenerate(files) {
  const reader = new FileReader();

  reader.onload = () => {
    const rows = parseCSV(reader.result);
    appState.allOrders = rows;

    const sales30D = calculate30DSales(rows);
    appState.skuMetrics = attachDRR(sales30D);

    renderPreview();
  };

  reader.readAsText(files.allOrders);
}

function renderPreview() {
  const container = document.getElementById("amazonFcTable");
  if (!appState.skuMetrics.length) {
    container.innerHTML = "No sales data found";
    return;
  }

  let html = `
    <table border="1" cellpadding="6" cellspacing="0">
      <tr>
        <th>Amazon Seller SKU</th>
        <th>ASIN</th>
        <th>30D Sale</th>
        <th>DRR</th>
      </tr>
  `;

  appState.skuMetrics.slice(0, 25).forEach(r => {
    html += `
      <tr>
        <td>${r.sku}</td>
        <td>${r.asin}</td>
        <td>${r.total30D}</td>
        <td>${r.drr}</td>
      </tr>
    `;
  });

  html += "</table>";
  container.innerHTML = html;
}
