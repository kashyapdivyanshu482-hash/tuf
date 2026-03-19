import { NextResponse } from "next/server";
import { cashfreeWebhookSecret } from "@/lib/env";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import type { CheckoutPaymentMethod } from "@/lib/pricing";
import { getOrderPaymentUpdate } from "@/lib/order-payment";
import { createAdminClient } from "@/lib/supabase/admin";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extractOrderId(payload: Record<string, unknown>) {
  const direct = cleanString(payload.order_id);
  if (direct) return direct;

  const data = payload.data;
  if (data && typeof data === "object") {
    const dataObject = data as Record<string, unknown>;
    const nestedDirect = cleanString(dataObject.order_id);
    if (nestedDirect) return nestedDirect;

    const orderObject = dataObject.order;
    if (orderObject && typeof orderObject === "object") {
      const nestedOrderId = cleanString((orderObject as Record<string, unknown>).order_id);
      if (nestedOrderId) return nestedOrderId;
    }
  }

  return "";
}

function extractPaymentStatus(payload: Record<string, unknown>) {
  const direct = cleanString(payload.order_status) || cleanString(payload.payment_status);
  if (direct) return direct;

  const data = payload.data;
  if (data && typeof data === "object") {
    const dataObject = data as Record<string, unknown>;
    const fromData = cleanString(dataObject.order_status) || cleanString(dataObject.payment_status);
    if (fromData) return fromData;

    const payment = dataObject.payment;
    if (payment && typeof payment === "object") {
      const fromPayment = cleanString((payment as Record<string, unknown>).payment_status);
      if (fromPayment) return fromPayment;
    }
  }

  return "";
}

function getWebhookHeader(request: Request, primary: string, legacy: string) {
  return request.headers.get(primary)?.trim() || request.headers.get(legacy)?.trim() || "";
}

export async function POST(request: Request) {
  try {
    if (!cashfreeWebhookSecret) {
      console.error("Cashfree webhook rejected: missing webhook secret env");
      return NextResponse.json({ ok: false, error: "Webhook secret is not configured." }, { status: 503 });
    }

    const rawBody = await request.text();
    const signature = getWebhookHeader(request, "x-webhook-signature", "x-cashfree-signature");
    const timestamp = getWebhookHeader(request, "x-webhook-timestamp", "x-cashfree-timestamp");

    if (!verifyCashfreeWebhookSignature({ timestamp, rawBody, signature })) {
      console.error("Cashfree webhook rejected: invalid signature", {
        hasTimestamp: Boolean(timestamp),
        hasSignature: Boolean(signature),
        contentType: request.headers.get("content-type") || "",
      });
      return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
    }

    const body = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    const orderId = extractOrderId(body);
    const rawPaymentStatus = extractPaymentStatus(body);

    if (!orderId) {
      console.log("Cashfree webhook accepted without order_id", {
        event: cleanString(body.type) || cleanString(body.event) || "unknown",
      });
      return NextResponse.json({ ok: true, skipped: true });
    }

    const admin = createAdminClient();
    if (!admin) {
      console.error("Cashfree webhook skipped: missing admin client");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { data: order } = await admin
      .from("orders")
      .select("id,payment_method,pay_now_amount")
      .eq("id", orderId)
      .single();

    if (!order) {
      console.log("Cashfree webhook skipped: order not found", { orderId });
      return NextResponse.json({ ok: true, skipped: true });
    }

    const paymentMethod = (order.payment_method as CheckoutPaymentMethod) || "PREPAID";
    const update = getOrderPaymentUpdate(paymentMethod, Number(order.pay_now_amount || 0), rawPaymentStatus);

    await admin
      .from("orders")
      .update({
        payment_status: update.paymentStatus,
        status: update.orderStatus,
        amount_paid: update.amountPaid,
      })
      .eq("id", orderId);

    console.log("Cashfree webhook processed", {
      orderId,
      paymentMethod,
      rawPaymentStatus,
      nextPaymentStatus: update.paymentStatus,
      nextOrderStatus: update.orderStatus,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Cashfree webhook failed", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
