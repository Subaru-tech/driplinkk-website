"use client";

import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError("Password reset isn't available yet — the backend isn't connected.");
      return;
    }

    setPending(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setPending(false);

    /* Always report success — whether the address has an account is not
       something an unauthenticated form should reveal. */
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`If an account exists for ${email}, we've sent a reset link.`}
        footer={{ prompt: "Remembered it?", href: "/login", label: "Log in" }}
      >
        <p className="text-sm text-muted">The link expires in one hour.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      error={formError}
      footer={{ prompt: "Remembered it?", href: "/login", label: "Log in" }}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field label="Email" error={error}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() =>
                setError(EMAIL_RE.test(email) ? undefined : "Enter a valid email address.")
              }
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Button type="submit" size="lg" loading={pending} className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
