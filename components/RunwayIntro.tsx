import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCategoryHref } from "@/lib/categories";

export default function RunwayIntro() {
  return (
    <section className="reveal-up grid gap-4 lg:grid-cols-12">
      <div className="soft-panel rounded-3xl border border-border/80 p-5 sm:p-6 lg:col-span-8 lg:p-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">TUF Signature</p>
        <h1 className="mt-4 text-3xl font-semibold leading-[0.95] tracking-tight sm:text-5xl lg:text-7xl">
          MONOCHROME
          <span className="headline-outline block">PERFORMANCE</span>
          WEAR
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          A high-end utility wardrobe built for daily intensity. Structured silhouettes, premium fabrics, and clean cuts
          engineered to move from training to street seamlessly.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
          <Link
            href={getCategoryHref("New Arrivals")}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-background sm:px-5 sm:text-xs sm:tracking-[0.14em]"
          >
            Explore New Drop <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href={getCategoryHref("Unisex")}
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] sm:px-5 sm:text-xs sm:tracking-[0.14em]"
          >
            Shop Unisex
          </Link>
        </div>
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
        <div className="soft-panel rounded-3xl border border-border/80 p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Design Code</p>
          <p className="mt-3 text-lg font-semibold tracking-tight sm:text-xl">Sharp tailoring with sports utility.</p>
        </div>
        <div className="soft-panel rounded-3xl border border-border/80 p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Material Focus</p>
          <p className="mt-3 text-lg font-semibold tracking-tight sm:text-xl">300GSM cotton, technical blends, and airflow mesh.</p>
        </div>
        <div className="soft-panel rounded-3xl border border-border/80 p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Identity</p>
          <p className="mt-3 text-lg font-semibold tracking-tight sm:text-xl">Minimal by look, bold by presence.</p>
        </div>
      </div>
    </section>
  );
}
