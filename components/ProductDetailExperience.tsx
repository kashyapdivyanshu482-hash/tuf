"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import type { ProductDetailContent } from "@/lib/product-content";
import { formatINR } from "@/lib/currency";
import { getPriceMeta, getTaxInclusivePriceMeta, getTaxInclusiveUnitPrice } from "@/lib/pricing";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";

type ProductDetailExperienceProps = {
  product: Product;
  details: ProductDetailContent;
};

const fallbackImage = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80";

export default function ProductDetailExperience({ product, details }: ProductDetailExperienceProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchPaused, setIsTouchPaused] = useState(false);
  const [hoverPoint, setHoverPoint] = useState({ x: 50, y: 50 });

  const sizeOptions = useMemo(() => Object.entries(details.sizePrices), [details.sizePrices]);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0]?.[0] ?? "M");
  const selectedPrice = Math.round(details.sizePrices[selectedSize] ?? Number(product.price));
  const selectedPriceMeta = getPriceMeta(selectedPrice);
  const selectedDisplayPriceMeta = getTaxInclusivePriceMeta(selectedPrice);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovering && !isTouchPaused) {
        setCurrentImage((prev) => (prev + 1) % details.images.length);
      }
    }, 2200);
    return () => clearInterval(timer);
  }, [details.images.length, isHovering, isTouchPaused]);

  const onImageHoverMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setHoverPoint({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleAddToCart = () => {
    addToCart(product, { selectedSize, unitPrice: selectedPriceMeta.discountedPrice });
  };

  const handleBuyNow = () => {
    addToCart(product, { selectedSize, unitPrice: selectedPriceMeta.discountedPrice });
    router.push("/checkout");
  };

  return (
    <section className="grid w-full min-w-0 gap-[clamp(0.75rem,2.8vw,1.5rem)] pb-28 lg:grid-cols-12 lg:pb-0">
      <div className="soft-panel min-w-0 lg:col-span-7 rounded-[clamp(0.85rem,3.5vw,1.5rem)] border border-border/80 p-[clamp(0.55rem,2.3vw,1rem)]">
        <div
          className="relative overflow-hidden rounded-[clamp(0.7rem,3vw,1rem)]"
          style={{ height: "clamp(17rem, 74vw, 40rem)" }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={onImageHoverMove}
          onTouchStart={() => setIsTouchPaused(true)}
          onTouchEnd={() => setIsTouchPaused(false)}
        >
          <img
            src={`${details.images[currentImage]}?auto=format&fit=crop&w=1400&q=80`}
            alt={`${product.name} image ${currentImage + 1}`}
            className="h-full w-full object-cover transition duration-300"
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
            style={{
              transform: isHovering ? "scale(1.55)" : "scale(1)",
              transformOrigin: `${hoverPoint.x}% ${hoverPoint.y}%`,
            }}
          />
          <div className="absolute bottom-[clamp(0.55rem,2vw,0.9rem)] left-[clamp(0.55rem,2vw,0.9rem)] rounded-full bg-black/55 px-[clamp(0.55rem,2vw,0.75rem)] py-[clamp(0.18rem,0.7vw,0.3rem)] text-[clamp(0.58rem,2vw,0.72rem)] text-white">
            {isHovering ? "Zoom Active - Slider Paused" : isTouchPaused ? "Slider Paused" : "Auto Run Active"}
          </div>
        </div>

        <div className="mt-[clamp(0.5rem,1.8vw,0.8rem)] flex justify-center gap-1.5 sm:hidden">
          {details.images.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              onClick={() => setCurrentImage(index)}
              className={`h-[clamp(0.28rem,1.1vw,0.35rem)] rounded-full transition-all ${
                index === currentImage ? "w-[clamp(0.95rem,4vw,1.35rem)] bg-foreground" : "w-[clamp(0.28rem,1.1vw,0.35rem)] bg-border"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>

        <div className="no-scrollbar mt-[clamp(0.55rem,2vw,0.8rem)] hidden gap-2 overflow-x-auto sm:flex">
          {details.images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onMouseEnter={() => {
                setCurrentImage(index);
                setIsHovering(true);
              }}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => setCurrentImage(index)}
              className={`relative overflow-hidden rounded-lg border ${
                index === currentImage ? "border-foreground" : "border-border/80"
              }`}
              style={{
                height: "clamp(3rem, 10vw, 5rem)",
                minWidth: "clamp(3rem, 10vw, 5rem)",
              }}
            >
              <img
                src={`${image}?auto=format&fit=crop&w=400&q=70`}
                alt={`thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="soft-panel min-w-0 lg:col-span-5 rounded-[clamp(0.85rem,3.5vw,1.5rem)] border border-border/80 p-[clamp(0.8rem,2.8vw,1.8rem)]">
        <div className="min-w-0 space-y-[clamp(0.5rem,1.8vw,0.8rem)]">
          <p className="text-[clamp(0.6rem,2.1vw,0.72rem)] uppercase tracking-[0.16em] text-muted-foreground">Product Details</p>
          <h1 className="text-[clamp(1.15rem,5.2vw,2.35rem)] font-semibold leading-[1.05] tracking-tight">{product.name}</h1>
          <p className="text-[clamp(0.78rem,2.9vw,1rem)] leading-relaxed text-muted-foreground">
            {product.description || "Minimal, premium, and engineered for movement through every daily setting."}
          </p>
        </div>

        <div className="mt-[clamp(0.7rem,2.6vw,1.2rem)] min-w-0 grid gap-[clamp(0.35rem,1.3vw,0.55rem)] rounded-[clamp(0.7rem,2.8vw,1rem)] border border-border/80 bg-card/70 p-[clamp(0.65rem,2.2vw,0.95rem)] text-[clamp(0.7rem,2.4vw,0.88rem)]">
          <div className="min-w-0 grid grid-cols-[30%_1fr] gap-2">
            <span className="text-muted-foreground">Fabric</span>
            <span className="break-words text-right font-medium">{details.fabric}</span>
          </div>
          <div className="min-w-0 grid grid-cols-[30%_1fr] gap-2">
            <span className="text-muted-foreground">Printed Type</span>
            <span className="break-words text-right font-medium">{details.printType}</span>
          </div>
          <div className="min-w-0 grid grid-cols-[30%_1fr] gap-2">
            <span className="text-muted-foreground">Category</span>
            <span className="break-words text-right font-medium">{product.category}</span>
          </div>
        </div>

        <div className="mt-[clamp(0.7rem,2.5vw,1.2rem)]">
          <p className="mb-[clamp(0.35rem,1.4vw,0.55rem)] text-[clamp(0.6rem,2.1vw,0.72rem)] uppercase tracking-[0.16em] text-muted-foreground">
            Select Size
          </p>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {sizeOptions.map(([size, price]) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`rounded-xl border text-left transition ${
                  selectedSize === size ? "border-foreground bg-foreground text-background" : "border-border/80 bg-card"
                }`}
                style={{
                  minWidth: "clamp(4.35rem, 20vw, 6rem)",
                  padding: "clamp(0.45rem,1.8vw,0.62rem) clamp(0.55rem,2vw,0.75rem)",
                }}
              >
                <span className="block text-[clamp(0.7rem,2.6vw,0.9rem)] font-semibold">{size}</span>
                <span className={`text-[clamp(0.6rem,2vw,0.72rem)] ${selectedSize === size ? "text-background/85" : "text-muted-foreground"}`}>
                  {formatINR(getTaxInclusiveUnitPrice(Math.round(price)))}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-[clamp(0.7rem,2.5vw,1.2rem)] rounded-[clamp(0.7rem,2.8vw,1rem)] border border-border/80 bg-card/70 p-[clamp(0.65rem,2.2vw,0.95rem)]">
          <p className="text-[clamp(0.72rem,2.4vw,0.88rem)] text-muted-foreground">Price for selected size (incl. taxes)</p>
          <p className="mt-0.5 text-[clamp(0.72rem,2.2vw,0.88rem)] text-muted-foreground line-through">
            {formatINR(selectedDisplayPriceMeta.originalPrice)}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[clamp(1.2rem,4.8vw,2rem)] font-semibold text-accent">
              {formatINR(selectedDisplayPriceMeta.discountedPrice)}
            </p>
            <span className="rounded-full bg-foreground px-2 py-0.5 text-[0.62rem] font-semibold text-background">
              {selectedDisplayPriceMeta.discountPercent}% OFF
            </span>
          </div>
        </div>

        <div className="mt-[clamp(0.65rem,2.2vw,1rem)] grid grid-cols-2 gap-2 text-[clamp(0.68rem,2.3vw,0.82rem)] text-muted-foreground">
          <div className="inline-flex items-center gap-1.5">
            <Truck className="h-4 w-4" />
            Free Shipping
          </div>
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Secure Checkout
          </div>
        </div>

        <div className="mt-[clamp(0.8rem,2.8vw,1.3rem)] hidden grid-cols-2 gap-3 sm:grid">
          <Button className="h-[clamp(2.35rem,6.5vw,2.8rem)] rounded-full" onClick={handleAddToCart}>
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </Button>
          <Button variant="outline" className="h-[clamp(2.35rem,6.5vw,2.8rem)] rounded-full" onClick={handleBuyNow}>
            Buy Now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur sm:hidden">
        <div className="app-container flex items-center gap-2 px-0">
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">Size {selectedSize}</p>
            <p className="truncate text-[clamp(0.84rem,3vw,1rem)] font-semibold text-accent">
              {formatINR(selectedDisplayPriceMeta.discountedPrice)}
            </p>
          </div>
          <Button className="h-[clamp(2.2rem,9vw,2.6rem)] rounded-full px-[clamp(0.7rem,3vw,1rem)]" onClick={handleAddToCart}>
            Add
          </Button>
          <Button
            variant="outline"
            className="h-[clamp(2.2rem,9vw,2.6rem)] rounded-full px-[clamp(0.7rem,3vw,1rem)]"
            onClick={handleBuyNow}
          >
            Buy
          </Button>
        </div>
      </div>
    </section>
  );
}
