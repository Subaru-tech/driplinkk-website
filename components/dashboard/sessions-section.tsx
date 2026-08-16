import { MonitorSmartphone } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTime } from "@/lib/format";
import type { SessionRecord } from "@/lib/types";

/**
 * Spec §6.5 — active sessions, including the desktop app's ("LeaFF OS
 * Desktop"), each revocable except the current one.
 *
 * NOTE FOR TRACK 2: supabase-js has no client-side "list my sessions" call —
 * `auth.admin.listUsers` / session inspection needs the service-role key, so
 * this list has to come from a server route (or a `user_sessions` table the
 * backend maintains). Until that endpoint exists this renders its real empty
 * state rather than a plausible-looking invented device list.
 */
export function SessionsSection({ sessions }: { sessions: SessionRecord[] }) {
  return (
    <Card as="section" className="flex flex-col gap-6">
      <CardTitle>Active sessions</CardTitle>

      {sessions.length === 0 ? (
        <EmptyState
          icon={MonitorSmartphone}
          size="sm"
          message="No session data available yet."
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
                <button
                  type="button"
                  className="shrink-0 text-sm font-medium text-danger transition-opacity hover:opacity-80"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
