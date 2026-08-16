import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";
import { Card } from "@/components/ui/card";

/* Spec §3.1.4 — icon, title, 2-line description, "Learn more →".
   Equal-height cards, consistent icon size.

   Motion: the card wipes in bottom-up like a printed layer, staggered across
   the row, and drafting brackets draw onto two corners as it lands. */

export function PillarCard({
  icon: Icon,
  title,
  description,
  href,
  badge,
  index = 0,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  badge?: string;
  /** Stagger position, so a row of pillars lands in sequence. */
  index?: number;
}) {
  return (
    <Reveal variant="layer" index={index} className="h-full">
      <Card interactive className="cad-brackets group relative flex h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-[var(--radius-control)] bg-accent-muted text-accent">
            <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          {badge ? (
            <span className="rounded-full bg-raised px-2.5 py-1 text-xs font-medium text-muted">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="font-display text-lg font-medium text-fg">{title}</h3>
          <p className="text-sm text-pretty text-muted">{description}</p>
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          Learn more
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </Card>
    </Reveal>
  );
}
