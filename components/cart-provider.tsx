"use client";

import * as React from "react";
import type { Product } from "@/lib/types";

type CartItem = {
  product: Product;
  quantity: number;
  selectedSize?: string;
  unitPrice?: number;
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addToCart: (product: Product, options?: { selectedSize?: string; unitPrice?: number }) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  clearCart: () => void;
};

const CartContext = React.createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "tuf-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CartItem[];
      setItems(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, options?: { selectedSize?: string; unitPrice?: number }) => {
    const selectedSize = options?.selectedSize;
    const unitPrice = options?.unitPrice;
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.selectedSize === selectedSize);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + 1, unitPrice: unitPrice ?? item.unitPrice }
            : item,
        );
      }
      return [...prev, { product, quantity: 1, selectedSize, unitPrice }];
    });
  };

  const removeFromCart = (productId: string, selectedSize?: string) => {
    setItems((prev) => prev.filter((item) => !(item.product.id === productId && item.selectedSize === selectedSize)));
  };

  const updateQuantity = (productId: string, quantity: number, selectedSize?: string) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId && item.selectedSize === selectedSize
            ? { ...item, quantity: Math.max(1, quantity) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const total = items.reduce((acc, item) => acc + Number(item.unitPrice ?? item.product.price) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, total, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
