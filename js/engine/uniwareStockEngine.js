/**
 * Uniware / Seller Stock Engine (v1.3)
 * -----------------------------------
 * INPUT:
 *  - uniwareRows (parsed CSV)
 *  - mappingRows (parsed CSV)
 *
 * OUTPUT:
 *  {
 *    amazonSku: {
 *      uniwareSku,
 *      sellerStock,
 *      allowSend (boolean),
 *      remark
 *    }
 *  }
 */

const MIN_SELLER_STOCK = 10;

export function buildSellerStockMap(uniwareRows, mappingRows) {
  const sellerStockMap = {};
  const mapping = {};

  // Normalize helper
  const normalize = v => String(v || "").trim();

  /**
   * STEP 1: Build Amazon → Uniware SKU mapping
   */
  mappingRows.forEach(row => {
    const amazonSku =
      normalize(row["Amazon Seller SKU"]) ||
      normalize(row["amazon seller sku"]) ||
      normalize(row["Seller SKU"]);

    const uniwareSku =
      normalize(row["Uniware SKU"]) ||
      normalize(row["Sku Code"]) ||
      normalize(row["uniware sku"]);

    if (amazonSku && uniwareSku) {
      mapping[amazonSku] = uniwareSku;
    }
  });

  /**
   * STEP 2: Aggregate Uniware stock by Uniware SKU
   */
  const uniwareStockAgg = {};

  uniwareRows.forEach(row => {
    const uniwareSku =
      normalize(row["Sku Code"]) ||
      normalize(row["Uniware SKU"]);

    if (!uniwareSku) return;

    const stock =
      Number(row["Total Inventory"]) ||
      Number(row["Total (Stock on hand)"]) ||
      0;

    if (!uniwareStockAgg[uniwareSku]) {
      uniwareStockAgg[uniwareSku] = 0;
    }

    uniwareStockAgg[uniwareSku] += stock;
  });

  /**
   * STEP 3: Build seller stock map per Amazon SKU
   */
  Object.keys(mapping).forEach(amazonSku => {
    const uniwareSku = mapping[amazonSku];
    const sellerStock = uniwareStockAgg[uniwareSku] || 0;

    sellerStockMap[amazonSku] = {
      uniwareSku,
      sellerStock,
      allowSend: sellerStock >= MIN_SELLER_STOCK,
      remark:
        sellerStock < MIN_SELLER_STOCK
          ? "Seller stock below threshold (<10)"
          : ""
    };
  });

  return sellerStockMap;
}
