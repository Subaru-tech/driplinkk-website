import type { Metadata } from "next";
import { Bell, CreditCard, FolderOpen, Truck } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Hero } from "@/components/marketing/hero";
import { Section, SectionHeading } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Mobile App",
  description: "Track prints, top up credits and browse your models from your phone. Coming soon.",
};

/* Spec §3.2.4 — for App, a "Coming Soon" badge is honest and sufficient.
   We deliberately do not fake screenshots of an unbuilt product, so this page
   has no visual-proof section at all. */

const planned = [
  {
    icon: Truck,
    title: "Print tracking",
    description: "See where every Mart order is without opening a laptop.",
  },
  {
    icon: Bell,
    title: "Status alerts",
    description: "A notification when a print is confirmed, shipped or needs your input.",
  },
  {
    icon: FolderOpen,
    title: "Your models",
    description: "Browse everything you've made and reorder a print in a couple of taps.",
  },
  {
    icon: CreditCard,
    title: "Credits",
    description: "Check your balance and top up before you're stuck mid-project.",
  },
];

export default function AppPage() {
  return (
    <>
      <Hero
        eyebrow={
          <span className="rounded-full bg-raised px-3 py-1 text-xs font-medium text-muted">
            Coming soon
          </span>
        }
        headline="DripLink in your pocket."
        subhead="The companion app for tracking prints and managing credits while you're away from the workspace. It isn't built yet — here's what it will do."
      />

      <Section tone="surface">
        <SectionHeading
          eyebrow="Planned"
          title="What we're building."
          description="This list is what's designed, not what's shipped. We'll show real screens when there are real screens to show."
        />
        <div className="mt-12">
          <FeatureGrid features={planned} />
        </div>
      </Section>

      <CtaBand
        title="Want it when it lands?"
        description="Join the waitlist and we'll tell you when the app is ready — and nothing else."
      />
    </>
  );
}
