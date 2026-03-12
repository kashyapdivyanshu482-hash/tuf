import { headers } from "next/headers";
import { siteUrl } from "@/lib/env";

export async function getServerBaseUrl() {
  if (siteUrl) return siteUrl.replace(/\/$/, "");

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") || "http";
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000";

  return `${protocol}://${host}`;
}
