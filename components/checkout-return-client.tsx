"use client";

import { useEffect } from "react";

type CheckoutReturnClientProps = {
  clearCart: boolean;
};

export default function CheckoutReturnClient({ clearCart }: CheckoutReturnClientProps) {
  useEffect(() => {
    if (!clearCart) return;
    localStorage.removeItem("tuf-cart");
  }, [clearCart]);

  return null;
}
