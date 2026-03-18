import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | TUF Clothing",
  description: "Privacy Policy for TUF Clothing.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 rounded-2xl border border-border/80 bg-card/90 p-4 shadow-[0_18px_38px_rgba(0,0,0,0.08)] sm:p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Legal</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Effective date: March 12, 2026</p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
        <p>
          This Privacy Policy explains how TUF Clothing collects, uses, and protects your personal data when you use our
          website.
        </p>

        <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Name, email, phone number, and shipping address.</li>
          <li>Order details such as products, sizes, quantity, and payment method.</li>
          <li>Basic technical data such as device/browser information used for site performance and security.</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground">2. How We Use Information</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>To process and deliver your orders.</li>
          <li>To provide support, replacement handling, and order communication.</li>
          <li>To prevent fraud, abuse, and unauthorized transactions.</li>
          <li>To improve store performance and customer experience.</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground">3. Payments and Third Parties</h2>
        <p>
          Online payments are processed via Cashfree. We do not store full card details or UPI credentials on our servers.
          Relevant order and transaction data may be shared with payment, shipping, and compliance providers strictly to fulfill
          your order.
        </p>

        <h2 className="text-base font-semibold text-foreground">4. Data Retention</h2>
        <p>
          We retain personal and order data only for as long as required for operations, legal compliance, dispute resolution,
          and fraud prevention.
        </p>

        <h2 className="text-base font-semibold text-foreground">5. Your Rights</h2>
        <p>
          You may request correction or deletion of your personal data, subject to legal and operational requirements. For such
          requests, contact{" "}
          <a className="underline decoration-border underline-offset-4 hover:text-foreground" href="mailto:support@tufclothing.com">
            support@tufclothing.com
          </a>
          .
        </p>

        <h2 className="text-base font-semibold text-foreground">6. Security</h2>
        <p>
          We use reasonable technical and operational safeguards to protect your information, but no digital system can guarantee
          absolute security.
        </p>
        <h3>Feel Free to Contact us on ou official email address: tufclothing@proton.me</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Also read our{" "}
        <Link className="underline decoration-border underline-offset-4 hover:text-foreground" href="/terms-and-conditions">
          Terms and Conditions
        </Link>
        .
      </p>
    </section>
  );
}
