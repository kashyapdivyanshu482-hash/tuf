import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Banner } from "@/lib/types";

type HeroProps = {
  banners: Banner[];
};

export default function Hero({ banners }: HeroProps) {
  return (
    <section className="mb-10 grid gap-3 sm:gap-4 md:mb-12 md:grid-cols-12">
      {banners.slice(0, 3).map((banner, idx) => (
        <Link
          key={banner.id}
          href={banner.link_to || "/"}
          className={`group relative overflow-hidden rounded-2xl border border-border shadow-[0_8px_30px_rgba(0,0,0,0.08)] ${
            idx === 0
              ? "min-h-[clamp(13.5rem,58vw,22.5rem)] md:col-span-7"
              : "min-h-[clamp(9.5rem,42vw,13.75rem)] md:col-span-5"
          }`}
        >
          <img
            src={`${banner.image_url}?auto=format&fit=crop&w=1000&q=80`}
            alt={banner.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
          <div className="relative flex h-full flex-col justify-end p-4 text-white sm:p-6 md:p-7">
            <h2
              className={`font-semibold tracking-wide ${
                idx === 0
                  ? "text-[clamp(1.05rem,4.7vw,2.25rem)]"
                  : "text-[clamp(0.88rem,3.4vw,1.5rem)]"
              }`}
            >
              {banner.title}
            </h2>
            {banner.subtitle ? <p className="mt-2 max-w-md text-sm text-white/85 md:text-base">{banner.subtitle}</p> : null}
            <span className="mt-5 inline-flex items-center gap-1 text-sm uppercase tracking-wide">
              Shop now <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
