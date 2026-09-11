import { MonitorSmartphone } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTime } from "@/lib/format";
import type { SessionRecord } from "@/lib/types";
import { RevokeSessionButton } from "@/components/dashboard/revoke-session-button";

/**
 * Spec §6.5 — active sessions, each revocable except the current one.
 *
 * Data sources per auth provider:
 *  - Clerk: real sessions, read server-side via the Backend API and passed in
 *    by the account page; "Revoke" calls the Clerk SDK client-side.
 *  - Supabase: supabase-js has no "list my sessions" call and the admin API
 *    needs the service role, so this renders its real empty state rather than
 *    an invented device list.
 */
export function SessionsSection({
  sessions,
  provider,
}: {
  sessions: SessionRecord[];
  provider: "clerk" | "supabase";
}) {
  return (
    <Card as="section" className="flex flex-col gap-6">
      <CardTitle>Active sessions</CardTitle>

      {sessions.length === 0 ? (
        <EmptyState
          icon={MonitorSmartphone}
          size="sm"
          message={
            provider === "clerk"
              ? "No other active sessions."
              : "Session listing isn't available for this account type yet."
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border)]">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-4 py-4 first:pt-0">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm text-fg">{session.device}</p>
                  {session.is_current ? (
                    <StatusPill tone="accent">This device</StatusPill>
                  ) : null}
                </div>
                <p className="text-xs text-faint">
                  Last active {formatDateTime(session.last_active_at)}
                </p>
              </div>

              {session.is_current ? null : (
                <RevokeSessionButton sessionId={session.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
