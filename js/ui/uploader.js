export function initUploader() {
  const files = {
    allOrders: document.getElementById("allOrdersFile"),
    fbaOrders: document.getElementById("fbaOrdersFile"),
    fbaStock: document.getElementById("fbaStockFile"),
    uniware: document.getElementById("uniwareStockFile"),
  };

  const statuses = {
    allOrders: document.getElementById("statusAllOrders"),
    fbaOrders: document.getElementById("statusFbaOrders"),
    fbaStock: document.getElementById("statusFbaStock"),
    uniware: document.getElementById("statusUniware"),
  };

  const generateBtn = document.getElementById("generateBtn");

  Object.keys(files).forEach(key => {
    files[key].addEventListener("change", () => {
      if (files[key].files.length > 0) {
        statuses[key].textContent = "Validated";
        statuses[key].classList.add("valid");
      }
      checkReady();
    });
  });

  function checkReady() {
    const allUploaded = Object.values(files).every(
      input => input.files.length > 0
    );
    generateBtn.disabled = !allUploaded;
  }
}
