import { initUploader } from "./ui/uploader.js";
import { initTabs } from "./ui/tabs.js";
import { parseCSV } from "./core/parser.js";
import { calculate30DSales, attachDRR } from "./core/metrics.js";
import { buildFCDemand } from "./core/fcDemand.js";
import { renderFCTable } from "./ui/tables.js";

/* Engines */
import { buildAmazonFcStockPlan } from "./engine/amazonFcStockEngine.js";
import { buildSellerStockMap } from "./engine/uniwareStockEngine.js";
import { applyFcCapacity } from "./engine/fcCapacityEngine.js";
import { buildSellerFcPlan } from "./engine/sellerFcEngine.js";
import { exportAllToExcel } from "./export/exportEngine.js";

let AMAZON_FC_FINAL = {};
let SELLER_FC_FINAL = [];

document.addEventListener("DOMContentLoaded", () => {
  initUploader(handleGenerate);
  initTabs();

  document.getElementById("exportAllBtn").onclick = () => {
    exportAllToExcel(AMAZON_FC_FINAL, SELLER_FC_FINAL);
  };
});

async function handleGenerate(files) {
  document.getElementById("amazonFcTables").innerHTML = "";
  document.getElementById("sellerFcTable").innerHTML = "";

  /* ---------- ALL ORDERS ---------- */
  const allOrdersText = await files.allOrders.text();
  const allOrdersRows = parseCSV(allOrdersText);
  const skuMetrics = attachDRR(calculate30DSales(allOrdersRows));

  /* ---------- FBA ORDERS ---------- */
  const fbaOrdersText = await files.fbaOrders.text();
  const fbaOrdersRows = parseCSV(fbaOrdersText);
  const fcDemand = buildFCDemand(fbaOrdersRows);

  /* ---------- FBA STOCK ---------- */
  const fbaStockText = await files.fbaStock.text();
  const fbaStockRows = parseCSV(fbaStockText);
  const amazonFcPlan =
    buildAmazonFcStockPlan(fbaStockRows, skuMetrics);

  /* ---------- UNIWIRE STOCK ---------- */
  const uniwareText = await files.uniware.text();
  const uniwareRows = parseCSV(uniwareText);

  /* ---------- SKU MAPPING (STATIC FROM GITHUB) ---------- */
  const mappingRes = await fetch("./data/sku_mapping.csv");
  const mappingText = await mappingRes.text();
  const mappingRows = parseCSV(mappingText);

  /* ---------- v1.3 Seller Stock ---------- */
  const sellerStockMap =
    buildSellerStockMap(uniwareRows, mappingRows);

  /* ---------- v1.4 Capacity ---------- */
  AMAZON_FC_FINAL =
    applyFcCapacity(
      amazonFcPlan,
      window.FC_CAPACITY || []
    );

  /* ---------- v1.5 Seller FC ---------- */
  SELLER_FC_FINAL =
    buildSellerFcPlan(
      skuMetrics,
      fcDemand,
      sellerStockMap
    );

  /* ---------- RENDER AMAZON FC ---------- */
  Object.keys(AMAZON_FC_FINAL).forEach(fc => {
    renderFCTable(fc, AMAZON_FC_FINAL[fc]);
  });

  /* ---------- RENDER SELLER FC ---------- */
  renderSellerFcTable(SELLER_FC_FINAL);

  document.getElementById("exportAllBtn").disabled = false;
}

/* -------- SELLER FC TABLE -------- */

function renderSellerFcTable(rows) {
  if (!rows || rows.length === 0) {
    document.getElementById("sellerFcTable").innerHTML =
      "<p>No seller FC recommendations</p>";
    return;
  }

  let html = `<table>
    <tr>
      <th>Amazon Seller SKU</th>
      <th>Uniware SKU</th>
      <th>30D Sale</th>
      <th>DRR</th>
      <th>Seller Stock</th>
      <th>SC</th>
      <th>Decision</th>
      <th>Recommended FC</th>
      <th>Send Qty</th>
      <th>Remarks</th>
    </tr>`;

  rows.forEach(r => {
    html += `
      <tr>
        <td>${r.sku}</td>
        <td>${r.uniwareSku}</td>
        <td>${r.total30D}</td>
        <td>${r.drr}</td>
        <td>${r.sellerStock}</td>
        <td>${r.sc}</td>
        <td>${r.decision}</td>
        <td>${r.recommendedFc}</td>
        <td>${r.sendQty}</td>
        <td>${r.remark}</td>
      </tr>`;
  });

  html += "</table>";
  document.getElementById("sellerFcTable").innerHTML = html;
}
