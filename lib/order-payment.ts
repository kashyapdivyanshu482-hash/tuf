import type { CheckoutPaymentMethod } from "@/lib/pricing";

type NormalizedPaymentState = "SUCCESS" | "PENDING" | "FAILED";

type PaymentUpdate = {
  paymentStatus: "PENDING" | "PAID" | "PARTIALLY_PAID" | "FAILED";
  orderStatus?: "Placed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  amountPaid?: number;
};

function safeMoney(value: number) {
  return Number(Math.max(0, value).toFixed(2));
}

export function normalizeCashfreeStatus(rawStatus: string | null | undefined): NormalizedPaymentState {
  const status = (rawStatus || "").toUpperCase();
  if (status === "PAID" || status === "SUCCESS") return "SUCCESS";
  if (status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") return "FAILED";
  return "PENDING";
}

export function getOrderPaymentUpdate(
  paymentMethod: CheckoutPaymentMethod,
  payNowAmount: number,
  cashfreeStatus: string | null | undefined,
): PaymentUpdate {
  const normalized = normalizeCashfreeStatus(cashfreeStatus);
  if (normalized === "SUCCESS") {
    if (paymentMethod === "PREPAID") {
      return {
        paymentStatus: "PAID",
        orderStatus: "Processing",
        amountPaid: safeMoney(payNowAmount),
      };
    }
    return {
      paymentStatus: "PARTIALLY_PAID",
      orderStatus: "Processing",
      amountPaid: safeMoney(payNowAmount),
    };
  }

  if (normalized === "FAILED") {
    return {
      paymentStatus: "FAILED",
      orderStatus: "Placed",
      amountPaid: 0,
    };
  }

  return {
    paymentStatus: "PENDING",
    orderStatus: "Placed",
    amountPaid: 0,
  };
}
