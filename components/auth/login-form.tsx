"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Spec §4.1 — validation fires on blur, never on keystroke. Auth failures use
   one generic message so we never leak which field was wrong. */

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validateEmail() {
    setErrors((e) => ({
      ...e,
      email: EMAIL_RE.test(email) ? undefined : "Enter a valid email address.",
    }));
  }

  function validatePassword() {
    setErrors((e) => ({ ...e, password: password ? undefined : "Enter your password." }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const emailError = EMAIL_RE.test(email) ? undefined : "Enter a valid email address.";
    const passwordError = password ? undefined : "Enter your password.";
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError("Sign-in isn't available yet — the backend isn't connected.");
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);

    if (error) {
      // Deliberately generic — never reveal whether the email exists.
      setFormError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back."
      error={formError}
      footer={{ prompt: "Don't have an account?", href: "/signup", label: "Sign up" }}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field label="Email" error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={validateEmail}
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Field
          label="Password"
          error={errors.password}
          action={
            <Link
              href="/login/reset"
              className="text-xs text-muted transition-colors hover:text-fg"
            >
              Forgot password?
            </Link>
          }
        >
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={validatePassword}
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Button type="submit" size="lg" loading={pending} className="w-full">
          Log in
        </Button>
      </form>

      {/* Spec §4.1: OAuth is explicitly out of scope for v1, so the "or"
          divider is omitted too — it would separate nothing. */}
    </AuthCard>
  );
}
