import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminPanelPassword, adminPanelSecret } from "@/lib/env";

const ADMIN_COOKIE_NAME = "tuf_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function encodeSession(expiresAt: number, secret: string) {
  const payload = `${expiresAt}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

function decodeSession(raw: string | undefined, secret: string) {
  if (!raw) return false;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload, secret);
  if (!safeEqual(signature, expected)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;
  if (Math.floor(Date.now() / 1000) >= expiresAt) return false;

  return true;
}

export function isAdminConfigured() {
  return Boolean(adminPanelPassword && adminPanelSecret);
}

export function verifyAdminPassword(input: string) {
  if (!adminPanelPassword) return false;
  return safeEqual(input, adminPanelPassword);
}

export async function createAdminSession() {
  if (!adminPanelSecret) throw new Error("ADMIN_PANEL_SECRET is not configured.");
  const cookieStore = await cookies();
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const value = encodeSession(expiresAt, adminPanelSecret);

  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  if (!adminPanelSecret) return false;
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return decodeSession(raw, adminPanelSecret);
}

export async function requireAdmin() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");
}
