const PAGE_SIZE = 25;
const fcState = {};

export function renderFCTable(fcCode, data) {
  if (!fcState[fcCode]) {
    fcState[fcCode] = {
      visible: PAGE_SIZE,
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
  const rows = state.data.slice(0, state.visible);

  const block = document.createElement("div");
  block.className = "fc-block";

  let html = `
    <div class="fc-title">Amazon FC: ${fcCode}</div>

    <table>
      <tr>
        <th>Amazon Seller SKU</th>
        <th>30D Sale</th>
        <th>DRR</th>
        <th>FC 30D Sale</th>
      </tr>
  `;

  rows.forEach(r => {
    html += `
      <tr>
        <td>${r.sku}</td>
        <td>${r.total30D}</td>
        <td>${r.drr}</td>
        <td>${r.fc30D || 0}</td>
      </tr>
    `;
  });

  html += `</table>`;

  html += `
    <div class="fc-actions">
      <button data-action="show" data-fc="${fcCode}">Show More</button>
      <button data-action="collapse" data-fc="${fcCode}">Collapse All</button>
      <button data-action="export" data-fc="${fcCode}">Export Current FC</button>
    </div>
  `;

  block.innerHTML = html;

  block.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;

      if (action === "show") state.visible += PAGE_SIZE;
      if (action === "collapse") state.visible = PAGE_SIZE;
      if (action === "export")
        alert(`Export for ${fcCode} coming next phase`);

      renderFCTable(fcCode, state.data);
    });
  });

  return block;
}
