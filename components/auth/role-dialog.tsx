"use client";

import { Check } from "lucide-react";
import { ROLE_LIST, type UserRole } from "@/lib/roles";
import { Modal } from "@/components/ui/modal";

/**
 * The "which kind of account?" popup, shown before the credential form on both
 * /login and /signup.
 *
 * On sign-up the choice is real — it decides which rows get provisioned. On
 * login it is only a route hint; the server checks the account's actual role
 * after the password succeeds. See `docs/auth-flow.md` in the backend repo.
 */
export function RoleDialog({
  open,
  mode,
  onSelect,
  onClose,
}: {
  open: boolean;
  mode: "login" | "signup";
  onSelect: (role: UserRole) => void;
  /** Backdrop / Esc / close button — sends the visitor back to the site. */
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "login" ? "How do you want to log in?" : "What kind of account?"}
      description={
        mode === "login"
          ? "Pick the side of DripLink you're signing in to. We'll check it against your account."
          : "This decides what your account can do. You can only pick one now — changing it later means asking us."
      }
      /* Two option cards make this the tallest modal in the app — on a short
         viewport (small phone, landscape) it must scroll rather than clip the
         second button off the bottom. */
      className="max-h-[calc(100svh-2rem)] max-w-[560px] overflow-y-auto"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {ROLE_LIST.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelect(role.id)}
            className={
              "group flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-raised p-4 text-left " +
              "transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 " +
              "hover:border-accent hover:shadow-lg hover:shadow-black/20 " +
              "focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35"
            }
          >
            <span className="grid size-9 place-items-center rounded-[var(--radius-control)] border border-line-control text-accent">
              <role.icon className="size-4" aria-hidden="true" />
            </span>

            <span className="flex flex-col gap-1">
              <span className="font-display text-base font-medium text-fg">{role.headline}</span>
              <span className="text-sm text-muted">{role.blurb}</span>
            </span>

            <ul className="flex flex-col gap-1.5">
              {role.capabilities.map((capability) => (
                <li key={capability} className="flex items-start gap-2 text-xs text-muted">
                  <Check className="mt-0.5 size-3 shrink-0 text-accent" aria-hidden="true" />
                  {capability}
                </li>
              ))}
            </ul>

            <span className="mt-auto pt-1 text-sm font-medium text-accent">
              Continue as {role.label} →
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/** The "Creator ▸ Change" strip above the credential fields. */
export function RoleBadge({ role, onChange }: { role: UserRole; onChange: () => void }) {
  const definition = ROLE_LIST.find((item) => item.id === role);
  if (!definition) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line bg-raised px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-fg">
        <definition.icon className="size-4 shrink-0 text-accent" aria-hidden="true" />
        {definition.label} account
      </span>
      <button
        type="button"
        onClick={onChange}
        className="text-xs font-medium text-muted transition-colors hover:text-fg"
      >
        Change
      </button>
    </div>
  );
}
