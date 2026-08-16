import { FileWarning } from "lucide-react";

/**
 * Legal pages are routed and styled, but deliberately NOT written.
 *
 * Terms and a privacy policy are binding documents — inventing plausible-
 * sounding clauses would be worse than an obvious gap, and the same
 * no-fabrication rule that governs the dashboard applies here. This renders the
 * agreed section outline so counsel has a structure to fill in.
 */
export function LegalPlaceholder({
  title,
  document,
  sections,
}: {
  title: string;
  document: string;
  sections: string[];
}) {
  return (
    <article className="mx-auto max-w-prose px-6 py-20 md:py-28">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">{title}</h1>

      <div className="mt-8 flex gap-4 rounded-[var(--radius-card)] border border-warning/40 bg-warning-muted p-4">
        <FileWarning className="mt-0.5 size-5 shrink-0 text-warning" strokeWidth={1.75} aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-fg">Not yet drafted</p>
          <p className="text-sm text-muted">
            The {document} has not been written. This page must not go live until real, reviewed
            copy replaces the outline below.
          </p>
        </div>
      </div>

      <h2 className="mt-12 font-display text-lg font-medium text-fg">Planned sections</h2>
      <ol className="mt-6 flex flex-col gap-3">
        {sections.map((section, index) => (
          <li key={section} className="flex gap-4 text-base text-muted">
            <span className="font-mono text-sm text-faint">
              {String(index + 1).padStart(2, "0")}
            </span>
            {section}
          </li>
        ))}
      </ol>
    </article>
  );
}
