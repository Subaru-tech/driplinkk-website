"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { resolveSignedInRole } from "@/app/(auth)/actions";
import { AuthCard } from "@/components/auth/auth-card";
import { RoleBadge, RoleDialog } from "@/components/auth/role-dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import { homeForRole, ROLES, type UserRole } from "@/lib/roles";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Spec §4.1 — validation fires on blur, never on keystroke. Auth failures use
   one generic message so we never leak which field was wrong.

   Step 0 is the role popup: creator or seller. It only decides which dashboard
   we aim at — after the password succeeds the server reports the account's
   real role and that wins. */

export function LoginForm({ initialRole }: { initialRole: UserRole | null }) {
  const router = useRouter();

  const [role, setRole] = useState<UserRole | null>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState<{ message: string; home: string } | null>(null);
  const [pending, setPending] = useState(false);

  function chooseRole(next: UserRole) {
    setRole(next);
    setFormError(null);
    router.replace(`/login?role=${next}`, { scroll: false });
  }

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

    if (!role) return;

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
      // Deliberately generic — never reveal whether the email exists.
      setFormError("Invalid email or password");
      return;
    }

    /* The account's real role decides the destination, not the popup. If the
       server can't answer (schema not deployed yet), the chosen role's home is
       the honest best guess. */
    const resolved = await resolveSignedInRole(role);
    setPending(false);

    if (resolved.status === "mismatch") {
      setMismatch({ message: resolved.message, home: resolved.home });
      return;
    }

    router.push(resolved.status === "ok" ? resolved.home : homeForRole(role));
    router.refresh();
  }

  async function signOutAndRestart() {
    await getSupabaseBrowserClient()?.auth.signOut();
    setMismatch(null);
    setEmail("");
    setPassword("");
    router.refresh();
  }

  if (mismatch) {
    return (
      <AuthCard
        title="Wrong door"
        subtitle={mismatch.message}
        footer={{ prompt: "Need the other kind of account?", href: "/signup", label: "Sign up" }}
      >
        <div className="flex flex-col gap-3">
          <ButtonLink href={mismatch.home} size="lg" className="w-full">
            Continue
          </ButtonLink>
          <Button variant="secondary" size="lg" onClick={signOutAndRestart} className="w-full">
            Log in with a different account
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <>
      <RoleDialog
        open={role === null}
        mode="login"
        onSelect={chooseRole}
        onClose={() => router.push("/")}
      />

      <AuthCard
        title="Log in"
        subtitle={role ? `Welcome back to your ${ROLES[role].label.toLowerCase()} account.` : "Welcome back."}
        error={formError}
        footer={{ prompt: "Don't have an account?", href: "/signup", label: "Sign up" }}
      >
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          {role ? <RoleBadge role={role} onChange={() => setRole(null)} /> : null}

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

          <Button type="submit" size="lg" loading={pending} disabled={!role} className="w-full">
            Log in
          </Button>
        </form>

        {/* Spec §4.1: OAuth is explicitly out of scope for v1, so the "or"
            divider is omitted too — it would separate nothing. */}
      </AuthCard>
    </>
  );
}
