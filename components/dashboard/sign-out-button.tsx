"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/cn";

/** Pinned to the bottom of the sidebar — spec §5. */
export function SignOutButton({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setPending(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      title={collapsed ? "Sign out" : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm text-muted",
        "transition-colors hover:bg-raised hover:text-fg disabled:opacity-40",
        collapsed && "justify-center px-0",
      )}
    >
      <LogOut className="size-4 shrink-0" aria-hidden="true" />
      <span className={cn(collapsed && "sr-only")}>Sign out</span>
    </button>
  );
}
