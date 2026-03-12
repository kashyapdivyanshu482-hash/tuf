import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | TUF Clothing",
  description: "Terms and Conditions for shopping on TUF Clothing.",
};

export default function TermsAndConditionsPage() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 rounded-2xl border border-border/80 bg-card/90 p-4 shadow-[0_18px_38px_rgba(0,0,0,0.08)] sm:p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Legal</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground">Effective date: March 12, 2026</p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
        <p>
          By placing an order on TUF Clothing, you agree to these Terms and Conditions. If you do not agree, please do not
          use our store or place an order.
        </p>

        <h2 className="text-base font-semibold text-foreground">1. Orders and Product Information</h2>
        <p>
          We try to keep product details, stock, and pricing accurate. In rare situations, we may cancel or modify an order if
          there is a pricing, stock, or technical issue.
        </p>

        <h2 className="text-base font-semibold text-foreground">2. No Return Policy (Replacement Only)</h2>
        <p>
          We do not accept returns. Only replacements are allowed, and only under the conditions below.
        </p>
        <p>
          Replacement requests must be raised within 3 calendar days from delivery, and are only accepted for:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Product received in damaged condition.</li>
          <li>Different product delivered from what was ordered.</li>
        </ul>
        <p>
          Size-change replacements are not available. Please check size details before placing your order.
        </p>
        <p>
          If our inspection finds intentional damage, misuse, or tampering, the claim is treated as void and no replacement will
          be issued.
        </p>

        <h2 className="text-base font-semibold text-foreground">3. COD Advance and Cancellation</h2>
        <p>
          For Cash on Delivery (COD) orders, an advance payment is collected during checkout. If a COD order is canceled, the
          advance amount is non-refundable.
        </p>

        <h2 className="text-base font-semibold text-foreground">4. Shipping and Delivery</h2>
        <p>
          Delivery timelines are estimates and may vary by courier/service area. Delays caused by logistics, weather, or events
          beyond our control are not treated as policy violations.
        </p>

        <h2 className="text-base font-semibold text-foreground">5. Contact</h2>
        <p>
          For replacement requests, contact us with order ID, photos, and unboxing details at{" "}
          <a className="underline decoration-border underline-offset-4 hover:text-foreground" href="mailto:support@tufclothing.com">
            support@tufclothing.com
          </a>
          .
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Also read our{" "}
        <Link className="underline decoration-border underline-offset-4 hover:text-foreground" href="/privacy-policy">
          Privacy Policy
        </Link>
        .
      </p>
    </section>
  );
}
