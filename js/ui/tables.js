const PAGE_SIZE = 25;
const fcState = {};

export function renderFCTable(fcCode, data) {
  if (!fcState[fcCode]) {
    fcState[fcCode] = {
      visible: PAGE_SIZE,
      expanded: false, // 🔒 default collapsed
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

  // FC header
  let html = `
    <div class="fc-title" data-fc="${fcCode}">
      ▶ Amazon FC: ${fcCode} 
      <span style="font-weight:normal; font-size:13px;">
        (${state.data.length} SKUs)
      </span>
    </div>
  `;

  // Expanded content
  if (state.expanded) {
    const rows = state.data.slice(0, state.visible);

    html += `
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

    html += `
      </table>

      <div class="fc-actions">
        <button data-action="show" data-fc="${fcCode}">Show More</button>
        <button data-action="collapse" data-fc="${fcCode}">Collapse</button>
        <button data-action="export" data-fc="${fcCode}">Export Current FC</button>
      </div>
    `;
  }

  block.innerHTML = html;

  // Header click → expand / collapse
  block.querySelector(".fc-title").addEventListener("click", () => {
    state.expanded = !state.expanded;
    state.visible = PAGE_SIZE; // reset pagination on toggle
    renderFCTable(fcCode, state.data);
  });

  // Button actions (only if expanded)
  block.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation(); // prevent header toggle

      const action = btn.dataset.action;

      if (action === "show") state.visible += PAGE_SIZE;
      if (action === "collapse") state.expanded = false;
      if (action === "export")
        alert(`Export for ${fcCode} will be enabled in next phase`);

      renderFCTable(fcCode, state.data);
    });
  });

  return block;
}
