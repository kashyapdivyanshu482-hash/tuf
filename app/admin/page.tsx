import {
  createProductAction,
  deleteBannerAction,
  deleteProductAction,
  logoutAdminAction,
  updateOrderStatusAction,
  upsertBannerAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/admin-auth";
import { categories } from "@/lib/categories";
import { createAdminClient, isAdminSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_to: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  is_featured: boolean;
  created_at: string;
};

type OrderRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  payment_method: "PREPAID" | "COD" | string;
  payment_status: "PENDING" | "PAID" | "PARTIALLY_PAID" | "FAILED" | string;
  pay_now_amount: number;
  amount_to_collect: number;
  status: "Placed" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | string;
  created_at: string;
};

const orderStatuses = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"] as const;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const error = getSingleValue(params.error);
  const ok = getSingleValue(params.ok);

  let banners: BannerRow[] = [];
  let products: ProductRow[] = [];
  let orders: OrderRow[] = [];

  const adminClient = createAdminClient();
  const ready = isAdminSupabaseConfigured();

  if (adminClient) {
    const [{ data: bannerData }, { data: productData }, { data: orderData }] = await Promise.all([
      adminClient.from("banners").select("id,title,subtitle,image_url,link_to").order("created_at", { ascending: true }),
      adminClient
        .from("products")
        .select("id,name,category,price,stock_quantity,is_featured,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      adminClient
        .from("orders")
        .select("id,customer_name,customer_email,total_amount,payment_method,payment_status,pay_now_amount,amount_to_collect,status,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (bannerData) banners = bannerData;
    if (productData) products = productData;
    if (orderData) orders = orderData;
  }

  const bannerSlots: Array<BannerRow | null> = Array.from({ length: 3 }, (_, index) => banners[index] ?? null);
  const extraBanners = banners.slice(3);

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-2xl border border-border/80 bg-card/75 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.06)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Control Panel</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">TUF Admin</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Products: {products.length} | Banners: {banners.length} | Orders: {orders.length}
            </p>
          </div>
          <form action={logoutAdminAction}>
            <Button variant="outline" type="submit">
              Logout
            </Button>
          </form>
        </div>
        {!ready ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
            Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` to enable admin CRUD operations.
          </div>
        ) : null}
        {ok ? <p className="mt-3 text-sm text-emerald-600">{ok}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Create Product</CardTitle>
            <CardDescription>Insert a new product with size-wise pricing and stock.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createProductAction} className="space-y-3">
              <Input name="name" placeholder="Product name" required />
              <textarea
                name="description"
                placeholder="Description"
                className="min-h-[84px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="fabric" placeholder="Fabric" required />
                <Input name="print_type" placeholder="Print type" required />
              </div>

              <select
                name="category"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                defaultValue={categories[0]}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="image_url_1" placeholder="Primary image URL" required />
                <Input name="image_url_2" placeholder="Image URL 2 (optional)" />
                <Input name="image_url_3" placeholder="Image URL 3 (optional)" />
                <Input name="image_url_4" placeholder="Image URL 4 (optional)" />
                <Input name="image_url_5" placeholder="Image URL 5 (optional)" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="price" type="number" step="0.01" min="1" placeholder="M price (e.g. 2499)" required />
                <Input name="original_price" type="number" step="0.01" min="1" placeholder="Original price (e.g. 4999)" required />
              </div>

              <div className="rounded-xl border border-border/80 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Size Prices</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input name="size_xs_price" type="number" step="0.01" min="1" placeholder="XS price" />
                  <Input name="size_s_price" type="number" step="0.01" min="1" placeholder="S price" />
                  <Input name="size_m_price" type="number" step="0.01" min="1" placeholder="M price" />
                  <Input name="size_l_price" type="number" step="0.01" min="1" placeholder="L price" />
                  <Input name="size_xl_price" type="number" step="0.01" min="1" placeholder="XL price" />
                  <Input name="size_xxl_price" type="number" step="0.01" min="1" placeholder="XXL price" />
                </div>
              </div>

              <div className="rounded-xl border border-border/80 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Size Stock</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input name="size_xs_stock" type="number" min="0" placeholder="XS stock" />
                  <Input name="size_s_stock" type="number" min="0" placeholder="S stock" />
                  <Input name="size_m_stock" type="number" min="0" placeholder="M stock" />
                  <Input name="size_l_stock" type="number" min="0" placeholder="L stock" />
                  <Input name="size_xl_stock" type="number" min="0" placeholder="XL stock" />
                  <Input name="size_xxl_stock" type="number" min="0" placeholder="XXL stock" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_featured" />
                Mark as featured
              </label>

              <Button type="submit" className="w-full">
                Create Product
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Manage Banners</CardTitle>
            <CardDescription>Edit all 3 homepage banners linked to product URLs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {bannerSlots.map((banner, index) => (
                <div key={banner?.id ?? `banner-slot-${index + 1}`} className="rounded-xl border border-border/80 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Banner {index + 1}</p>
                  <form action={upsertBannerAction} className="grid gap-2">
                    {banner?.id ? <input type="hidden" name="id" value={banner.id} /> : null}
                    <Input name="title" defaultValue={banner?.title ?? ""} placeholder="Banner title" required />
                    <Input name="subtitle" defaultValue={banner?.subtitle ?? ""} placeholder="Banner subtitle (optional)" />
                    <Input name="image_url" defaultValue={banner?.image_url ?? ""} placeholder="Banner image URL" required />
                    <Input name="link_to" defaultValue={banner?.link_to ?? ""} placeholder="Link (e.g. /product/{id})" required />
                    <Button type="submit" variant="outline">
                      {banner ? "Update Banner" : "Create Banner"}
                    </Button>
                  </form>
                  {banner ? (
                    <form action={deleteBannerAction} className="mt-2">
                      <input type="hidden" name="id" value={banner.id} />
                      <Button type="submit" variant="outline" className="w-full">
                        Delete Banner
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}

              {extraBanners.length > 0 ? (
                <div className="rounded-xl border border-border/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Extra Banners</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These are not in the first 3 slots used by the homepage. Delete extras to keep only 3.
                  </p>
                  <div className="mt-2 space-y-2">
                    {extraBanners.map((banner) => (
                      <div key={`extra-${banner.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-border/80 p-2">
                        <p className="truncate text-xs">{banner.title}</p>
                        <form action={deleteBannerAction}>
                          <input type="hidden" name="id" value={banner.id} />
                          <Button type="submit" variant="outline" className="h-8 px-3 text-xs">
                            Delete
                          </Button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Quick list of latest products with delete action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {products.length === 0 ? <p className="text-sm text-muted-foreground">No products found.</p> : null}
          {products.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.category} | INR {Number(product.price).toFixed(2)} | Stock {product.stock_quantity} |{" "}
                  {product.is_featured ? "Featured" : "Regular"} | {toDate(product.created_at)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">ID: {product.id}</p>
              </div>
              <form action={deleteProductAction}>
                <input type="hidden" name="id" value={product.id} />
                <Button type="submit" variant="outline">
                  Delete
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Update order status from placed to delivered or cancelled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders found yet.</p> : null}
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border/80 p-3">
              <div className="mb-2">
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground">
                  {order.customer_email} | INR {Number(order.total_amount).toFixed(2)} | {toDate(order.created_at)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.payment_method} | {order.payment_status} | Pay now INR {Number(order.pay_now_amount).toFixed(2)} | Collect INR{" "}
                  {Number(order.amount_to_collect).toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Order ID: {order.id}</p>
              </div>
              <form action={updateOrderStatusAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={order.id} />
                <select
                  name="status"
                  defaultValue={order.status}
                  className="h-10 min-w-[180px] rounded-md border border-border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="outline">
                  Update Status
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
