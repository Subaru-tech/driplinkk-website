import { Download, ExternalLink } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Spec §6.1 — primary CTA band.
 *
 * Both buttons are offered side by side on purpose. There is no reliable way
 * to detect whether the desktop app is installed, and the spec is explicit:
 * don't try to sniff it with JS tricks, just show both.
 */
export function StartModelCard() {
  return (
    <Card className="flex flex-col justify-between gap-6 border-accent/25 bg-gradient-to-br from-accent-muted/40 to-surface sm:flex-row sm:items-center">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-medium text-fg">Start a new model</h2>
        <p className="text-sm text-muted">
          Modelling happens in the LeaFF OS desktop app. Open it, or grab it if you haven&apos;t
          installed it yet.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
        <ButtonLink href="leaffos://new" prefetch={false}>
          <ExternalLink className="size-4" aria-hidden="true" />
          Open in App
        </ButtonLink>
        <ButtonLink href="/download" variant="secondary">
          <Download className="size-4" aria-hidden="true" />
          Download
        </ButtonLink>
      </div>
    </Card>
  );
}
