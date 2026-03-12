"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/cart-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/currency";
import { getTaxInclusivePriceMeta } from "@/lib/pricing";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const priceMeta = getTaxInclusivePriceMeta(Number(product.price));

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/80 bg-card shadow-[0_10px_26px_rgba(0,0,0,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.12)]">
      <Link href={`/product/${product.id}`} className="relative block overflow-hidden">
        <img
          src={`${product.image_url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"}?auto=format&fit=crop&w=900&q=80`}
          alt={product.name}
          className="h-[clamp(10rem,44vw,18rem)] w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/18 to-transparent opacity-0 transition group-hover:opacity-100" />
      </Link>
      <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-wide">{product.name}</h3>
            <Badge className="bg-muted/70">{product.category}</Badge>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description || "Premium garment built for movement."}</p>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-[0.72rem] text-muted-foreground line-through">{formatINR(priceMeta.originalPrice)}</p>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-accent">{formatINR(priceMeta.discountedPrice)}</span>
              <span className="rounded-full bg-foreground px-2 py-0.5 text-[0.62rem] font-semibold text-background">
                {priceMeta.discountPercent}% OFF
              </span>
            </div>
            <p className="text-[0.68rem] text-muted-foreground">Inclusive of all taxes</p>
          </div>
          <Button size="sm" className="h-[clamp(1.9rem,7vw,2.25rem)] rounded-full px-[clamp(0.7rem,3vw,1rem)]" onClick={() => addToCart(product)}>
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
