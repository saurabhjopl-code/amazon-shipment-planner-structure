/**
 * Amazon FC Capacity Engine (v1.4)
 * --------------------------------
 * INPUT:
 *  - fcPlans: output of v1.2 (Amazon FC Stock Engine)
 *    {
 *      FC_CODE: [
 *        { sku, sendQty, ... }
 *      ]
 *    }
 *  - capacityRows: parsed XLSX/CSV rows
 *
 * OUTPUT:
 *  - Same structure as fcPlans, but:
 *      - sendQty capped by FC capacity
 *      - capacityRemark added if capped
 */

export function applyFcCapacity(fcPlans, capacityRows) {
  const capacityMap = {};

  // Normalize helper
  const normalize = v => String(v || "").trim();

  /**
   * STEP 1: Build FC → Capacity map
   */
  capacityRows.forEach(row => {
    const fc =
      normalize(row["FC"]) ||
      normalize(row["FC Code"]) ||
      normalize(row["Location"]);

    const capacity =
      Number(row["Capacity"]) ||
      Number(row["Max Capacity"]) ||
      0;

    if (fc) {
      capacityMap[fc] = capacity;
    }
  });

  /**
   * STEP 2: Apply capacity FC-wise
   */
  const result = {};

  Object.keys(fcPlans).forEach(fc => {
    const fcCapacity = capacityMap[fc];

    // If capacity not defined → assume unlimited
    if (fcCapacity === undefined) {
      result[fc] = fcPlans[fc].map(r => ({
        ...r,
        capacityRemark: ""
      }));
      return;
    }

    let remainingCapacity = fcCapacity;

    result[fc] = fcPlans[fc].map(row => {
      let finalSendQty = row.sendQty;
      let remark = "";

      if (finalSendQty > remainingCapacity) {
        finalSendQty = Math.max(remainingCapacity, 0);
        remark = "FC capacity capped shipment";
      }

      remainingCapacity -= finalSendQty;

      return {
        ...row,
        sendQty: finalSendQty,
        capacityRemark: remark
      };
    });
  });

  return result;
}
