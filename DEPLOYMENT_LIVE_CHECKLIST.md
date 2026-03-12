# TUF Clothing - Production Launch Workflow

This workflow lets you go live now and plug Cashfree production keys later.

## 1) Environment Variables (Production)

Set these on your hosting platform (Vercel/Netlify/etc):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_PANEL_PASSWORD=
ADMIN_PANEL_SECRET=

NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Cashfree (leave empty until approval)
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_ENV=production
CASHFREE_API_VERSION=2025-01-01
NEXT_PUBLIC_CASHFREE_MODE=production
```

Notes:
- `CASHFREE_SECRET_KEY` must stay server-only.
- If `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` are empty, checkout is intentionally blocked with a clear message.

## 2) Supabase Setup

Run `supabase/schema.sql` in Supabase SQL Editor.

This creates:
- products/banners
- orders/order_items with payment fields (`payment_method`, `payment_status`, `pay_now_amount`, etc.)
- RLS and policies

## 3) Deploy Website

Deploy from current main branch.

Post-deploy checks:
- Home, category pages, product pages load
- Admin login works: `/admin/login`
- Banner links and product CRUD work from admin

## 4) Cashfree Later (After Approval)

When Cashfree production account is approved:
1. Add `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` in production env.
2. Keep `CASHFREE_ENV=production` and `NEXT_PUBLIC_CASHFREE_MODE=production`.
3. Set webhook URL in Cashfree dashboard:
   - `https://your-domain.com/api/cashfree/webhook`
4. Ensure return URL domain is allowed by Cashfree:
   - `https://your-domain.com/checkout/return`

## 5) Current Behavior Without Cashfree Keys

- Storefront/admin stay fully usable.
- Checkout API returns `503` with message:
  - `Payments are temporarily unavailable. Cashfree keys are not configured yet.`
- No partial orders are persisted when payment init fails.
