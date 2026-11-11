const VAT_RATE_PERCENT = 16;

const getPlanPricing = (plan) => {
  const baseAmount = Number(plan?.price || 0);
  const vatAmount = Math.round((baseAmount * VAT_RATE_PERCENT) / 100);
  return {
    baseAmount,
    vatRate: VAT_RATE_PERCENT,
    vatAmount,
    totalAmount: baseAmount + vatAmount
  };
};

const isPlanPaymentAmount = (amountInMinorUnits, currency, plan) => {
  const { totalAmount } = getPlanPricing(plan);
  return Boolean(plan && totalAmount > 0 && Number(amountInMinorUnits) === totalAmount * 100 && currency === "KES");
};

module.exports = { VAT_RATE_PERCENT, getPlanPricing, isPlanPaymentAmount };
