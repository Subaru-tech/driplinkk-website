"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatCredits, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

/* Spec §6.4 — Buy Credits modal.
   3–4 preset packs as radio cards (not a dropdown), plus a custom amount, with
   the total price shown live, then "Continue to Payment" → Razorpay. */

const RATE_INR_PER_CREDIT = 2;

const PACKS = [
  { credits: 500, label: "Starter" },
  { credits: 1500, label: "Regular", popular: true },
  { credits: 5000, label: "Studio" },
];

const MIN_CUSTOM = 100;
const MAX_CUSTOM = 100_000;

export function CreditBuyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [selected, setSelected] = useState<number | "custom">(1500);
  const [custom, setCustom] = useState("");
  const [pending, setPending] = useState(false);

  const customCredits = Number.parseInt(custom, 10);
  const customValid =
    Number.isFinite(customCredits) && customCredits >= MIN_CUSTOM && customCredits <= MAX_CUSTOM;

  const credits = selected === "custom" ? (customValid ? customCredits : 0) : selected;
  const total = credits * RATE_INR_PER_CREDIT;
  const canContinue = credits > 0 && !pending;

  async function continueToPayment() {
    setPending(true);
    try {
      /* Razorpay checkout is wired up in Track 2 alongside the orders API.
         Until that endpoint exists we say so rather than opening a checkout
         that can't take money. */
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      });
      if (!response.ok) throw new Error("checkout unavailable");
      const { redirectUrl } = await response.json();
      window.location.href = redirectUrl;
    } catch {
      toast("error", "Payments aren't connected yet. Credit purchases go live with the backend.");
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buy credits"
      description={`Credits are charged at ${formatCurrency(RATE_INR_PER_CREDIT)} each.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} disabled={!canContinue} onClick={continueToPayment}>
            Continue to Payment
          </Button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Choose a credit pack</legend>

        {PACKS.map((pack) => {
          const active = selected === pack.credits;
          return (
            <label
              key={pack.credits}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-control)] border p-4 transition-colors",
                active
                  ? "border-accent bg-accent-muted/40"
                  : "border-line bg-raised hover:border-line-strong",
              )}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="credit-pack"
                  value={pack.credits}
                  checked={active}
                  onChange={() => setSelected(pack.credits)}
                  className="size-4 accent-[var(--accent)]"
                />
                <span className="flex flex-col">
                  <span className="font-mono text-sm text-fg">
                    {formatCredits(pack.credits)} credits
                  </span>
                  <span className="text-xs text-muted">
                    {pack.label}
                    {pack.popular ? " · most popular" : ""}
                  </span>
                </span>
              </span>
              <span className="font-mono text-sm text-fg">
                {formatCurrency(pack.credits * RATE_INR_PER_CREDIT)}
              </span>
            </label>
          );
        })}

        <label
          className={cn(
            "flex cursor-pointer flex-col gap-3 rounded-[var(--radius-control)] border p-4 transition-colors",
            selected === "custom"
              ? "border-accent bg-accent-muted/40"
              : "border-line bg-raised hover:border-line-strong",
          )}
        >
          <span className="flex items-center gap-3">
            <input
              type="radio"
              name="credit-pack"
              value="custom"
              checked={selected === "custom"}
              onChange={() => setSelected("custom")}
              className="size-4 accent-[var(--accent)]"
            />
            <span className="text-sm text-fg">Custom amount</span>
          </span>

          {selected === "custom" ? (
            <Field
              label="Credits"
              hideLabel
              error={
                custom && !customValid
                  ? `Enter between ${formatCredits(MIN_CUSTOM)} and ${formatCredits(MAX_CUSTOM)} credits.`
                  : null
              }
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={MIN_CUSTOM}
                  max={MAX_CUSTOM}
                  value={custom}
                  onChange={(event) => setCustom(event.target.value)}
                  placeholder={`${MIN_CUSTOM}–${formatCredits(MAX_CUSTOM)}`}
                  aria-describedby={describedBy}
                  invalid={invalid}
                />
              )}
            </Field>
          ) : null}
        </label>
      </fieldset>

      {/* Live total — spec §6.4 */}
      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm text-muted">Total</span>
        <span aria-live="polite" className="font-mono text-lg font-medium text-fg">
          {credits > 0 ? formatCurrency(total) : "—"}
        </span>
      </div>
    </Modal>
  );
}
