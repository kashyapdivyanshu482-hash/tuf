# TUF Clothing Store

Next.js + Tailwind + Supabase e-commerce storefront for TUF Clothing, with direct checkout flow and admin panel.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Supabase (DB + API)
- Cashfree (payment gateway integration ready)

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set values in `.env.local`.
3. Run the app:
   ```bash
   npm run dev
   ```

## Required Environment Variables

Minimum for storefront + admin:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PANEL_PASSWORD`
- `ADMIN_PANEL_SECRET`

For payments:
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `CASHFREE_API_VERSION`
- `NEXT_PUBLIC_CASHFREE_MODE`

## Database

Run `supabase/schema.sql` in Supabase SQL Editor.

## Build / Production

```bash
npm run build
npm run start
```

Detailed launch steps: `DEPLOYMENT_LIVE_CHECKLIST.md`

## Security

- Never commit `.env.local` or real secrets.
- For Vercel, copy the same keys from `.env.local` into Project Settings -> Environment Variables.
- If secrets are exposed, rotate them immediately in Supabase/Cashfree.
