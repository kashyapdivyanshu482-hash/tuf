import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Mail } from "lucide-react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/components/cart-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TUF Clothing",
  description: "High-performance minimalist apparel",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <CartProvider>
            <Navbar />
            <main className="app-container pb-20 pt-3 sm:pt-8 lg:pt-10">{children}</main>
            <footer className="app-container border-t border-border/80 pb-6 pt-4 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <Link className="hover:text-foreground" href="/terms-and-conditions">
                  Terms and Conditions
                </Link>
                <Link className="hover:text-foreground" href="/privacy-policy">
                  Privacy Policy
                </Link>
              </div>
            </footer>
            <a
              href="mailto:tufclothing@proton.me"
              aria-label="Contact TUF Clothing by email"
              className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-foreground shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.22)] sm:bottom-6 sm:right-6"
            >
              <Mail className="h-3.5 w-3.5" />
              Contact Us
            </a>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
