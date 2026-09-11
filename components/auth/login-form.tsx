"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSignIn } from "@clerk/nextjs";
import { resolveHome } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthDivider, GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ClerkLoginForm({ initialError }: { initialError: string | null }) {
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; code?: string }>({});
  const [formError, setFormError] = useState<string | null>(initialError);
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

    if (!signIn) {
      setFormError("Authentication service is initializing. Please try again.");
      return;
    }

    setPending(true);
    try {
      const { error } = await signIn.password({
        identifier: email,
        password: password,
      });

      if (error) {
        setPending(false);
        const msg = error.message || "Invalid email or password.";
        setFormError(msg);
        return;
      }

      if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
        const { error: sendErr } = await signIn.mfa.sendEmailCode();
        if (sendErr) {
          setPending(false);
          setFormError(sendErr.message || "Failed to send verification code.");
          return;
        }
        setVerifying(true);
        setPending(false);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: async ({ decorateUrl }) => {
            const home = await resolveHome();
            const target = decorateUrl ? decorateUrl(home) : home;
            window.location.href = target;
          },
        });
      } else {
        setPending(false);
        setFormError(`Sign-in requires additional verification (${signIn.status}).`);
      }
    } catch (err: unknown) {
      setPending(false);
      setFormError(err instanceof Error ? err.message : "Failed to sign in.");
    }
  }

  async function onVerifyCode(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!verificationCode.trim()) {
      setErrors((e) => ({ ...e, code: "Enter the code sent to your email." }));
      return;
    }

    if (!signIn) return;
    setPending(true);
    try {
      const { error } = await signIn.mfa.verifyEmailCode({
        code: verificationCode.trim(),
      });

      if (error) {
        setPending(false);
        setFormError(error.message || "Invalid verification code.");
        return;
      }

      await signIn.finalize({
        navigate: async ({ decorateUrl }) => {
          const home = await resolveHome();
          const target = decorateUrl ? decorateUrl(home) : home;
          window.location.href = target;
        },
      });
    } catch (err: unknown) {
      setPending(false);
      setFormError(err instanceof Error ? err.message : "Verification failed.");
    }
  }

  const isSubmitting = pending || fetchStatus === "fetching";

  if (verifying) {
    return (
      <AuthCard
        title="Verify your login"
        subtitle={`We sent a verification code to ${email}. Enter it below to verify your device.`}
        error={formError}
        footer={{ prompt: "Use another account?", href: "/login", label: "Back to login" }}
      >
        <form onSubmit={onVerifyCode} noValidate className="flex flex-col gap-5">
          <Field label="Verification Code" error={errors.code}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="code"
                type="text"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            Complete Verification
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back."
      error={formError}
      footer={{ prompt: "Don't have an account?", href: "/signup", label: "Sign up" }}
    >
      <div className="flex flex-col gap-4">
        <GoogleButton onError={(err) => setFormError(err)} disabled={isSubmitting} />
        <AuthDivider />

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
              <Link href="/login/reset" className="text-xs text-muted transition-colors hover:text-fg">
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

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            Log in
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}

function SupabaseLoginForm({ initialError }: { initialError: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(initialError);
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

    if (error) {
      setPending(false);
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed")) {
        setFormError("Please verify your email address before logging in.");
      } else if (msg.includes("invalid login credentials") || msg.includes("invalid_grant")) {
        setFormError("Invalid email or password.");
      } else {
        setFormError(error.message || "Invalid email or password.");
      }
      return;
    }

    const home = await resolveHome();
    window.location.href = home;
  }

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back."
      error={formError}
      footer={{ prompt: "Don't have an account?", href: "/signup", label: "Sign up" }}
    >
      <div className="flex flex-col gap-4">
        <GoogleButton onError={(err) => setFormError(err)} disabled={pending} />
        <AuthDivider />

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
              <Link href="/login/reset" className="text-xs text-muted transition-colors hover:text-fg">
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
      </div>
    </AuthCard>
  );
}

export function LoginForm() {
  const [initialError] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        return decodeURIComponent(err);
      }
    }
    return null;
  });

  if (isClerkEnabled) {
    return <ClerkLoginForm initialError={initialError} />;
  }

  return <SupabaseLoginForm initialError={initialError} />;
}
