let visibleCount = 25;

export function resetPagination(data) {
  visibleCount = 25;
  renderTable(data);
}

export function showMore(data) {
  visibleCount += 25;
  renderTable(data);
}

export function renderTable(data) {
  const container = document.getElementById("amazonFcTable");

  if (!data || data.length === 0) {
    container.innerHTML = "No data available";
    return;
  }

  let html = `
    <table>
      <tr>
        <th>Amazon Seller SKU</th>
        <th>ASIN</th>
        <th>30D Sale</th>
        <th>DRR</th>
      </tr>
  `;

  data.slice(0, visibleCount).forEach(r => {
    html += `
      <tr>
        <td>${r.sku}</td>
        <td>${r.asin}</td>
        <td>${r.total30D}</td>
        <td>${r.drr}</td>
      </tr>
    `;
  });

  html += "</table>";
  container.innerHTML = html;
}
