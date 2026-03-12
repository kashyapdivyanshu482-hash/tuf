import type { Banner, Product } from "@/lib/types";

export const fallbackBanners: Banner[] = [
  {
    id: "banner-1",
    title: "TUF BEST SELLERS",
    subtitle: "Engineered for Performance.",
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    link_to: "/product/product-2",
  },
  {
    id: "banner-2",
    title: "NEW ARRIVALS",
    subtitle: "The Summer Drop is Here.",
    image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c",
    link_to: "/product/product-1",
  },
  {
    id: "banner-3",
    title: "SEASONAL SALE",
    subtitle: "Up to 50% Off.",
    image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
    link_to: "/product/product-3",
  },
];

export const fallbackProducts: Product[] = [
  {
    id: "product-1",
    name: "Heavyweight Boxy Tee",
    description: "Premium 300GSM cotton tee in off-white.",
    price: 45,
    category: "New Arrivals",
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    stock_quantity: 100,
    is_featured: true,
  },
  {
    id: "product-2",
    name: "Technical Cargo Pants",
    description: "Water-resistant fabric with 6-pocket design.",
    price: 120,
    category: "Unisex",
    image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1",
    stock_quantity: 50,
    is_featured: true,
  },
  {
    id: "product-3",
    name: "Performance Stringer",
    description: "Breathable mesh for high-intensity gym sessions.",
    price: 35,
    category: "Gymwear",
    image_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e",
    stock_quantity: 200,
    is_featured: false,
  },
];
