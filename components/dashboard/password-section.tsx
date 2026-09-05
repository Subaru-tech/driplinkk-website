"use client";

import { ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  PasswordRequirements,
  passwordIsValid,
} from "@/components/auth/password-requirements";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, PasswordInput } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Spec §6.5 — its own card with its own save button. Password changes are not
 * bundled into the profile submit.
 */
export function PasswordSection({
  email,
  authSource = "supabase",
}: {
  email: string;
  authSource?: "clerk" | "supabase";
}) {
  const toast = useToast();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [pending, setPending] = useState(false);

  if (authSource === "clerk") {
    return (
      <Card as="section" className="flex flex-col gap-4">
        <CardTitle>Password & Authentication</CardTitle>
        <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-line bg-raised p-4">
          <ShieldCheck className="size-5 shrink-0 text-accent" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-fg">Managed via Google / Identity Provider</p>
            <p className="text-xs text-muted">
              You are signed in securely using Google authentication. Password updates and multi-factor
              authentication are handled directly through your identity provider.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors = {
      current: current ? undefined : "Enter your current password.",
      next: passwordIsValid(next) ? undefined : "New password doesn't meet the requirements.",
      confirm: next === confirm ? undefined : "Passwords don't match.",
    };
    setErrors(nextErrors);
    if (nextErrors.current || nextErrors.next || nextErrors.confirm) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast("error", "Can't change your password yet — the backend isn't connected.");
      return;
    }

    setPending(true);

    /* Supabase's updateUser doesn't verify the old password, so re-authenticate
       first — otherwise anyone with a borrowed open session could change it. */
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });

    if (reauthError) {
      setPending(false);
      setErrors({ current: "That password isn't right." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setPending(false);

    if (error) {
      toast("error", "Couldn't update your password. Try again.");
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setErrors({});
    toast("success", "Password updated.");
  }

  return (
    <Card as="section" className="flex flex-col gap-6">
      <CardTitle>Password</CardTitle>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <Field label="Current password" error={errors.current}>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              autoComplete="current-password"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <div className="flex flex-col gap-3">
          <Field label="New password" error={errors.next}>
            {({ id, describedBy, invalid }) => (
              <PasswordInput
                id={id}
                value={next}
                onChange={(event) => setNext(event.target.value)}
                autoComplete="new-password"
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>
          <PasswordRequirements value={next} />
        </div>

        <Field label="Confirm new password" error={errors.confirm}>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Button type="submit" loading={pending} className="self-start">
          Update password
        </Button>
      </form>
    </Card>
  );
}
