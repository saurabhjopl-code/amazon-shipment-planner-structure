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

/* ===============================
   MAIN GENERATE HANDLER
================================ */

async function handleGenerate(files) {
  document.getElementById("amazonFcTables").innerHTML = "";
  document.getElementById("sellerFcTable").innerHTML = "";

  try {
    /* ---------- AMAZON ALL ORDERS ---------- */
    const allOrdersRows = parseCSV(await files.allOrders.text());
    const skuMetrics = attachDRR(
      calculate30DSales(allOrdersRows)
    );

    /* ---------- FBA ORDERS ---------- */
    const fbaOrdersRows = parseCSV(await files.fbaOrders.text());
    const fcDemand = buildFCDemand(fbaOrdersRows);

    /* ---------- FBA STOCK ---------- */
    const fbaStockRows = parseCSV(await files.fbaStock.text());
    const amazonFcPlan =
      buildAmazonFcStockPlan(fbaStockRows, skuMetrics);

    /* ---------- AMAZON FC CAPACITY ---------- */
    AMAZON_FC_FINAL =
      applyFcCapacity(
        amazonFcPlan,
        window.FC_CAPACITY || []
      );

    /* ---------- RENDER AMAZON FC ---------- */
    Object.keys(AMAZON_FC_FINAL).forEach(fc => {
      renderFCTable(fc, AMAZON_FC_FINAL[fc]);
    });

    /* ---------- TRY SELLER FC LOGIC ---------- */
    let sellerStockMap = null;
    let sellerFcPlan = [];

    try {
      const uniwareRows = parseCSV(await files.uniwareStock.text());

      const mappingResponse = await fetch("./data/sku_mapping.csv");
      if (!mappingResponse.ok) {
        throw new Error("sku_mapping.csv not found");
      }

      const mappingRows = parseCSV(await mappingResponse.text());

      sellerStockMap =
        buildSellerStockMap(uniwareRows, mappingRows);

      sellerFcPlan =
        buildSellerFcPlan(
          skuMetrics,
          fcDemand,
          sellerStockMap
        );

      SELLER_FC_FINAL = sellerFcPlan;
      renderSellerFcTable(SELLER_FC_FINAL);

    } catch (sellerErr) {
      console.warn("Seller FC skipped:", sellerErr.message);
      document.getElementById("sellerFcTable").innerHTML =
        "<p><b>Seller FC not generated:</b> SKU mapping file missing.</p>";
    }

    document.getElementById("exportAllBtn").disabled = false;

  } catch (err) {
    console.error("Generate failed:", err);
    alert("Error generating shipment plan: " + err.message);
  }
}

/* ===============================
   SELLER FC TABLE
================================ */

function renderSellerFcTable(rows) {
  if (!rows || rows.length === 0) {
    document.getElementById("sellerFcTable").innerHTML =
      "<p>No seller FC recommendations</p>";
    return;
  }

  let html = `
    <table>
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
      </tr>
  `;

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
