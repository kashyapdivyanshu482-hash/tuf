import Hero from "@/components/Hero";
import MarqueeStrip from "@/components/MarqueeStrip";
import RunwayIntro from "@/components/RunwayIntro";
import ProductGrid from "@/components/ProductGrid";
import CategoryBlock from "@/components/CategoryBlock";
import { categories } from "@/lib/categories";
import { fallbackBanners, fallbackProducts } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Banner, Product } from "@/lib/types";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const selectedCategory = getSingleValue(params.category);
  const query = getSingleValue(params.q)?.toLowerCase() ?? "";

  let banners: Banner[] = fallbackBanners;
  let products: Product[] = fallbackProducts;

  const supabase = await createClient();
  if (supabase) {
    const { data: bannerData } = await supabase.from("banners").select("*").limit(3);
    const { data: productData } = await supabase.from("products").select("*").order("created_at", { ascending: false });

    if (bannerData?.length) banners = bannerData;
    if (productData?.length) products = productData;
  }

  const filteredProducts = products.filter((product) => {
    const byCategory = selectedCategory ? product.category === selectedCategory : true;
    const byQuery =
      query.length > 0
        ? `${product.name} ${product.description ?? ""} ${product.category}`.toLowerCase().includes(query)
        : true;
    return byCategory && byQuery;
  });

  return (
    <div className="space-y-8 sm:space-y-12">
      <RunwayIntro />
      <Hero banners={banners} />
      <div className="hidden space-y-0 sm:block">
        <MarqueeStrip text="TUF CLOTHING - ENGINEERED FOR PERFORMANCE - PREMIUM MINIMAL APPAREL" />
        <MarqueeStrip text="NEW ARRIVALS WEEKLY - PAN INDIA DELIVERY - SECURE CHECKOUT" reverse />
      </div>
      {selectedCategory || query ? (
        <>
          <section className="rounded-2xl border border-border/80 bg-card/75 p-6 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
            <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedCategory ? `Showing ${selectedCategory}` : "Showing all categories"}
            </p>
          </section>
          <ProductGrid products={filteredProducts} />
        </>
      ) : (
        <section className="space-y-8 pb-6 sm:space-y-12 sm:pb-8">
          <section className="soft-panel hidden rounded-3xl border border-border/80 p-6 sm:block sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Brand Statement</p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Built for high-rotation wardrobes with runway-level restraint.
            </h3>
            <div className="mt-5 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <p>Precision cuts for cleaner drape and elevated shoulder profile.</p>
              <p>Performance-first textiles that hold shape through heavy use.</p>
              <p>Monochrome color architecture for maximum outfit compatibility.</p>
            </div>
          </section>

          {categories.map((category) => {
            const categoryProducts = products.filter((product) => product.category === category).slice(0, 3);
            if (categoryProducts.length === 0) return null;

            return <CategoryBlock key={category} category={category} products={categoryProducts} index={categories.indexOf(category)} />;
          })}

          <section className="soft-panel hidden space-y-5 rounded-3xl border border-border/80 p-6 sm:block sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Final Note</p>
            <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">Performance silhouette, luxury attitude.</h3>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Every drop balances form and function so your wardrobe stays clean, versatile, and ready across gym, travel,
              and city routines. Designed in a stark high-fashion visual language with practical comfort at the core.
            </p>
          </section>
        </section>
      )}
    </div>
  );
}
