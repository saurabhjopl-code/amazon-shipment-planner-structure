const fcState = {};
const PAGE_SIZE = 25;

export function renderFCTable(fcCode, data) {
  if (!fcState[fcCode]) {
    fcState[fcCode] = {
      visible: PAGE_SIZE,
      data: data
    };
  } else {
    fcState[fcCode].data = data;
  }

  const container = document.getElementById("amazonFcTables");
  container.innerHTML = ""; // clean render (multi-FC ready)

  Object.keys(fcState).forEach(code => {
    container.appendChild(buildFCBlock(code));
  });
}

function buildFCBlock(fcCode) {
  const state = fcState[fcCode];
  const visibleData = state.data.slice(0, state.visible);

  const block = document.createElement("div");
  block.className = "fc-block";

  let html = `
    <div class="fc-title">FC: ${fcCode}</div>

    <table>
      <tr>
        <th>Amazon Seller SKU</th>
        <th>ASIN</th>
        <th>30D Sale</th>
        <th>DRR</th>
      </tr>
  `;

  visibleData.forEach(r => {
    html += `
      <tr>
        <td>${r.sku}</td>
        <td>${r.asin}</td>
        <td>${r.total30D}</td>
        <td>${r.drr}</td>
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
      const fc = btn.dataset.fc;

      if (action === "show") {
        fcState[fc].visible += PAGE_SIZE;
      }

      if (action === "collapse") {
        fcState[fc].visible = PAGE_SIZE;
      }

      if (action === "export") {
        alert(`Export for ${fc} will be enabled in next phase`);
      }

      renderFCTable(fc, fcState[fc].data);
    });
  });

  return block;
}
