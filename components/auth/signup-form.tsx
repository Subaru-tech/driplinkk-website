"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import {
  PasswordRequirements,
  passwordIsValid,
} from "@/components/auth/password-requirements";
import { RoleBadge, RoleDialog } from "@/components/auth/role-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, PasswordInput } from "@/components/ui/input";
import { homeForRole, ROLES, type UserRole } from "@/lib/roles";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Step 0 is the same popup as login, but here the choice is real: it decides
   which rows the backend provisions (a seller also gets a `seller_profiles`
   row, keyed on the studio name asked for below). */

export function SignupForm({ initialRole }: { initialRole: UserRole | null }) {
  const router = useRouter();

  const [role, setRole] = useState<UserRole | null>(initialRole);
  const [name, setName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    studioName?: string;
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [pending, setPending] = useState(false);

  /* Spec §4.1 — the terms checkbox gates the submit button. */
  const canSubmit = acceptedTerms && role !== null && !pending;

  function chooseRole(next: UserRole) {
    setRole(next);
    setFormError(null);
    router.replace(`/signup?role=${next}`, { scroll: false });
  }

  function validateStudioName(value: string) {
    if (role !== "seller") return undefined;
    return value.trim().length >= 2 ? undefined : "Enter the name buyers will see.";
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!role) return;

    const nextErrors = {
      name: name.trim() ? undefined : "Enter your name.",
      studioName: validateStudioName(studioName),
      email: EMAIL_RE.test(email) ? undefined : "Enter a valid email address.",
      password: passwordIsValid(password) ? undefined : "Password doesn't meet the requirements.",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.studioName || nextErrors.email || nextErrors.password) return;

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
        /* This metadata is client-supplied, so the backend's
           `handle_new_user()` trigger re-validates it — anything that isn't
           exactly "seller" provisions a creator. */
        data: {
          full_name: name.trim(),
          role,
          ...(role === "seller" ? { studio_name: studioName.trim() } : {}),
        },
        emailRedirectTo: `${window.location.origin}${homeForRole(role)}`,
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

    router.push(homeForRole(role));
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
    <>
      <RoleDialog
        open={role === null}
        mode="signup"
        onSelect={chooseRole}
        onClose={() => router.push("/")}
      />

      <AuthCard
        title="Create your account"
        subtitle={role ? ROLES[role].blurb : "Start building with DripLink."}
        error={formError}
        footer={{ prompt: "Already have an account?", href: "/login", label: "Log in" }}
      >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {role ? <RoleBadge role={role} onChange={() => setRole(null)} /> : null}

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

        {/* Sellers get one extra field: the name buyers see on the Mart. The
            backend turns it into their storefront slug. */}
        {role === "seller" ? (
          <Field
            label="Studio name"
            error={errors.studioName}
            hint="Shown on every listing you publish."
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="studio-name"
                autoComplete="organization"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                onBlur={() =>
                  setErrors((s) => ({ ...s, studioName: validateStudioName(studioName) }))
                }
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>
        ) : null}

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
    </>
  );
}
