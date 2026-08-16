import type { LucideIcon } from "lucide-react";

/* Spec §3.1.5 — 3-step horizontal timeline on desktop, vertical stack on
   mobile. Numbered circles connected by a line. */

export type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function HowItWorks({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
      {/* The connecting line — desktop runs horizontally behind the circles,
          mobile runs vertically down their centre. */}
      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-5 w-px bg-line md:top-5 md:right-0 md:bottom-auto md:left-0 md:h-px md:w-auto"
      />

      {/* …and an accent fill laid over it that tracks scroll position, so the
          line draws itself as you read down the steps. */}
      <div
        aria-hidden="true"
        className="step-rail-fill absolute top-0 bottom-0 left-5 w-px bg-accent md:top-5 md:right-0 md:bottom-auto md:left-0 md:h-px md:w-auto"
      />

      {steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-4 md:flex-col md:gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface font-mono text-sm text-accent">
            {index + 1}
          </span>
          <div className="flex flex-col gap-2 md:pr-6">
            <div className="flex items-center gap-2">
              <step.icon className="size-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              <h3 className="font-display text-base font-medium text-fg">{step.title}</h3>
            </div>
            <p className="text-sm text-pretty text-muted">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
