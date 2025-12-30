/**
 * Amazon FC Table Renderer (FINAL)
 * --------------------------------
 * Always renders FC container
 * Shows empty-state message if no rows
 */

let FC_RENDER_COUNT = {};

export function renderFCTable(fc, rows) {
  const container = document.getElementById("amazonFcTables");

  if (!FC_RENDER_COUNT[fc]) {
    FC_RENDER_COUNT[fc] = 0;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "fc-block";

  /* ---------- FC HEADER ---------- */
  const header = document.createElement("div");
  header.className = "fc-header";
  header.innerHTML = `
    <h3>${fc}</h3>
    <button class="toggle-btn">Expand</button>
  `;
  wrapper.appendChild(header);

  /* ---------- TABLE CONTAINER ---------- */
  const tableWrap = document.createElement("div");
  tableWrap.className = "fc-table";
  tableWrap.style.display = "none";

  if (!rows || rows.length === 0) {
    tableWrap.innerHTML = `
      <p style="padding:10px;color:#666;">
        No sellable stock found for this FC
      </p>
    `;
  } else {
    tableWrap.innerHTML = buildTableHTML(fc, rows);
  }

  wrapper.appendChild(tableWrap);
  container.appendChild(wrapper);

  /* ---------- TOGGLE ---------- */
  header.querySelector(".toggle-btn").onclick = () => {
    const open = tableWrap.style.display === "block";
    tableWrap.style.display = open ? "none" : "block";
    header.querySelector(".toggle-btn").innerText =
      open ? "Expand" : "Collapse";
  };
}

/* ===============================
   TABLE BUILDER
================================ */

function buildTableHTML(fc, rows) {
  const visibleRows = rows.slice(0, 25);

  let html = `
    <table>
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

  visibleRows.forEach(r => {
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

  html += "</tbody></table>";

  if (rows.length > 25) {
    html += `
      <div style="padding:10px;">
        Showing 25 of ${rows.length} rows
      </div>
    `;
  }

  return html;
}
