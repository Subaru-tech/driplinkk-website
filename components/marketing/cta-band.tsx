import { Reveal } from "@/components/marketing/reveal";
import { WaitlistForm } from "@/components/marketing/waitlist-form";

/**
 * Shared CTA band — spec §3.1.6, reused at the bottom of every product page
 * (§3.2.5).
 */
export function CtaBand({
  title = "Get early access",
  description = "DripLink is in active build. Join the waitlist and we'll bring you in as soon as there's something worth your time.",
  /** Drop the panel background so a glow behind it can show through. */
  bare = false,
}: {
  title?: string;
  description?: string;
  bare?: boolean;
}) {
  return (
    <section className={bare ? "border-t border-line" : "border-y border-line bg-surface"}>
      <Reveal className="mx-auto flex max-w-content flex-col items-center gap-6 px-6 py-16 text-center md:py-24 lg:px-12">
        <h2 className="font-display text-xl font-semibold text-balance text-fg">{title}</h2>
        <p className="max-w-xl text-base text-muted">{description}</p>
        <WaitlistForm className="items-center" />
      </Reveal>
    </section>
  );
}
