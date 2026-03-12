"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categories, getCategoryHref } from "@/lib/categories";
import {
  clearAdminSession,
  createAdminSession,
  isAdminConfigured,
  requireAdmin,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const orderStatuses = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"] as const;

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumberValue(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(getStringValue(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getIntValue(value: FormDataEntryValue | null, fallback: number) {
  const parsed = parseInt(getStringValue(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toMoney(value: number) {
  return Number(Math.max(0, value).toFixed(2));
}

function toSafeStock(value: number) {
  return Math.max(0, Math.trunc(value));
}

function toDiscountPercent(originalPrice: number, discountedPrice: number) {
  if (originalPrice <= 0) return 0;
  const raw = ((originalPrice - discountedPrice) / originalPrice) * 100;
  const rounded = Math.round(raw);
  return Math.max(0, Math.min(100, rounded));
}

function adminErrorRedirect(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

function adminSuccessRedirect(message: string): never {
  redirect(`/admin?ok=${encodeURIComponent(message)}`);
}

async function getAdminClientOrRedirect() {
  await requireAdmin();
  const client = createAdminClient();
  if (!client) adminErrorRedirect("Missing SUPABASE_SERVICE_ROLE_KEY configuration.");
  return client;
}

export async function loginAdminAction(formData: FormData) {
  if (!isAdminConfigured()) {
    redirect("/admin/login?error=missing_config");
  }

  const password = getStringValue(formData.get("password"));
  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=invalid_credentials");
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function upsertBannerAction(formData: FormData) {
  const client = await getAdminClientOrRedirect();

  const id = getStringValue(formData.get("id"));
  const title = getStringValue(formData.get("title"));
  const subtitle = getStringValue(formData.get("subtitle"));
  const imageUrl = getStringValue(formData.get("image_url"));
  const linkTo = getStringValue(formData.get("link_to")) || "/";

  if (!title) adminErrorRedirect("Banner title is required.");
  if (!imageUrl) adminErrorRedirect("Banner image URL is required.");

  const payload: {
    id?: string;
    title: string;
    subtitle: string | null;
    image_url: string;
    link_to: string;
  } = {
    title,
    subtitle: subtitle || null,
    image_url: imageUrl,
    link_to: linkTo,
  };

  if (id) payload.id = id;

  const { error } = await client.from("banners").upsert(payload);
  if (error) adminErrorRedirect(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
  adminSuccessRedirect("Banner saved.");
}

export async function deleteBannerAction(formData: FormData) {
  const client = await getAdminClientOrRedirect();
  const id = getStringValue(formData.get("id"));
  if (!id) adminErrorRedirect("Banner id missing.");

  const { error } = await client.from("banners").delete().eq("id", id);
  if (error) adminErrorRedirect(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
  adminSuccessRedirect("Banner deleted.");
}

export async function createProductAction(formData: FormData) {
  const client = await getAdminClientOrRedirect();

  const name = getStringValue(formData.get("name"));
  const description = getStringValue(formData.get("description"));
  const fabric = getStringValue(formData.get("fabric"));
  const printType = getStringValue(formData.get("print_type"));
  const primaryImage = getStringValue(formData.get("image_url_1"));
  const image2 = getStringValue(formData.get("image_url_2")) || primaryImage;
  const image3 = getStringValue(formData.get("image_url_3")) || primaryImage;
  const image4 = getStringValue(formData.get("image_url_4")) || primaryImage;
  const image5 = getStringValue(formData.get("image_url_5")) || primaryImage;
  const incomingCategory = getStringValue(formData.get("category"));
  const isFeatured = getStringValue(formData.get("is_featured")) === "on";

  if (!name) adminErrorRedirect("Product name is required.");
  if (!fabric) adminErrorRedirect("Product fabric is required.");
  if (!printType) adminErrorRedirect("Product print type is required.");
  if (!primaryImage) adminErrorRedirect("Primary image URL is required.");

  const category = categories.includes(incomingCategory as (typeof categories)[number]) ? incomingCategory : categories[0];

  const basePrice = Math.max(1, getNumberValue(formData.get("price"), 0));
  const sizeMPrice = Math.max(1, getNumberValue(formData.get("size_m_price"), basePrice));
  const sizeXSPrice = Math.max(1, getNumberValue(formData.get("size_xs_price"), sizeMPrice - 200));
  const sizeSPrice = Math.max(1, getNumberValue(formData.get("size_s_price"), sizeMPrice - 100));
  const sizeLPrice = Math.max(1, getNumberValue(formData.get("size_l_price"), sizeMPrice + 100));
  const sizeXLPrice = Math.max(1, getNumberValue(formData.get("size_xl_price"), sizeMPrice + 200));
  const sizeXXLPrice = Math.max(1, getNumberValue(formData.get("size_xxl_price"), sizeMPrice + 300));

  const rawOriginal = getNumberValue(formData.get("original_price"), sizeMPrice * 2);
  const originalPrice = Math.max(sizeMPrice, rawOriginal);
  const discountPercent = toDiscountPercent(originalPrice, sizeMPrice);

  const stockXS = toSafeStock(getIntValue(formData.get("size_xs_stock"), 0));
  const stockS = toSafeStock(getIntValue(formData.get("size_s_stock"), 0));
  const stockM = toSafeStock(getIntValue(formData.get("size_m_stock"), 0));
  const stockL = toSafeStock(getIntValue(formData.get("size_l_stock"), 0));
  const stockXL = toSafeStock(getIntValue(formData.get("size_xl_stock"), 0));
  const stockXXL = toSafeStock(getIntValue(formData.get("size_xxl_stock"), 0));
  const stockQuantity = stockXS + stockS + stockM + stockL + stockXL + stockXXL;

  const payload = {
    name,
    description: description || null,
    fabric,
    print_type: printType,
    category,
    image_url: primaryImage,
    image_url_1: primaryImage,
    image_url_2: image2,
    image_url_3: image3,
    image_url_4: image4,
    image_url_5: image5,
    price: toMoney(sizeMPrice),
    original_price: toMoney(originalPrice),
    discount_percent: discountPercent,
    size_xs_price: toMoney(sizeXSPrice),
    size_s_price: toMoney(sizeSPrice),
    size_m_price: toMoney(sizeMPrice),
    size_l_price: toMoney(sizeLPrice),
    size_xl_price: toMoney(sizeXLPrice),
    size_xxl_price: toMoney(sizeXXLPrice),
    size_xs_stock: stockXS,
    size_s_stock: stockS,
    size_m_stock: stockM,
    size_l_stock: stockL,
    size_xl_stock: stockXL,
    size_xxl_stock: stockXXL,
    stock_quantity: stockQuantity,
    is_featured: isFeatured,
  };

  const { data, error } = await client.from("products").insert(payload).select("id, category").single();
  if (error) adminErrorRedirect(error.message);

  revalidatePath("/");
  revalidatePath(getCategoryHref(category));
  if (data?.id) revalidatePath(`/product/${data.id}`);
  revalidatePath("/admin");
  adminSuccessRedirect("Product created.");
}

export async function deleteProductAction(formData: FormData) {
  const client = await getAdminClientOrRedirect();
  const id = getStringValue(formData.get("id"));
  if (!id) adminErrorRedirect("Product id missing.");

  const { data: existing } = await client.from("products").select("id, category").eq("id", id).single();
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) adminErrorRedirect(error.message);

  revalidatePath("/");
  if (existing?.category) revalidatePath(getCategoryHref(existing.category));
  revalidatePath(`/product/${id}`);
  revalidatePath("/admin");
  adminSuccessRedirect("Product deleted.");
}

export async function updateOrderStatusAction(formData: FormData) {
  const client = await getAdminClientOrRedirect();
  const id = getStringValue(formData.get("id"));
  const status = getStringValue(formData.get("status"));

  if (!id) adminErrorRedirect("Order id missing.");
  if (!orderStatuses.includes(status as (typeof orderStatuses)[number])) {
    adminErrorRedirect("Invalid order status.");
  }

  const { error } = await client.from("orders").update({ status }).eq("id", id);
  if (error) adminErrorRedirect(error.message);

  revalidatePath("/admin");
  adminSuccessRedirect("Order status updated.");
}
