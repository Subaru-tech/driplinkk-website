"use client";

import { useState } from "react";
import { useSessionList } from "@clerk/nextjs";

/**
 * Revokes one of the signed-in user's Clerk sessions, then reloads so the
 * list reflects it. Rendered only for Clerk-authenticated accounts —
 * Supabase has no client-side session-revocation API, so those users never
 * see this button.
 */
export function RevokeSessionButton({ sessionId }: { sessionId: string }) {
  const { isLoaded, sessions } = useSessionList();
  const [pending, setPending] = useState(false);

  async function revoke() {
    setPending(true);
    try {
      const session = sessions?.find((s) => s.id === sessionId);
      if (session) {
        await session.remove();
      }
      window.location.reload();
    } catch {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={revoke}
      disabled={pending || !isLoaded}
      className="shrink-0 text-sm font-medium text-danger transition-opacity hover:opacity-80 disabled:opacity-40"
    >
      {pending ? "Revoking…" : "Revoke"}
    </button>
  );
}
