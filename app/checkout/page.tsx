"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/cart-provider";
import { formatINR } from "@/lib/currency";
import {
  getCheckoutPaymentBreakdown,
  getCheckoutTotalsFromItems,
  getTaxInclusivePriceMeta,
  type CheckoutPaymentMethod,
} from "@/lib/pricing";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" }) => Promise<unknown>;
    };
  }
}

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  houseNo: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
};

const initialForm: CheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  houseNo: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  acceptedTerms: false,
  acceptedPrivacy: false,
};

function composeShippingAddress(form: CheckoutForm) {
  const lines = [
    `Address Line 1: ${form.addressLine1.trim()}`,
    form.addressLine2.trim() ? `Address Line 2: ${form.addressLine2.trim()}` : "",
    `House No: ${form.houseNo.trim()}`,
    `Area: ${form.area.trim()}`,
    `City: ${form.city.trim()}`,
    `State: ${form.state.trim()}`,
    `Pincode: ${form.pincode.trim()}`,
    `Country: ${form.country.trim()}`,
  ].filter(Boolean);
  return lines.join(", ");
}

const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "production" : "sandbox";

function loadCashfreeScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Cashfree) return Promise.resolve();

  const existing = document.getElementById("cashfree-sdk-script");
  if (existing) {
    return new Promise<void>((resolve) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => resolve(), { once: true });
      setTimeout(() => resolve(), 2000);
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "cashfree-sdk-script";
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK."));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { items } = useCart();
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("PREPAID");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totals = useMemo(
    () =>
      getCheckoutTotalsFromItems(
        items.map((item) => ({
          quantity: item.quantity,
          unitPrice: Math.round(Number(item.unitPrice ?? item.product.price)),
        })),
      ),
    [items],
  );

  const paymentBreakdown = useMemo(
    () => getCheckoutPaymentBreakdown(totals.grandTotal, paymentMethod),
    [totals.grandTotal, paymentMethod],
  );
  const itemsTotalInclusive = totals.subtotal + totals.taxAmount;

  const canPlace =
    !isSubmitting &&
    items.length > 0 &&
    form.fullName.trim().length > 1 &&
    form.email.trim().length > 4 &&
    form.phone.trim().length > 6 &&
    form.addressLine1.trim().length > 3 &&
    form.houseNo.trim().length > 0 &&
    form.area.trim().length > 1 &&
    form.city.trim().length > 1 &&
    form.state.trim().length > 1 &&
    /^[1-9][0-9]{5}$/.test(form.pincode.trim()) &&
    form.country === "India" &&
    form.acceptedTerms &&
    form.acceptedPrivacy;

  const handlePlaceOrder = async () => {
    if (!canPlace) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        customerName: form.fullName.trim(),
        customerEmail: form.email.trim(),
        customerPhone: form.phone.trim(),
        shippingAddress: composeShippingAddress(form),
        acceptedTerms: form.acceptedTerms,
        acceptedPrivacy: form.acceptedPrivacy,
        paymentMethod,
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          selectedSize: item.selectedSize ?? "M",
          quantity: item.quantity,
          unitPrice: Math.round(Number(item.unitPrice ?? item.product.price)),
        })),
      };

      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; paymentSessionId?: string };

      if (!response.ok || !result.paymentSessionId) {
        throw new Error(result.error || "Unable to initiate payment.");
      }

      await loadCashfreeScript();
      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not available. Please refresh and retry.");
      }

      const cashfree = window.Cashfree({ mode: cashfreeMode });
      await cashfree.checkout({
        paymentSessionId: result.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Checkout failed.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Cart Is Empty</CardTitle>
            <CardDescription>Add items to cart to continue with checkout.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Add Items</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 pb-8 lg:grid-cols-12">
      <Card className="border-border/80 lg:col-span-7">
        <CardHeader>
          <CardTitle>Direct Checkout</CardTitle>
          <CardDescription>Enter shipping details and choose payment method.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <Input
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <div className="space-y-3 rounded-xl border border-border/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Shipping Address</p>
            <Input
              placeholder="Address line 1"
              value={form.addressLine1}
              onChange={(e) => setForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
            />
            <Input
              placeholder="Address line 2 (optional)"
              value={form.addressLine2}
              onChange={(e) => setForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="House no."
                value={form.houseNo}
                onChange={(e) => setForm((prev) => ({ ...prev, houseNo: e.target.value }))}
              />
              <Input
                placeholder="Area / Locality"
                value={form.area}
                onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              />
              <Input
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Pincode"
                value={form.pincode}
                onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
              />
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                value={form.country}
                onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              >
                <option value="India">India</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Payment Method</p>
            <label className="flex items-start gap-2 rounded-lg border border-border/80 p-2 text-sm">
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "PREPAID"}
                onChange={() => setPaymentMethod("PREPAID")}
              />
              <span>
                <span className="font-medium">Prepaid (UPI / Cards)</span>
                <span className="block text-xs text-muted-foreground">Pay full final cart value now via Cashfree.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-border/80 p-2 text-sm">
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              <span>
                <span className="font-medium">Cash on Delivery (Advance + Fee)</span>
                <span className="block text-xs text-muted-foreground">
                  Pay 5% advance + INR 50 COD handling now. Remaining is collected on delivery.
                </span>
              </span>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(e) => setForm((prev) => ({ ...prev, acceptedTerms: e.target.checked }))}
            />
            <span>
              I accept the{" "}
              <Link className="underline decoration-border underline-offset-4 hover:text-foreground" href="/terms-and-conditions">
                Terms and Conditions
              </Link>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.acceptedPrivacy}
              onChange={(e) => setForm((prev) => ({ ...prev, acceptedPrivacy: e.target.checked }))}
            />
            <span>
              I accept the{" "}
              <Link className="underline decoration-border underline-offset-4 hover:text-foreground" href="/privacy-policy">
                Privacy Policy
              </Link>
            </span>
          </label>

          {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}

          <Button className="w-full" onClick={handlePlaceOrder} disabled={!canPlace}>
            {isSubmitting
              ? "Redirecting to Cashfree..."
              : paymentMethod === "PREPAID"
                ? `Pay ${formatINR(paymentBreakdown.payNowAmount)} via Cashfree`
                : `Pay Advance ${formatINR(paymentBreakdown.payNowAmount)} via Cashfree`}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80 lg:col-span-5">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>All displayed prices are inclusive of taxes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => {
            const meta = getTaxInclusivePriceMeta(Number(item.unitPrice ?? item.product.price));
            return (
              <div key={`${item.product.id}-${item.selectedSize ?? "nosize"}`} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.selectedSize ? `Size ${item.selectedSize} - ` : ""}Qty {item.quantity}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="line-through text-muted-foreground">{formatINR(meta.originalPrice)}</span>
                  <span className="font-semibold text-accent">{formatINR(meta.discountedPrice)}</span>
                  <span className="text-xs font-medium">{meta.discountPercent}% OFF</span>
                </div>
              </div>
            );
          })}

          <div className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Items Total (incl. taxes)</span>
              <span>{formatINR(itemsTotalInclusive)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span>{formatINR(totals.shippingCharge)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Cart Total</span>
              <span>{formatINR(totals.grandTotal)}</span>
            </div>

            {paymentMethod === "PREPAID" ? (
              <div className="rounded-lg border border-border/80 bg-card p-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Pay Now (Prepaid)</span>
                  <span>{formatINR(paymentBreakdown.payNowAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-border/80 bg-card p-3">
                <div className="flex items-center justify-between">
                  <span>COD Advance (5%)</span>
                  <span>{formatINR(paymentBreakdown.codAdvanceAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>COD Handling Fee</span>
                  <span>{formatINR(paymentBreakdown.codHandlingFee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                  <span>Pay Now via Cashfree</span>
                  <span>{formatINR(paymentBreakdown.payNowAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Collect on Delivery</span>
                  <span>{formatINR(paymentBreakdown.amountToCollect)}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Shipping is INR 50 by default and becomes INR 0 when items total is above INR 1000.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
