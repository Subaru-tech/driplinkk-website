import { PlugZap } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * Shown across the dashboard while the data layer can't answer (Track 2).
 *
 * The spec's standing rule is that no panel may show fabricated data. This
 * banner is the honest counterpart: every panel below is showing its real
 * empty state because there is genuinely nothing to read.
 *
 * There are two different reasons for that, and saying the wrong one sends
 * people to fix a setting that was never broken. So the two are distinguished:
 * no keys is a website problem, no schema is a backend-repo problem.
 */
export function BackendNotice() {
  return (
    <div className="mb-6 flex gap-3 rounded-[var(--radius-card)] border border-info/40 bg-info-muted p-4">
      <PlugZap className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-fg">
          {isSupabaseConfigured ? "Database schema not deployed" : "Backend not connected"}
        </p>
        <p className="text-sm text-muted">
          {isSupabaseConfigured ? (
            <>
              Supabase is connected, but the tables these panels read don&apos;t exist yet. Run{" "}
              <code className="font-mono text-xs text-fg">npx supabase db push</code> in the
              backend repo to deploy the schema. Every panel below is showing its real empty
              state — nothing here is sample data.
            </>
          ) : (
            <>
              Set <code className="font-mono text-xs text-fg">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono text-xs text-fg">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
              to load real data. Every panel below is showing its real empty state — nothing here
              is sample data.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
