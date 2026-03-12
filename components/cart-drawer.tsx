"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatINR } from "@/lib/currency";
import { getCheckoutTotalsFromItems, getTaxInclusivePriceMeta } from "@/lib/pricing";

export function CartDrawer() {
  const router = useRouter();
  const { items, itemCount, removeFromCart, updateQuantity, clearCart } = useCart();

  const totals = useMemo(
    () =>
      getCheckoutTotalsFromItems(
        items.map((item) => ({
          quantity: item.quantity,
          unitPrice: Math.round(Number(item.unitPrice ?? item.product.price)),
        })),
      ),
    [items],
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open cart" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] text-background">
              {itemCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>{itemCount} item(s)</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex h-[calc(100%-170px)] flex-col gap-4 overflow-y-auto pr-1">
          {items.length === 0 ? <p className="text-sm text-muted-foreground">Your cart is empty.</p> : null}
          {items.map(({ product, quantity, selectedSize, unitPrice }) => {
            const priceMeta = getTaxInclusivePriceMeta(Number(unitPrice ?? product.price));
            return (
              <div key={`${product.id}-${selectedSize ?? "nosize"}`} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="line-through">{formatINR(priceMeta.originalPrice)}</span>{" "}
                      <span className="font-semibold text-accent">{formatINR(priceMeta.discountedPrice)}</span>
                      {selectedSize ? ` - Size ${selectedSize}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(product.id, selectedSize)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => updateQuantity(product.id, quantity - 1, selectedSize)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => updateQuantity(product.id, quantity + 1, selectedSize)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span>Items Total (incl. taxes)</span>
            <span className="font-semibold">{formatINR(totals.subtotal + totals.taxAmount)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Shipping and payment charges are calculated at checkout.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={clearCart}>
              Clear
            </Button>
            <Button className="w-full" onClick={() => router.push("/checkout")}>
              Checkout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
