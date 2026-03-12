import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

type ProductSuggestionsProps = {
  products: Product[];
};

export default function ProductSuggestions({ products }: ProductSuggestionsProps) {
  if (!products.length) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Suggestions</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">You May Also Like</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
        {products.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
