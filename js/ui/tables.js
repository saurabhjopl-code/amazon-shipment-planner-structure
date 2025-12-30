const PAGE_SIZE = 25;
const fcState = {};

export function renderFCTable(fcCode, data) {
  if (!fcState[fcCode]) {
    fcState[fcCode] = {
      visible: PAGE_SIZE,
      expanded: false,
      data
    };
  } else {
    fcState[fcCode].data = data;
  }

  const container = document.getElementById("amazonFcTables");
  container.innerHTML = "";

  Object.keys(fcState).forEach(code => {
    container.appendChild(buildFCBlock(code));
  });
}

function buildFCBlock(fcCode) {
  const state = fcState[fcCode];
  const block = document.createElement("div");
  block.className = "fc-block";

  let html = `
    <div class="fc-title">
      ▶ Amazon FC: ${fcCode}
      <span style="font-size:13px;font-weight:normal;">
        (${state.data.length} SKUs with stock)
      </span>
    </div>
  `;

  if (state.expanded) {
    const rows = state.data.slice(0, state.visible);

    html += `
      <table>
        <tr>
          <th>Amazon Seller SKU</th>
          <th>30D Sale</th>
          <th>DRR</th>
          <th>FC Stock</th>
          <th>SC</th>
          <th>Send Qty</th>
          <th>Recall Qty</th>
        </tr>
    `;

    rows.forEach(r => {
      html += `
        <tr>
          <td>${r.sku}</td>
          <td>${r.total30D}</td>
          <td>${r.drr}</td>
          <td>${r.fcStock}</td>
          <td>${r.sc === Infinity ? "∞" : r.sc}</td>
          <td>${r.sendQty}</td>
          <td>${r.recallQty}</td>
        </tr>
      `;
    });

    html += `
      </table>

      <div class="fc-actions">
        <button data-action="show">Show More</button>
        <button data-action="collapse">Collapse</button>
        <button data-action="export">Export Current FC</button>
      </div>
    `;
  }

  block.innerHTML = html;

  block.querySelector(".fc-title").onclick = () => {
    state.expanded = !state.expanded;
    state.visible = PAGE_SIZE;
    renderFCTable(fcCode, state.data);
  };

  block.querySelectorAll("button").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const action = btn.dataset.action;

      if (action === "show") state.visible += PAGE_SIZE;
      if (action === "collapse") state.expanded = false;
      if (action === "export")
        alert(`Export for ${fcCode} coming next phase`);

      renderFCTable(fcCode, state.data);
    };
  });

  return block;
}
