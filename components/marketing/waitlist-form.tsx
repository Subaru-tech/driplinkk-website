"use client";

import { useActionState } from "react";
import { joinWaitlist, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/* Spec §3.1.6 — email input + submit inline (stacked on mobile),
   one line of privacy assurance below in text-xs text-tertiary. */

const initial: FormState = { status: "idle", message: "" };

export function WaitlistForm({ className }: { className?: string }) {
  const [state, action, pending] = useActionState(joinWaitlist, initial);

  return (
    <div className={cn("flex w-full max-w-xl flex-col gap-3", className)}>
      <form action={action} className="flex w-full flex-col gap-3 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <Input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          invalid={state.status === "error"}
          aria-describedby="waitlist-status"
          className="flex-1"
        />
        <Button type="submit" loading={pending} className="shrink-0 sm:w-auto">
          Join Waitlist
        </Button>
      </form>

      <p
        id="waitlist-status"
        role={state.status === "error" ? "alert" : "status"}
        aria-live="polite"
        className={cn(
          "text-xs",
          state.status === "error" && "text-danger",
          state.status === "success" && "text-accent",
          state.status === "idle" && "text-faint",
        )}
      >
        {state.status === "idle"
          ? "No spam. We'll only email you when there's something real to show."
          : state.message}
      </p>
    </div>
  );
}
