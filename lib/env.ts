function sanitize(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = sanitize(process.env[key]);
    if (value) return value;
  }
  return undefined;
}

export const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
export const supabaseAnonKey = readEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
);

export const supabaseServiceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY");

export const adminPanelPassword = readEnv("ADMIN_PANEL_PASSWORD", "ADMIN_PASSWORD");
export const adminPanelSecret = readEnv("ADMIN_PANEL_SECRET", "ADMIN_SECRET");

export const cashfreeAppId = readEnv("CASHFREE_APP_ID");
export const cashfreeSecretKey = readEnv("CASHFREE_SECRET_KEY");
export const cashfreeWebhookSecret = readEnv("CASHFREE_WEBHOOK_SECRET", "CASHFREE_SECRET_KEY");
export const cashfreeEnvironment = readEnv("NEXT_PUBLIC_CASHFREE_MODE");
export const cashfreeApiVersion = readEnv("CASHFREE_API_VERSION") || "2025-01-01";
export const siteUrl = readEnv("NEXT_PUBLIC_SITE_URL", "SITE_URL");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
