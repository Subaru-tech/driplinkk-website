import { PlugZap } from "lucide-react";

/**
 * Shown across the dashboard while Supabase isn't connected (Track 2).
 *
 * The spec's standing rule is that no panel may show fabricated data. This
 * banner is the honest counterpart: every panel below is showing its real
 * empty state because there is genuinely nothing to read, and the user is told
 * so explicitly rather than being left to assume their account is empty.
 */
export function BackendNotice() {
  return (
    <div className="mb-6 flex gap-3 rounded-[var(--radius-card)] border border-info/40 bg-info-muted p-4">
      <PlugZap className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-fg">Backend not connected</p>
        <p className="text-sm text-muted">
          Set <code className="font-mono text-xs text-fg">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono text-xs text-fg">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to load
          real data. Every panel below is showing its real empty state — nothing here is sample
          data.
        </p>
      </div>
    </div>
  );
}
