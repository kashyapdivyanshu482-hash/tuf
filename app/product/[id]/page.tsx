import { notFound } from "next/navigation";
import ProductDetailExperience from "@/components/ProductDetailExperience";
import ProductSuggestions from "@/components/ProductSuggestions";
import { fallbackProducts } from "@/lib/mock-data";
import { getProductDetailContent } from "@/lib/product-content";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  let product: Product | null = fallbackProducts.find((item) => item.id === id) ?? null;
  let allProducts: Product[] = fallbackProducts;

  const supabase = await createClient();
  if (supabase) {
    const [{ data }, { data: allData }] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase.from("products").select("*"),
    ]);
    if (data) product = data;
    if (allData?.length) allProducts = allData;
  }

  if (!product) notFound();

  const details = getProductDetailContent(product);
  const suggestions = allProducts
    .filter((item) => item.id !== product.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);

  return (
    <div className="min-w-0 space-y-[clamp(1rem,4vw,3rem)]">
      <ProductDetailExperience product={product} details={details} />
      <ProductSuggestions products={suggestions} />
    </div>
  );
}
