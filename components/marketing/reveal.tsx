"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Reveals its children once they enter the viewport, then stops observing.
 *
 * The animation itself lives in CSS (`[data-reveal]` in globals.css) — this
 * only flips the `data-revealed` attribute, so scrolling never runs React and
 * never touches the main thread beyond a single IntersectionObserver callback.
 *
 * The hidden starting state is scoped to `[data-js]` in CSS, so if this
 * component never runs, the content is visible rather than stranded at
 * opacity 0.
 */
export function Reveal({
  as: Tag = "div",
  variant = "up",
  /** Stagger position within a group; each step adds 90ms. */
  index = 0,
  /** Extra delay on top of the stagger, in ms. */
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  variant?: "up" | "layer";
  index?: number;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    /* No observer available — show the content rather than strand it hidden.
       The hidden state must never outlive our ability to clear it. */
    if (typeof IntersectionObserver === "undefined") {
      element.setAttribute("data-revealed", "");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      /*
       * `data-revealed` is stamped onto this node imperatively by the observer
       * above, so it exists on the client but never in the server HTML. React
       * flags that as a hydration mismatch on any element already in view at
       * load, because the observer fires before it finishes reconciling.
       *
       * Suppressing is correct rather than a workaround: the attribute is
       * deliberately client-only and purely presentational, and React must not
       * try to reconcile it away — doing so would re-hide content that has
       * already been revealed.
       */
      suppressHydrationWarning
      style={{ "--reveal-delay": `${index * 90 + delay}ms` } as React.CSSProperties}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
