export function initUploader(onGenerate) {
  const inputs = {
    allOrders: document.getElementById("allOrdersFile"),
    fbaOrders: document.getElementById("fbaOrdersFile"),
    fbaStock: document.getElementById("fbaStockFile"),
    uniware: document.getElementById("uniwareStockFile")
  };

  const statuses = {
    allOrders: document.getElementById("statusAllOrders"),
    fbaOrders: document.getElementById("statusFbaOrders"),
    fbaStock: document.getElementById("statusFbaStock"),
    uniware: document.getElementById("statusUniware")
  };

  const generateBtn = document.getElementById("generateBtn");

  // Reset state
  generateBtn.disabled = true;

  Object.keys(inputs).forEach(key => {
    inputs[key].addEventListener("change", () => {
      if (inputs[key].files.length > 0) {
        statuses[key].textContent = "Validated";
        statuses[key].classList.add("valid");
      } else {
        statuses[key].textContent = "Not uploaded";
        statuses[key].classList.remove("valid");
      }

      checkReady();
    });
  });

  function checkReady() {
    const ready = Object.values(inputs).every(
      input => input.files && input.files.length > 0
    );
    generateBtn.disabled = !ready;
  }

  generateBtn.onclick = () => {
    if (generateBtn.disabled) return;

    onGenerate({
      allOrders: inputs.allOrders.files[0],
      fbaOrders: inputs.fbaOrders.files[0],
      fbaStock: inputs.fbaStock.files[0],
      uniware: inputs.uniware.files[0]
    });
  };
}
