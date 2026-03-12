import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const orderId = extractOrderId(body);
    const rawPaymentStatus = extractPaymentStatus(body);

    if (!orderId) return NextResponse.json({ ok: true, skipped: true });

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ ok: true, skipped: true });

    const { data: order } = await admin
      .from("orders")
      .select("id,payment_method,pay_now_amount")
      .eq("id", orderId)
      .single();

    if (!order) return NextResponse.json({ ok: true, skipped: true });

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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
