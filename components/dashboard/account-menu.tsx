"use client";

import { LogOut, Store, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

/** Avatar + account menu in the top bar — spec §5. */
export function AccountMenu({
  email,
  name,
  avatarUrl,
  /* The seller side is opt-in, so the menu says either "go to it" or
     "start one" — the only two states an account can be in. */
  isSeller = false,
}: {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  isSeller?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (name ?? email ?? "?").trim().charAt(0).toUpperCase();

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="grid size-8 place-items-center overflow-hidden rounded-full border border-line bg-raised text-xs font-medium text-fg transition-colors hover:border-line-strong"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar comes from Supabase storage at an arbitrary origin
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 animate-fade-in overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-xl shadow-black/30"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium text-fg">{name ?? "Your account"}</p>
            <p className="truncate font-mono text-xs text-muted">{email ?? "Not signed in"}</p>
          </div>

          <Link
            href="/dashboard/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <UserCog className="size-4" aria-hidden="true" />
            Account settings
          </Link>

          <Link
            href="/seller"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <Store className="size-4" aria-hidden="true" />
            {isSeller ? "Seller studio" : "Start selling"}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
