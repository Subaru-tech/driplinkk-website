"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { cn } from "@/lib/cn";

const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ClerkSignOutButton({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useClerk();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    await signOut({ redirectUrl: "/login" });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
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

function SupabaseSignOutButton({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
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
      onClick={handleSignOut}
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

/** Pinned to the bottom of the sidebar — spec §5. */
export function SignOutButton({ collapsed }: { collapsed: boolean }) {
  if (isClerkEnabled) {
    return <ClerkSignOutButton collapsed={collapsed} />;
  }
  return <SupabaseSignOutButton collapsed={collapsed} />;
}

