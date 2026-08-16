import type { Metadata } from "next";
import { Boxes, Download, GitBranch, Ruler, Sparkles, Wrench } from "lucide-react";
import { AssetSlot } from "@/components/marketing/asset-slot";
import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Hero } from "@/components/marketing/hero";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "LeaFF OS",
  description:
    "The desktop workspace where a described part becomes a real, editable, printable model.",
};

const features = [
  {
    icon: Sparkles,
    title: "Describe it, get geometry",
    description:
      "Type what the part needs to do. LeaFF OS returns real geometry, not a mesh you have to rebuild by hand.",
  },
  {
    icon: Ruler,
    title: "Dimensions that hold",
    description:
      "Every feature stays parametric. Change a bore or a wall thickness and the rest of the model keeps up.",
  },
  {
    icon: Wrench,
    title: "Built for manufacturing",
    description:
      "Overhangs, wall minimums and tolerances are checked as you work, not after a failed print.",
  },
  {
    icon: GitBranch,
    title: "Versions you can go back to",
    description: "Every refinement is a step you can return to, compare against, or branch from.",
  },
  {
    icon: Boxes,
    title: "One click to Mart",
    description: "Send the finished model straight to a vetted printer without exporting anything.",
  },
  {
    icon: Download,
    title: "Your files, exportable",
    description: "STL, STEP and 3MF on the way out. Nothing is locked inside the workspace.",
  },
];

export default function LeaffOsPage() {
  return (
    <>
      <Hero
        eyebrow={
          <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
            LeaFF OS
          </span>
        }
        headline="The workspace between an idea and a printable part."
        subhead="Generate real geometry from a description, then refine it with tools that understand how the thing actually gets made."
        actions={
          <ButtonLink href="/signup" size="lg">
            Join Waitlist
          </ButtonLink>
        }
      />

      <Section tone="surface">
        <SectionHeading
          eyebrow="What it does"
          title="Enough CAD to be useful. None of the learning curve."
        />
        <div className="mt-12">
          <FeatureGrid features={features} />
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="The real thing"
          title="This is the actual workspace."
          description="Not a concept render — this is LeaFF OS as it stands today."
        />
        <div className="mt-12">
          <AssetSlot label="Screen recording of the LeaFF OS workspace" />
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
