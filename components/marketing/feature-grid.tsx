import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { Card } from "@/components/ui/card";

/* Spec §3.2.3 — 4–6 cards max. Icon + title + 1–2 lines.
   Resist listing every feature; pick the ones that sell. */

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <Reveal key={feature.title} variant="layer" index={index % 3} className="h-full">
          <Card className="cad-brackets relative flex h-full flex-col gap-4">
            <span className="grid size-10 place-items-center rounded-[var(--radius-control)] bg-accent-muted text-accent">
              <feature.icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-lg font-medium text-fg">{feature.title}</h3>
              <p className="text-sm text-pretty text-muted">{feature.description}</p>
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}
