import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/cn";

/**
 * Full-width band. Sections alternate bg-primary / bg-secondary to create the
 * vertical rhythm described in spec §3.1.
 */
export function Section({
  tone = "canvas",
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & { tone?: "canvas" | "surface" }) {
  return (
    <section
      {...props}
      className={cn(tone === "surface" ? "bg-surface" : "bg-canvas", className)}
    >
      <div className="mx-auto max-w-content px-6 py-16 md:py-24 lg:px-12">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn("flex max-w-2xl flex-col gap-4", className)}>
      {eyebrow ? (
        <p className="tech-label text-accent-2">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-xl font-semibold text-balance text-fg">{title}</h2>
      {description ? <p className="text-base text-muted">{description}</p> : null}

      {/* A hairline of accent traverses the rule once as the heading lands —
          the print head passing over. Settles to the normal border colour. */}
      <div className="scan-rule mt-2 h-px w-full bg-line" aria-hidden="true" />
    </Reveal>
  );
}
