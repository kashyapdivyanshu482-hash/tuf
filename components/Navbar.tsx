"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { CartDrawer } from "@/components/cart-drawer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { categories, getCategoryHref, toCategorySlug } from "@/lib/categories";

export default function Navbar() {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/category/") ? pathname.split("/")[2] : null;
  const searchAction = pathname.startsWith("/category/") ? pathname : "/";

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="app-container flex flex-col gap-2 border-b border-border/80 bg-background/96 py-2 backdrop-blur-xl sm:gap-4 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
            <span className="inline-flex h-[clamp(1.75rem,7.2vw,2rem)] w-[clamp(1.75rem,7.2vw,2rem)] items-center justify-center rounded-full border border-border bg-card text-[clamp(0.56rem,2.2vw,0.75rem)] font-semibold">
              T
            </span>
            <span className="text-[clamp(0.62rem,2.6vw,1rem)] font-semibold tracking-[0.14em] sm:tracking-[0.22em]">TUF CLOTHING</span>
          </Link>
          <div className="hidden flex-1 md:flex md:max-w-lg">
            <form action={searchAction} className="w-full">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search pieces..."
                  className="h-[clamp(2.25rem,5vw,2.75rem)] rounded-full border-border/80 bg-card pl-[clamp(2.1rem,5vw,2.4rem)]"
                  aria-label="Search products"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <ThemeToggle />
            <CartDrawer />
          </div>
        </div>

        <div className="md:hidden">
          <form action={searchAction} className="w-full">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search pieces..."
                className="h-[clamp(2.05rem,8vw,2.4rem)] rounded-full border-border/80 bg-card pl-[clamp(2rem,8vw,2.35rem)] text-[clamp(0.74rem,3vw,0.88rem)]"
                aria-label="Search products"
              />
            </div>
          </form>
        </div>

        <nav className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 text-[clamp(0.5rem,2vw,0.75rem)] uppercase tracking-[0.12em] sm:flex-wrap sm:overflow-visible sm:gap-2">
          {categories.map((category) => {
            const isActive = activeSlug === toCategorySlug(category);
            return (
              <Link
                key={category}
                href={getCategoryHref(category)}
                className={`shrink-0 rounded-full border px-[clamp(0.5rem,2.3vw,0.75rem)] py-[clamp(0.2rem,1.1vw,0.35rem)] transition hover:-translate-y-0.5 sm:px-3 sm:py-1.5 ${
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/80 bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                {category}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
