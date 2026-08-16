import { ArrowDown } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PrintCanvas } from "@/components/marketing/print-canvas";

/**
 * Full-viewport hero. Layered back to front:
 *   void backdrop → drifting rim lights → the printer → vignette →
 *   text scrim → copy.
 *
 * The machine stays centred as a background element rather than taking a
 * whole column. Legibility over it comes from a radial scrim behind the copy,
 * not from pushing the machine aside.
 *
 * There is deliberately no page-wide grid: the only grid in the scene is the
 * printer's own build surface, directly under the tree.
 */
export function CinematicHero() {
  return (
    <section className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-void">
      {/* Key + fill lights, drifting slowly so a still frame never feels dead */}
      <div
        aria-hidden="true"
        className="glow-accent drift absolute top-0 left-1/2 aspect-square w-[80vw] max-w-4xl -translate-x-1/2 opacity-40"
      />
      <div
        aria-hidden="true"
        className="glow-accent-2 absolute -bottom-1/4 left-1/2 aspect-square w-[70vw] max-w-3xl -translate-x-1/2 opacity-50"
      />

      {/* The machine, printing. Full opacity — the previous pass dimmed it to
          80% on top of already-faint strokes and the whole thing washed out. */}
      <PrintCanvas className="absolute inset-0 size-full" />

      {/* Seat it into the page */}
      <div aria-hidden="true" className="vignette absolute inset-0" />

      {/* Tighter top padding on small screens — every pixel reclaimed here is
          a pixel the machine below doesn't have to give up. */}
      <div className="relative mx-auto flex w-full max-w-content flex-col items-center px-6 pt-16 pb-32 text-center lg:items-start lg:px-12 lg:pt-24 lg:text-left">
        <div className="flex flex-col items-center lg:max-w-xl lg:items-start">
          <p className="hero-pull tech-label mb-8 text-accent-2">
            Idea &nbsp;→&nbsp; Geometry &nbsp;→&nbsp; Part
          </p>

          {/* Hand-broken on desktop — text-balance orphaned "it," onto its own
              line. Below lg the breaks are dropped: three forced lines get tall
              enough at tablet width to collide with the machine below it. */}
          <h1 className="hero-pull display-xl font-display text-balance text-fg lg:text-pretty">
            Design it,
            <br className="hidden lg:inline" />
            {" "}refine it,
            <br className="hidden lg:inline" />
            {" "}<span className="text-accent-gradient">print it.</span>
          </h1>

          <p className="hero-pull mt-8 max-w-md text-lg text-pretty text-muted">
            One pipeline from idea to printed part. Generate a model, make it manufacturable, and
            send it to a printer — without ever switching tools.
          </p>

          <div className="hero-pull mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/signup" size="lg">
              Join Waitlist
            </ButtonLink>
            <ButtonLink href="#problem" variant="secondary" size="lg">
              See how it works
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#problem"
        className="absolute inset-x-0 bottom-8 mx-auto flex w-fit flex-col items-center gap-2 text-faint transition-colors hover:text-fg"
      >
        <span className="font-mono text-[0.625rem] tracking-[0.2em] uppercase">Scroll</span>
        <ArrowDown className="size-4 animate-bounce" aria-hidden="true" />
      </a>
    </section>
  );
}
