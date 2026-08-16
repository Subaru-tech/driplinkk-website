"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Light mode is a toggle, not the default (spec §1.1).
 *
 * The current theme lives on `<html data-theme>`, set before first paint by
 * ThemeScript. Which icon shows is decided in CSS from that attribute, so this
 * component holds no state and needs no mount effect — meaning no flash of the
 * wrong icon and no hydration mismatch.
 */
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem("driplink-theme", next);
    } catch {
      /* storage blocked — the theme still applies for this page load */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-[var(--radius-control)] text-muted transition-colors hover:bg-raised hover:text-fg",
        className,
      )}
    >
      <Sun className="theme-icon-dark size-4" aria-hidden="true" />
      <Moon className="theme-icon-light size-4" aria-hidden="true" />
    </button>
  );
}
