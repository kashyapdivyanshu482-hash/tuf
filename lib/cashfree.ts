import {
  cashfreeApiVersion,
  cashfreeAppId,
  cashfreeEnvironment,
  cashfreeSecretKey,
} from "@/lib/env";

type CreateCashfreeOrderInput = {
  orderId: string;
  orderAmount: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
  paymentMethods: string;
  orderNote?: string;
};

type CreateCashfreeOrderResult = {
  cashfreeOrderId: string | null;
  paymentSessionId: string | null;
  raw: unknown;
};

type FetchCashfreeOrderResult = {
  orderStatus: string | null;
  raw: unknown;
};

export function isCashfreeConfigured() {
  return Boolean(cashfreeAppId && cashfreeSecretKey);
}

function getCashfreeBaseUrl() {
  const env = (cashfreeEnvironment || "sandbox").toLowerCase();
  return env === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

function getCashfreeHeaders() {
  if (!cashfreeAppId || !cashfreeSecretKey) {
    throw new Error("Cashfree is not configured. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY.");
  }

  return {
    "x-client-id": cashfreeAppId,
    "x-client-secret": cashfreeSecretKey,
    "x-api-version": cashfreeApiVersion,
    "Content-Type": "application/json",
  };
}

async function cashfreeFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${getCashfreeBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...getCashfreeHeaders(),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const rawText = await response.text();
  let parsed: unknown = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = rawText;
  }

  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed !== null && "message" in parsed
        ? String((parsed as { message?: unknown }).message || "Cashfree request failed.")
        : `Cashfree request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return parsed;
}

export async function createCashfreeOrder(input: CreateCashfreeOrderInput): Promise<CreateCashfreeOrderResult> {
  const payload = {
    order_id: input.orderId,
    order_amount: Number(input.orderAmount.toFixed(2)),
    order_currency: "INR",
    customer_details: {
      customer_id: input.customerId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
    },
    order_meta: {
      return_url: input.returnUrl,
      notify_url: input.notifyUrl,
      payment_methods: input.paymentMethods,
    },
    order_note: input.orderNote || "TUF Clothing checkout",
  };

  const raw = await cashfreeFetch("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (typeof raw !== "object" || raw === null) {
    return {
      cashfreeOrderId: null,
      paymentSessionId: null,
      raw,
    };
  }

  const data = raw as Record<string, unknown>;
  return {
    cashfreeOrderId: typeof data.cf_order_id === "string" ? data.cf_order_id : null,
    paymentSessionId: typeof data.payment_session_id === "string" ? data.payment_session_id : null,
    raw,
  };
}

export async function fetchCashfreeOrder(orderId: string): Promise<FetchCashfreeOrderResult> {
  const raw = await cashfreeFetch(`/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
  if (typeof raw !== "object" || raw === null) {
    return { orderStatus: null, raw };
  }

  const data = raw as Record<string, unknown>;
  return {
    orderStatus: typeof data.order_status === "string" ? data.order_status : null,
    raw,
  };
}
