import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCashfreeOrder, isCashfreeConfigured } from "@/lib/cashfree";
import { getServerBaseUrl } from "@/lib/server-url";
import {
  getCheckoutPaymentBreakdown,
  getCheckoutTotalsFromItems,
  getItemTaxRate,
  getPriceMeta,
  type CheckoutPaymentMethod,
} from "@/lib/pricing";

type CheckoutItemInput = {
  productId: string;
  productName: string;
  selectedSize?: string;
  quantity: number;
  unitPrice: number;
};

type CheckoutRequestBody = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  paymentMethod: CheckoutPaymentMethod;
  items: CheckoutItemInput[];
};

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPaymentMethod(value: string): value is CheckoutPaymentMethod {
  return value === "PREPAID" || value === "COD";
}

function safeMoney(value: number) {
  return Number(Math.max(0, value).toFixed(2));
}

function safeSize(value: string) {
  const normalized = value.toUpperCase();
  return ["XS", "S", "M", "L", "XL", "XXL"].includes(normalized) ? normalized : "M";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CheckoutRequestBody>;

    const customerName = cleanString(body.customerName);
    const customerEmail = cleanString(body.customerEmail);
    const customerPhone = cleanString(body.customerPhone);
    const shippingAddress = cleanString(body.shippingAddress);
    const acceptedTerms = Boolean(body.acceptedTerms);
    const acceptedPrivacy = Boolean(body.acceptedPrivacy);
    const paymentMethodRaw = cleanString(body.paymentMethod);
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerName || customerName.length < 2) return badRequest("Full name is required.");
    if (!isValidEmail(customerEmail)) return badRequest("Valid email is required.");
    if (!customerPhone || customerPhone.length < 7) return badRequest("Valid phone is required.");
    if (!shippingAddress || shippingAddress.length < 8) return badRequest("Shipping address is required.");
    if (!acceptedTerms || !acceptedPrivacy) return badRequest("Accept terms and privacy to continue.");
    if (!isValidPaymentMethod(paymentMethodRaw)) return badRequest("Invalid payment method.");
    if (items.length === 0) return badRequest("Cart is empty.");
    if (!isCashfreeConfigured()) {
      return badRequest("Payments are temporarily unavailable. Cashfree keys are not configured yet.", 503);
    }

    const normalizedItems = items
      .map((item) => ({
        productId: cleanString(item.productId),
        productName: cleanString(item.productName),
        selectedSize: cleanString(item.selectedSize),
        quantity: Math.max(1, Math.trunc(Number(item.quantity) || 1)),
        unitPrice: Math.max(1, Number(item.unitPrice) || 1),
      }))
      .filter((item) => item.productId && item.productName);

    if (normalizedItems.length === 0) return badRequest("No valid cart items.");

    const totals = getCheckoutTotalsFromItems(
      normalizedItems.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    );
    const paymentBreakdown = getCheckoutPaymentBreakdown(totals.grandTotal, paymentMethodRaw);

    const supabase = await createClient();
    if (!supabase) {
      return badRequest("Supabase is not configured.", 500);
    }

    const orderInsertPayload = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      accepted_terms: true,
      accepted_privacy: true,
      currency: "INR",
      subtotal: safeMoney(totals.subtotal),
      tax_amount: safeMoney(totals.taxAmount),
      shipping_amount: safeMoney(totals.shippingCharge),
      total_amount: safeMoney(totals.grandTotal),
      status: "Placed",
      payment_method: paymentMethodRaw,
      payment_status: "PENDING",
      pay_now_amount: safeMoney(paymentBreakdown.payNowAmount),
      amount_paid: 0,
      amount_to_collect: safeMoney(paymentBreakdown.amountToCollect),
      cod_advance_amount: safeMoney(paymentBreakdown.codAdvanceAmount),
      cod_handling_fee: safeMoney(paymentBreakdown.codHandlingFee),
    };

    const { data: order, error: orderInsertError } = await supabase.from("orders").insert(orderInsertPayload).select("*").single();
    if (orderInsertError || !order) {
      return badRequest(orderInsertError?.message || "Failed to create order.", 500);
    }

    const orderItemsPayload = normalizedItems.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const taxRate = getItemTaxRate(item.unitPrice);
      const taxAmount = Math.round(lineSubtotal * taxRate);
      const lineTotal = lineSubtotal + taxAmount;
      const meta = getPriceMeta(item.unitPrice);

      return {
        order_id: order.id,
        product_id: isUuid(item.productId) ? item.productId : null,
        product_name: item.productName,
        product_size: safeSize(item.selectedSize || "M"),
        quantity: item.quantity,
        unit_price: safeMoney(item.unitPrice),
        original_price: safeMoney(meta.originalPrice),
        discount_percent: meta.discountPercent,
        tax_rate: Number(taxRate.toFixed(4)),
        tax_amount: safeMoney(taxAmount),
        line_subtotal: safeMoney(lineSubtotal),
        line_total: safeMoney(lineTotal),
      };
    });

    const { error: itemInsertError } = await supabase.from("order_items").insert(orderItemsPayload);
    if (itemInsertError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return badRequest(itemInsertError.message, 500);
    }

    const baseUrl = await getServerBaseUrl();
    const returnUrl = `${baseUrl}/checkout/return?order_id={order_id}`;
    const notifyUrl = `${baseUrl}/api/cashfree/webhook`;
    const paymentMethods = "cc,dc,upi";

    const customerId = `${customerPhone.replace(/[^0-9]/g, "").slice(-10) || "cust"}-${Date.now()}`;
    const orderNote =
      paymentMethodRaw === "COD"
        ? "COD selected: advance + handling fee paid online"
        : "Prepaid online payment";

    let cashfree: Awaited<ReturnType<typeof createCashfreeOrder>>;
    try {
      cashfree = await createCashfreeOrder({
        orderId: order.id,
        orderAmount: paymentBreakdown.payNowAmount,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        returnUrl,
        notifyUrl,
        paymentMethods,
        orderNote,
      });
    } catch (error) {
      await supabase.from("orders").delete().eq("id", order.id);
      return badRequest(error instanceof Error ? error.message : "Cashfree order creation failed.", 500);
    }

    if (!cashfree.paymentSessionId) {
      await supabase.from("orders").delete().eq("id", order.id);
      return badRequest("Cashfree payment session could not be created.", 500);
    }

    await supabase
      .from("orders")
      .update({
        cashfree_order_id: cashfree.cashfreeOrderId,
        cashfree_payment_session_id: cashfree.paymentSessionId,
      })
      .eq("id", order.id);

    return NextResponse.json({
      orderId: order.id,
      paymentSessionId: cashfree.paymentSessionId,
      paymentMethod: paymentMethodRaw,
      payNowAmount: paymentBreakdown.payNowAmount,
      amountToCollect: paymentBreakdown.amountToCollect,
      codAdvanceAmount: paymentBreakdown.codAdvanceAmount,
      codHandlingFee: paymentBreakdown.codHandlingFee,
    });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Checkout failed.", 500);
  }
}
