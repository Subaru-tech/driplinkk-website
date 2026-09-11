"use client";

import { Check, Download, Lock, LogIn, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/format";
import { claimFreeModel } from "@/driplink-web-backend/actions/library";

export function ModelAcquirePanel({
  modelId,
  price,
  signedIn,
  owned,
}: {
  modelId: string;
  price: number;
  signedIn: boolean;
  owned: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [acquired, setAcquired] = useState(owned);

  const isFree = price === 0;

  async function handleClaim() {
    if (!signedIn) {
      router.push(`/login?redirect=/models/${modelId}`);
      return;
    }

    setPending(true);
    try {
      const res = await claimFreeModel(modelId);
      setPending(false);

      if (!res.success) {
        toast("error", res.error || "Failed to claim model.");
        return;
      }

      setAcquired(true);
      toast("success", res.message || "Model added to your library!");
      router.refresh();
    } catch {
      setPending(false);
      toast("error", "An unexpected error occurred while claiming.");
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Price</span>
          <p className="font-mono text-3xl font-semibold text-fg">
            {isFree ? (
              <span className="text-accent">Free</span>
            ) : (
              formatCurrency(price)
            )}
          </p>
        </div>
        {isFree ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-medium text-accent">
            <Sparkles className="size-3" aria-hidden="true" />
            Claimable
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 text-xs font-medium text-muted border border-line">
            <Lock className="size-3" aria-hidden="true" />
            Paid Model
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {/* State 1: Paid model -> show price, disabled 'Buy — coming soon' button */}
        {!isFree ? (
          <>
            <Button
              id="buy-coming-soon-btn"
              size="lg"
              disabled
              className="w-full justify-center cursor-not-allowed opacity-60"
            >
              <Lock className="size-4" aria-hidden="true" />
              Buy — coming soon
            </Button>
            <p className="text-center text-xs text-muted">
              Paid purchases will unlock when the Razorpay payment gateway goes live.
            </p>
          </>
        ) : acquired ? (
          /* State 2: Free model, already acquired -> 'In your library' */
          <>
            <ButtonLink
              href="/dashboard/library"
              id="in-library-btn"
              size="lg"
              className="w-full justify-center"
            >
              <Check className="size-4" aria-hidden="true" />
              In your library
            </ButtonLink>
            <p className="text-center text-xs text-muted">
              You own this model. Open your library to download or preview the file.
            </p>
          </>
        ) : !signedIn ? (
          /* State 3: Free model, not logged in -> 'Log in to claim' */
          <>
            <ButtonLink
              href={`/login?redirect=/models/${modelId}`}
              id="login-to-claim-btn"
              size="lg"
              className="w-full justify-center"
            >
              <LogIn className="size-4" aria-hidden="true" />
              Log in to claim
            </ButtonLink>
            <p className="text-center text-xs text-muted">
              Free models are saved permanently to your personal library account.
            </p>
          </>
        ) : (
          /* State 4: Free model, logged in, not acquired -> working 'Claim' button */
          <>
            <Button
              id="claim-model-btn"
              size="lg"
              loading={pending}
              onClick={handleClaim}
              className="w-full justify-center"
            >
              <Download className="size-4" aria-hidden="true" />
              Claim Model
            </Button>
            <p className="text-center text-xs text-muted">
              Free claim · Instant library access · Zero checkout required
            </p>
          </>
        )}
      </div>

      <div className="border-t border-line/60 pt-4">
        <Link
          href="/mart"
          className="flex items-center justify-between text-xs text-muted hover:text-fg transition-colors"
        >
          <span>Need a physical print shipped instead?</span>
          <span className="font-medium text-accent hover:underline">Get a Mart quote →</span>
        </Link>
      </div>
    </div>
  );
}
