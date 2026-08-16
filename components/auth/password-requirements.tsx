import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/cn";

/* Spec §4.1 — live checklist below the password field. It stays neutral until
   the user has actually typed something, so nobody gets a red error while
   they're still halfway through the field. */

export type PasswordRule = { label: string; test: (value: string) => boolean };

export const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One letter", test: (v) => /[a-zA-Z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
];

export function passwordIsValid(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export function PasswordRequirements({ value }: { value: string }) {
  const touched = value.length > 0;

  return (
    <ul className="flex flex-col gap-1.5" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li key={rule.label} className="flex items-center gap-2 text-xs">
            {met ? (
              <Check className="size-3.5 shrink-0 text-accent" strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-faint" strokeWidth={2} aria-hidden="true" />
            )}
            <span className={cn(met ? "text-muted" : touched ? "text-muted" : "text-faint")}>
              {rule.label}
            </span>
            <span className="sr-only">{met ? "requirement met" : "requirement not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}
