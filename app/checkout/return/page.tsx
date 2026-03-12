import Link from "next/link";
import CheckoutReturnClient from "@/components/checkout-return-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCashfreeOrder } from "@/lib/cashfree";
import { getOrderPaymentUpdate, normalizeCashfreeStatus } from "@/lib/order-payment";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CheckoutPaymentMethod } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type CheckoutReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type OrderLookup = {
  id: string;
  payment_method: CheckoutPaymentMethod;
  pay_now_amount: number;
};

export default async function CheckoutReturnPage({ searchParams }: CheckoutReturnPageProps) {
  const params = await searchParams;
  const orderId = getSingleValue(params.order_id) || "";

  if (!orderId) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Payment Verification Failed</CardTitle>
            <CardDescription>Missing order id in return URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/checkout">Back to Checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const admin = createAdminClient();
  let order: OrderLookup | null = null;
  if (admin) {
    const { data } = await admin
      .from("orders")
      .select("id,payment_method,pay_now_amount")
      .eq("id", orderId)
      .single();
    if (data) order = data as OrderLookup;
  }

  let cashfreeStatus: string | null = null;
  let cashfreeError: string | null = null;
  try {
    const cashfree = await fetchCashfreeOrder(orderId);
    cashfreeStatus = cashfree.orderStatus;
  } catch (error) {
    cashfreeError = error instanceof Error ? error.message : "Unable to verify payment.";
  }

  const normalized = normalizeCashfreeStatus(cashfreeStatus);
  const successful = normalized === "SUCCESS";

  if (admin && order) {
    const update = getOrderPaymentUpdate(order.payment_method, Number(order.pay_now_amount || 0), cashfreeStatus);
    await admin
      .from("orders")
      .update({
        payment_status: update.paymentStatus,
        status: update.orderStatus,
        amount_paid: update.amountPaid,
      })
      .eq("id", order.id);
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <CheckoutReturnClient clearCart={successful} />
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{successful ? "Payment Confirmed" : "Payment Pending"}</CardTitle>
          <CardDescription>
            {successful
              ? "Your order has been placed successfully."
              : "We could not confirm a successful payment yet. You can retry checkout."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-border p-3 text-sm">
            <p>
              <span className="font-medium">Order ID:</span> {orderId}
            </p>
            <p>
              <span className="font-medium">Cashfree Status:</span> {cashfreeStatus || "UNKNOWN"}
            </p>
            {cashfreeError ? <p className="text-red-500">{cashfreeError}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
            {!successful ? (
              <Button asChild variant="outline">
                <Link href="/checkout">Back to Checkout</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
