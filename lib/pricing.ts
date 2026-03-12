type PriceMeta = {
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
};

type TaxInclusivePriceMeta = {
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
};

export type CheckoutPaymentMethod = "PREPAID" | "COD";

type CheckoutPaymentBreakdown = {
  method: CheckoutPaymentMethod;
  payNowAmount: number;
  amountToCollect: number;
  codAdvanceAmount: number;
  codHandlingFee: number;
};

const DEFAULT_DISCOUNT_PERCENT = 50;

function safeAmount(value: number) {
  return Math.max(1, Math.round(Number(value) || 0));
}

export function getPriceMeta(price: number, discountPercent = DEFAULT_DISCOUNT_PERCENT): PriceMeta {
  const discountedPrice = safeAmount(price);
  const divisor = 1 - discountPercent / 100;
  const originalPrice = safeAmount(discountedPrice / (divisor <= 0 ? 0.5 : divisor));
  const discountPercentRounded = Math.max(0, Math.round(((originalPrice - discountedPrice) / originalPrice) * 100));

  return {
    originalPrice,
    discountedPrice,
    discountPercent: discountPercentRounded,
  };
}

export function getTaxRate(subtotal: number) {
  return subtotal > 2500 ? 0.18 : 0.05;
}

export function getShippingCharge(subtotal: number) {
  return subtotal > 1000 ? 0 : 50;
}

export function getCheckoutTotals(subtotal: number) {
  const taxRate = getTaxRate(subtotal);
  const taxAmount = Math.round(subtotal * taxRate);
  const shippingCharge = getShippingCharge(subtotal);
  const grandTotal = subtotal + taxAmount + shippingCharge;

  return {
    subtotal,
    taxRate,
    taxAmount,
    shippingCharge,
    grandTotal,
  };
}

export function getItemTaxRate(unitPrice: number) {
  return unitPrice > 2500 ? 0.18 : 0.05;
}

export function getTaxInclusiveUnitPrice(unitPrice: number) {
  const safeUnit = Math.max(1, Math.round(Number(unitPrice) || 0));
  const rate = getItemTaxRate(safeUnit);
  return Math.round(safeUnit * (1 + rate));
}

export function getTaxInclusivePriceMeta(price: number, discountPercent = DEFAULT_DISCOUNT_PERCENT): TaxInclusivePriceMeta {
  const base = getPriceMeta(price, discountPercent);
  const originalPrice = getTaxInclusiveUnitPrice(base.originalPrice);
  const discountedPrice = getTaxInclusiveUnitPrice(base.discountedPrice);
  const effectiveDiscount =
    originalPrice > 0 ? Math.max(0, Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)) : 0;

  return {
    originalPrice,
    discountedPrice,
    discountPercent: effectiveDiscount,
  };
}

type CheckoutItemInput = {
  quantity: number;
  unitPrice: number;
};

export function getCheckoutTotalsFromItems(items: CheckoutItemInput[]) {
  const subtotal = Math.round(
    items.reduce((sum, item) => sum + Math.max(1, Number(item.unitPrice) || 0) * Math.max(1, Number(item.quantity) || 1), 0),
  );

  const taxAmount = Math.round(
    items.reduce((sum, item) => {
      const unitPrice = Math.max(1, Number(item.unitPrice) || 0);
      const qty = Math.max(1, Number(item.quantity) || 1);
      const rate = getItemTaxRate(unitPrice);
      return sum + unitPrice * qty * rate;
    }, 0),
  );

  const shippingCharge = getShippingCharge(subtotal);
  const grandTotal = subtotal + taxAmount + shippingCharge;

  return {
    subtotal,
    taxAmount,
    shippingCharge,
    grandTotal,
  };
}

export function getCheckoutPaymentBreakdown(
  grandTotal: number,
  method: CheckoutPaymentMethod,
): CheckoutPaymentBreakdown {
  const safeTotal = Math.max(0, Math.round(Number(grandTotal) || 0));
  if (method === "PREPAID") {
    return {
      method,
      payNowAmount: safeTotal,
      amountToCollect: 0,
      codAdvanceAmount: 0,
      codHandlingFee: 0,
    };
  }

  const codAdvanceAmount = Math.round(safeTotal * 0.05);
  const codHandlingFee = 50;
  const payNowAmount = codAdvanceAmount + codHandlingFee;
  const amountToCollect = Math.max(0, safeTotal - codAdvanceAmount);

  return {
    method,
    payNowAmount,
    amountToCollect,
    codAdvanceAmount,
    codHandlingFee,
  };
}
