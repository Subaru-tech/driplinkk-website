import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Spec §3.1.2 — centred, max-width 800px. text-3xl headline, text-lg muted
   subhead, CTAs side by side. The background mesh sits at 15% opacity behind
   the text so it never competes with it. */

export function Hero({
  eyebrow,
  headline,
  subhead,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  headline: string;
  subhead: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      {/* The mesh swells and dims as the hero exits — a slow rack-focus off the
          title card. Scroll-linked in CSS; see `.hero-swell` in globals.css. */}
      <div
        aria-hidden="true"
        className="hero-mesh hero-swell pointer-events-none absolute inset-0 opacity-15"
      />
      {/* Fade the mesh into the page so the band has no hard edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-canvas"
      />

      <div className="hero-pull relative mx-auto flex max-w-[50rem] flex-col items-center gap-6 px-6 py-24 text-center md:py-32">
        {eyebrow}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-fg">
          {headline}
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-muted">{subhead}</p>
        {actions ? (
          <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
