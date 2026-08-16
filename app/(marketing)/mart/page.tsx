import type { Metadata } from "next";
import { BadgeIndianRupee, PackageCheck, ShieldCheck, Truck, Upload, Users } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Hero } from "@/components/marketing/hero";
import { Reveal } from "@/components/marketing/reveal";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Mart",
  description: "Send any finished model to a vetted printer. One price, tracked to your door.",
};

const features = [
  {
    icon: Users,
    title: "Vetted printers",
    description: "A reviewed network, not an open marketplace. Every printer is checked before it takes a job.",
  },
  {
    icon: BadgeIndianRupee,
    title: "One price up front",
    description: "Material, print time and delivery quoted together. No surprise line items at checkout.",
  },
  {
    icon: ShieldCheck,
    title: "Reprinted if it fails",
    description: "If a print comes out wrong on our side, it gets reprinted. You don't pay twice.",
  },
  {
    icon: Truck,
    title: "Tracked end to end",
    description: "Follow the job from confirmed to printing to shipped, without emailing anyone.",
  },
];

/* Spec §3.2.4 — for Mart, a simple 3-step visual (upload → order → delivered). */
const flow = [
  { icon: Upload, title: "Upload", description: "Send a model from LeaFF OS or upload your own file." },
  { icon: PackageCheck, title: "Order", description: "Pick material and finish, confirm the quoted price." },
  { icon: Truck, title: "Delivered", description: "It's printed, checked and shipped to your address." },
];

export default function MartPage() {
  return (
    <>
      <Hero
        eyebrow={
          <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
            Mart
          </span>
        }
        headline="Get it printed without finding a printer."
        subhead="Send a finished model to a vetted print shop, at a quoted price, tracked from confirmation to delivery."
        actions={
          <ButtonLink href="/signup" size="lg">
            Join Waitlist
          </ButtonLink>
        }
      />

      <Section tone="surface">
        <SectionHeading eyebrow="Why Mart" title="The part of printing nobody wants to manage." />
        <div className="mt-12">
          <FeatureGrid features={features} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="How it works" title="Three steps." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {flow.map((step, index) => (
            <Reveal
              key={step.title}
              variant="layer"
              index={index}
              className="cad-brackets relative flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-[var(--radius-control)] bg-accent-muted text-accent">
                  <step.icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="font-mono text-sm text-faint">0{index + 1}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-lg font-medium text-fg">{step.title}</h3>
                <p className="text-sm text-pretty text-muted">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
