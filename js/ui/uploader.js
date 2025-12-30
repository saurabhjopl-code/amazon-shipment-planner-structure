export function initUploader(onGenerate) {
  const inputs = {
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

  const btn = document.getElementById("generateBtn");

  Object.keys(inputs).forEach(k => {
    inputs[k].addEventListener("change", () => {
      if (inputs[k].files.length > 0) {
        statuses[k].textContent = "Validated";
        statuses[k].classList.add("valid");
      }
      check();
    });
  });

  btn.addEventListener("click", () => {
    onGenerate({
      allOrders: inputs.allOrders.files[0],
      fbaOrders: inputs.fbaOrders.files[0],
      fbaStock: inputs.fbaStock.files[0],
      uniware: inputs.uniware.files[0]
    });
  });

  function check() {
    btn.disabled = !Object.values(inputs).every(i => i.files.length);
  }
}
