"use client";

import { useState, type FormEvent } from "react";
import { useSignIn } from "@clerk/nextjs";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import {
  PasswordRequirements,
  passwordIsValid,
} from "@/components/auth/password-requirements";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/* ------------------------------------------------------------------ Clerk */

function ClerkResetForm() {
  const { signIn } = useSignIn();
  const [stage, setStage] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onRequest(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);

    if (!signIn) {
      setFormError("Authentication service is initializing. Please try again.");
      return;
    }

    setPending(true);
    try {
      // Identifies the account, then sends the reset code to its email.
      const { error: createErr } = await signIn.create({ identifier: email });
      if (createErr) {
        setFormError(createErr.message || "Couldn't send the reset code.");
        return;
      }

      const { error: sendErr } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendErr) {
        setFormError(sendErr.message || "Couldn't send the reset code.");
        return;
      }

      setStage("verify");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Couldn't send the reset code.");
    } finally {
      setPending(false);
    }
  }

  async function onConfirm(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!code.trim()) {
      setFormError("Enter the code sent to your email.");
      return;
    }
    if (!passwordIsValid(password)) {
      setFormError("New password doesn't meet the requirements.");
      return;
    }
    if (!signIn) return;

    setPending(true);
    try {
      // Verify the code -> status becomes 'needs_new_password'.
      const { error: verifyErr } = await signIn.resetPasswordEmailCode.verifyCode({
        code: code.trim(),
      });
      if (verifyErr) {
        setFormError(verifyErr.message || "That code isn't right.");
        return;
      }

      // Submit the new password -> status becomes 'complete'.
      const { error: pwErr } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      });
      if (pwErr) {
        setFormError(pwErr.message || "Couldn't reset your password.");
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: async ({ decorateUrl }) => {
            const target = decorateUrl ? decorateUrl("/login?reset=success") : "/login?reset=success";
            window.location.href = target;
          },
        });
        return;
      }

      setFormError(`Reset requires another step (${signIn.status}).`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Couldn't reset your password.");
    } finally {
      setPending(false);
    }
  }

  if (stage === "verify") {
    return (
      <AuthCard
        title="Choose a new password"
        subtitle={`Enter the code we sent to ${email}, then set your new password.`}
        error={formError}
        footer={{ prompt: "Wrong address?", href: "/login/reset", label: "Start over" }}
      >
        <form onSubmit={onConfirm} noValidate className="flex flex-col gap-5">
          <Field label="Verification code">
            {({ id, describedBy }) => (
              <Input
                id={id}
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-describedby={describedBy}
              />
            )}
          </Field>

          <div className="flex flex-col gap-3">
            <Field label="New password">
              {({ id, describedBy }) => (
                <PasswordInput
                  id={id}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={describedBy}
                />
              )}
            </Field>
            <PasswordRequirements value={password} />
          </div>

          <Button type="submit" size="lg" loading={pending} className="w-full">
            Reset password
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a code to set a new one."
      error={formError}
      footer={{ prompt: "Remembered it?", href: "/login", label: "Log in" }}
    >
      <form onSubmit={onRequest} noValidate className="flex flex-col gap-5">
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
          Send reset code
        </Button>
      </form>
    </AuthCard>
  );
}

/* --------------------------------------------------------------- Supabase */

function SupabaseResetForm() {
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

export function ResetForm() {
  return isClerkEnabled ? <ClerkResetForm /> : <SupabaseResetForm />;
}
