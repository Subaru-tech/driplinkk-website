"use client";

import { Check, Download, LogIn, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase";

/**
 * The one thing a visitor does on a model page.
 *
 * Four states, because there are genuinely four situations:
 *   signed out  → send them to log in, don't pretend the button works
 *   owned       → open the library, not a second copy
 *   free        → add it, one click, no checkout
 *   paid        → say plainly that payments aren't live
 *
 * The free path writes a `library_items` row directly from the browser. The
 * RLS policy allows it only for a published listing priced at 0, so the rule
 * lives in the database and this component can't be the thing that enforces it.
 */
export function AcquirePanel({
  listingId,
  priceInr,
  signedIn,
  owned,
}: {
  listingId: string;
  priceInr: number;
  signedIn: boolean;
  owned: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(owned);

  const free = priceInr === 0;

  async function claim() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast("error", "Can't add that yet — the backend isn't connected.");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push("/login");
      return;
    }

    setPending(true);
    const { error } = await supabase
      .from("library_items")
      .insert({ user_id: auth.user.id, listing_id: listingId, source: "free" });
    setPending(false);

    if (error) {
      // 23505 = already in the library, which is the outcome they wanted.
      if (error.code === "23505") {
        setAdded(true);
        return;
      }
      toast("error", error.message || "Couldn't add that to your library.");
      return;
    }

    setAdded(true);
    toast("success", "Added to your library.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6">
      <p className="font-mono text-3xl font-medium text-fg">
        {free ? "Free" : formatCurrency(priceInr)}
      </p>

      <div className="flex flex-col gap-2">
        {added ? (
          <>
            <ButtonLink href="/dashboard/library" size="lg" className="w-full">
              <Check className="size-4" aria-hidden="true" />
              In your library
            </ButtonLink>
            <p className="text-xs text-muted">Open it, download it, or send it to print.</p>
          </>
        ) : !signedIn ? (
          <>
            <ButtonLink href="/login" size="lg" className="w-full">
              <LogIn className="size-4" aria-hidden="true" />
              Log in to get this
            </ButtonLink>
            <p className="text-xs text-muted">
              Models live in your DripLink library, not in a one-time download link.
            </p>
          </>
        ) : free ? (
          <>
            <Button size="lg" loading={pending} onClick={claim} className="w-full">
              <Download className="size-4" aria-hidden="true" />
              Add to library
            </Button>
            <p className="text-xs text-muted">Free. No payment, no checkout.</p>
          </>
        ) : (
          <>
            <Button size="lg" disabled className="w-full">
              <Download className="size-4" aria-hidden="true" />
              Buy model
            </Button>
            <p className="text-xs text-muted">
              Paid models unlock when checkout goes live. Free models work today.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <ButtonLink href="/mart" variant="secondary" size="lg" className="w-full">
          <Printer className="size-4" aria-hidden="true" />
          Print with Mart
        </ButtonLink>
        <p className="text-xs text-muted">
          Don&apos;t want the file? Have it printed and shipped instead.
        </p>
      </div>
    </div>
  );
}
