import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductGrid from "@/components/ProductGrid";
import { getCategoryHref } from "@/lib/categories";

type CategoryBlockProps = {
  category: string;
  products: Product[];
  index: number;
};

function padNumber(value: number) {
  return value.toString().padStart(2, "0");
}

export default function CategoryBlock({ category, products, index }: CategoryBlockProps) {
  return (
    <section className="soft-panel space-y-4 rounded-2xl border border-border/80 p-4 sm:space-y-5 sm:rounded-3xl sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Category {padNumber(index + 1)}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-3xl">{category}</h2>
        </div>
        <Link
          href={getCategoryHref(category)}
          className="inline-flex min-h-10 items-center rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:-translate-y-0.5"
        >
          View More
        </Link>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
