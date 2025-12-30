/**
 * Amazon FC Table Renderer (FIXED – STATE SAFE)
 * ---------------------------------------------
 * - No internal render memory
 * - Always renders when called
 * - Safe for regenerate / re-upload
 */

export function renderFCTable(fc, rows) {
  const container = document.getElementById("amazonFcTables");
  if (!container) return;

  const block = document.createElement("div");
  block.className = "fc-report";

  /* ---------- HEADER ---------- */
  const header = document.createElement("div");
  header.className = "fc-report-header";
  header.innerHTML = `
    <span class="fc-name">${fc}</span>
    <button class="fc-toggle-btn">Expand</button>
  `;
  block.appendChild(header);

  /* ---------- CONTENT ---------- */
  const content = document.createElement("div");
  content.className = "fc-report-content";
  content.style.display = "none";

  if (!rows || rows.length === 0) {
    content.innerHTML = `
      <div class="fc-empty">
        No sellable stock found for this FC
      </div>
    `;
  } else {
    content.innerHTML = buildTable(rows);
  }

  block.appendChild(content);
  container.appendChild(block);

  /* ---------- TOGGLE ---------- */
  const btn = header.querySelector(".fc-toggle-btn");
  btn.onclick = () => {
    const open = content.style.display === "block";
    content.style.display = open ? "none" : "block";
    btn.innerText = open ? "Expand" : "Collapse";
  };
}

/* ===============================
   TABLE BUILDER
================================ */

function buildTable(rows) {
  let html = `
    <table class="fc-table">
      <thead>
        <tr>
          <th>Amazon Seller SKU</th>
          <th>30D Sale</th>
          <th>DRR</th>
          <th>FC Stock</th>
          <th>SC</th>
          <th>Send Qty</th>
          <th>Recall Qty</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.slice(0, 25).forEach(r => {
    html += `
      <tr>
        <td>${r.sku}</td>
        <td>${r.total30D ?? 0}</td>
        <td>${r.drr ?? 0}</td>
        <td>${r.fcStock ?? 0}</td>
        <td>${r.sc}</td>
        <td>${r.sendQty ?? 0}</td>
        <td>${r.recallQty ?? 0}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  if (rows.length > 25) {
    html += `
      <div class="fc-note">
        Showing 25 of ${rows.length} rows
      </div>
    `;
  }

  return html;
}
