/**
 * Calculate GST breakdown for a given subtotal
 * @param {number} subtotal - Pre-tax amount
 * @param {number} taxRate - GST % (e.g. 5, 12, 18)
 * @param {boolean} isIGST - true for interstate (IGST), false for intrastate (CGST+SGST)
 */
const calcGST = (subtotal, taxRate = 0, isIGST = false) => {
  const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));

  if (isIGST) {
    return { cgst: 0, sgst: 0, igst: taxAmount, taxAmount };
  }

  const half = parseFloat((taxAmount / 2).toFixed(2));
  return { cgst: half, sgst: half, igst: 0, taxAmount };
};

/**
 * Calculate full bill totals for a list of cart items
 * @param {Array} items - [{ price, qty, taxRate }]
 * @param {number} discountPercent
 * @param {boolean} isIGST
 */
const calcBillTotals = (items = [], discountPercent = 0, isIGST = false) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const discountAmount = parseFloat(((subtotal * discountPercent) / 100).toFixed(2));
  const taxableAmount = subtotal - discountAmount;

  // Weighted average tax or per-item tax
  const taxBreakdown = items.reduce(
    (acc, item) => {
      const itemSubtotal = item.price * item.qty;
      const { cgst, sgst, igst, taxAmount } = calcGST(itemSubtotal, item.taxRate || 0, isIGST);
      return {
        cgst: acc.cgst + cgst,
        sgst: acc.sgst + sgst,
        igst: acc.igst + igst,
        taxAmount: acc.taxAmount + taxAmount,
      };
    },
    { cgst: 0, sgst: 0, igst: 0, taxAmount: 0 }
  );

  const grandTotal = parseFloat((taxableAmount + taxBreakdown.taxAmount).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountAmount,
    taxableAmount: parseFloat(taxableAmount.toFixed(2)),
    cgst: parseFloat(taxBreakdown.cgst.toFixed(2)),
    sgst: parseFloat(taxBreakdown.sgst.toFixed(2)),
    igst: parseFloat(taxBreakdown.igst.toFixed(2)),
    taxAmount: parseFloat(taxBreakdown.taxAmount.toFixed(2)),
    grandTotal,
  };
};

module.exports = { calcGST, calcBillTotals };
