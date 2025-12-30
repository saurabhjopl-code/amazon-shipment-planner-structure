import { initUploader } from "./ui/uploader.js";
import { initTabs } from "./ui/tabs.js";
import { parseCSV } from "./core/parser.js";
import { calculate30DSales, attachDRR } from "./core/metrics.js";
import { buildFCDemand } from "./core/fcDemand.js";
import { renderFCTable } from "./ui/tables.js";

/* v1.2 – v1.6 engines */
import { buildAmazonFcStockPlan } from "./engine/amazonFcStockEngine.js";
import { buildSellerStockMap } from "./engine/uniwareStockEngine.js";
import { applyFcCapacity } from "./engine/fcCapacityEngine.js";
import { buildSellerFcPlan } from "./engine/sellerFcEngine.js";
import {
  exportCsv,
  exportAllToExcel
} from "./export/exportEngine.js";

let AMAZON_FC_FINAL = {};
let SELLER_FC_FINAL = [];

document.addEventListener("DOMContentLoaded", () => {
  initUploader(handleGenerate);
  initTabs();

  document.getElementById("exportAllBtn").onclick = () => {
    exportAllToExcel(AMAZON_FC_FINAL, SELLER_FC_FINAL);
  };
});

function handleGenerate(files) {
  document.getElementById("amazonFcTables").innerHTML = "";
  document.getElementById("sellerFcTable").innerHTML = "";

  /* ---------- READ ALL ORDERS ---------- */
  const readerAllOrders = new FileReader();
  const readerFbaOrders = new FileReader();
  const readerFbaStock = new FileReader();
  const readerUniware = new FileReader();
  const readerMapping = new FileReader();

  readerAllOrders.onload = () => {
    const allOrdersRows = parseCSV(readerAllOrders.result);
    const skuMetrics = attachDRR(
      calculate30DSales(allOrdersRows)
    );

    /* ---------- READ FBA ORDERS ---------- */
    readerFbaOrders.onload = () => {
      const fbaOrdersRows = parseCSV(readerFbaOrders.result);
      const fcDemand = buildFCDemand(fbaOrdersRows);

      /* ---------- READ FBA STOCK ---------- */
      readerFbaStock.onload = () => {
        const fbaStockRows = parseCSV(readerFbaStock.result);

        // v1.2 – Amazon FC Stock Plan
        const amazonFcPlan =
          buildAmazonFcStockPlan(fbaStockRows, skuMetrics);

        /* ---------- READ UNIWIRE ---------- */
        readerUniware.onload = () => {
          const uniwareRows = parseCSV(readerUniware.result);

          /* ---------- READ SKU MAPPING ---------- */
          readerMapping.onload = () => {
            const mappingRows = parseCSV(readerMapping.result);

            // v1.3 – Seller stock
            const sellerStockMap =
              buildSellerStockMap(uniwareRows, mappingRows);

            // v1.4 – FC capacity
            AMAZON_FC_FINAL =
              applyFcCapacity(amazonFcPlan, window.FC_CAPACITY || []);

            // v1.5 – Seller FC plan
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
          };

          readerMapping.readAsText(files.mapping);
        };

        readerUniware.readAsText(files.uniware);
      };

      readerFbaStock.readAsText(files.fbaStock);
    };

    readerFbaOrders.readAsText(files.fbaOrders);
  };

  readerAllOrders.readAsText(files.allOrders);
}

/* ---------------- SELLER FC TABLE ---------------- */

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
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("sellerFcTable").innerHTML = html;
}
