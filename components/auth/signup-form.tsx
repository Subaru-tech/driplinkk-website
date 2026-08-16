"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import {
  PasswordRequirements,
  passwordIsValid,
} from "@/components/auth/password-requirements";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, PasswordInput } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [pending, setPending] = useState(false);

  /* Spec §4.1 — the terms checkbox gates the submit button. */
  const canSubmit = acceptedTerms && !pending;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = {
      name: name.trim() ? undefined : "Enter your name.",
      email: EMAIL_RE.test(email) ? undefined : "Enter a valid email address.",
      password: passwordIsValid(password) ? undefined : "Password doesn't meet the requirements.",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.password) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError("Sign-up isn't available yet — the backend isn't connected.");
      return;
    }

    setPending(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setPending(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    /* With email confirmation on, signUp returns no session — tell them to go
       check their inbox rather than dropping them on a login screen. */
    if (!data.session) {
      setConfirmSent(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (confirmSent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`We sent a confirmation link to ${email}. Open it to finish setting up your account.`}
        footer={{ prompt: "Wrong address?", href: "/signup", label: "Start over" }}
      >
        <p className="text-sm text-muted">
          The link expires in 24 hours. If it doesn&apos;t arrive, check your spam folder.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start building with DripLink."
      error={formError}
      footer={{ prompt: "Already have an account?", href: "/login", label: "Log in" }}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field label="Name" error={errors.name}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() =>
                setErrors((s) => ({ ...s, name: name.trim() ? undefined : "Enter your name." }))
              }
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Field label="Email" error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() =>
                setErrors((s) => ({
                  ...s,
                  email: EMAIL_RE.test(email) ? undefined : "Enter a valid email address.",
                }))
              }
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <div className="flex flex-col gap-3">
          <Field label="Password" error={errors.password}>
            {({ id, describedBy, invalid }) => (
              <PasswordInput
                id={id}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() =>
                  setErrors((s) => ({
                    ...s,
                    password: passwordIsValid(password)
                      ? undefined
                      : "Password doesn't meet the requirements.",
                  }))
                }
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>
          <PasswordRequirements value={password} />
        </div>

        <Checkbox
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" className="text-accent hover:text-accent-hover">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-accent hover:text-accent-hover">
                Privacy Policy
              </Link>
              .
            </>
          }
        />

        <Button type="submit" size="lg" loading={pending} disabled={!canSubmit} className="w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
