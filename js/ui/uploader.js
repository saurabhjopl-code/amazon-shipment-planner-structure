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

  // 🔒 NEVER disable button again
  generateBtn.disabled = false;
  generateBtn.style.display = "inline-block";

  Object.keys(inputs).forEach(key => {
    inputs[key].addEventListener("change", () => {
      if (inputs[key].files.length > 0) {
        statuses[key].textContent = "Validated";
        statuses[key].classList.add("valid");
      } else {
        statuses[key].textContent = "Not uploaded";
        statuses[key].classList.remove("valid");
      }
    });
  });

  generateBtn.onclick = () => {
    const missing = Object.keys(inputs).filter(
      k => !inputs[k].files || inputs[k].files.length === 0
    );

    if (missing.length > 0) {
      alert(
        "Please upload all required files before generating shipment plan."
      );
      return;
    }

    onGenerate({
      allOrders: inputs.allOrders.files[0],
      fbaOrders: inputs.fbaOrders.files[0],
      fbaStock: inputs.fbaStock.files[0],
      uniware: inputs.uniware.files[0]
    });
  };
}
