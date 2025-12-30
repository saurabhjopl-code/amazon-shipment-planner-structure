const fcState = {};

export function renderFCTable(fcCode, data) {
  if (!fcState[fcCode]) {
    fcState[fcCode] = { visible: 25 };
  }

  const container = document.getElementById("amazonFcTables");

  const visibleData = data.slice(0, fcState[fcCode].visible);

  let html = `
    <div class="fc-block" id="fc-${fcCode}">
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

  html += `
      </table>

      <div class="fc-actions">
        <button onclick="window.showMore('${fcCode}')">Show More</button>
        <button onclick="window.collapseAll('${fcCode}')">Collapse All</button>
        <button onclick="window.exportFC('${fcCode}')">Export Current FC</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

window.showMore = function (fcCode) {
  fcState[fcCode].visible += 25;
  renderFCTable(fcCode, window.appState?.skuMetrics || []);
};

window.collapseAll = function (fcCode) {
  fcState[fcCode].visible = 25;
  renderFCTable(fcCode, window.appState?.skuMetrics || []);
};

window.exportFC = function (fcCode) {
  alert(`Export for ${fcCode} will be enabled in next phase`);
};
