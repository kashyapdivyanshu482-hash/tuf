import { notFound } from "next/navigation";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { fallbackProducts } from "@/lib/mock-data";
import { getCategoryFromSlug } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryFromSlug(slug);
  if (!category) notFound();

  const query = getSingleValue((await searchParams).q)?.toLowerCase() ?? "";
  let products: Product[] = fallbackProducts.filter((item) => item.category === category);

  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.from("products").select("*").eq("category", category).order("created_at", { ascending: false });
    if (data) products = data;
  }

  const filteredProducts =
    query.length > 0
      ? products.filter((product) => `${product.name} ${product.description ?? ""} ${product.category}`.toLowerCase().includes(query))
      : products;

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-2xl border border-border/80 bg-card/75 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.06)] sm:rounded-3xl sm:p-7">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Category</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">{category}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Showing {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-10 items-center rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:-translate-y-0.5"
        >
          Back Home
        </Link>
      </section>

      <ProductGrid products={filteredProducts} />
    </div>
  );
}
