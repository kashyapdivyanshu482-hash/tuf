import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import fs from "node:fs";
import path from "node:path";

let cachedServerEnv: { url?: string; anonKey?: string } | null = null;

function clean(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

function resolveServerEnv() {
  if (cachedServerEnv) return cachedServerEnv;

  const fromProcess = {
    url: clean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    anonKey: clean(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY,
    ),
  };

  if (fromProcess.url && fromProcess.anonKey) {
    cachedServerEnv = fromProcess;
    return cachedServerEnv;
  }

  const cwd = process.cwd();
  const local = parseEnvFile(path.join(cwd, ".env.local"));
  const base = parseEnvFile(path.join(cwd, ".env"));
  const merged = { ...base, ...local };

  cachedServerEnv = {
    url: clean(fromProcess.url || merged.NEXT_PUBLIC_SUPABASE_URL || merged.SUPABASE_URL),
    anonKey: clean(
      fromProcess.anonKey ||
        merged.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        merged.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        merged.SUPABASE_ANON_KEY ||
        merged.SUPABASE_PUBLISHABLE_KEY,
    ),
  };

  return cachedServerEnv;
}

export async function createClient() {
  const resolved = resolveServerEnv();
  const url = resolved.url || supabaseUrl;
  const anonKey = resolved.anonKey || supabaseAnonKey;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies; middleware or route handlers should refresh session.
        }
      },
    },
  });
}
