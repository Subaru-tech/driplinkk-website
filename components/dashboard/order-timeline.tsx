import { Check, X } from "lucide-react";
import { ORDER_TIMELINE, type OrderStatus } from "@/components/ui/status-pill";
import { cn } from "@/lib/cn";

/**
 * Vertical stepper for the order detail view — spec §6.3.
 *
 * Cancelled and Failed sit outside the happy path, so they're rendered as a
 * terminal state rather than being forced onto the ladder.
 */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const terminal = status === "Cancelled" || status === "Failed";
  const currentIndex = terminal ? -1 : ORDER_TIMELINE.indexOf(status);

  return (
    <ol className="flex flex-col">
      {ORDER_TIMELINE.map((stage, index) => {
        const done = !terminal && index < currentIndex;
        const current = !terminal && index === currentIndex;
        const last = index === ORDER_TIMELINE.length - 1;

        return (
          <li key={stage} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-xs",
                  done && "border-accent bg-accent text-accent-contrast",
                  current && "border-accent text-accent",
                  !done && !current && "border-line text-faint",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : null}
                {current ? (
                  <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                ) : null}
              </span>
              {last ? null : (
                <span
                  aria-hidden="true"
                  className={cn("w-px flex-1", done ? "bg-accent" : "bg-line")}
                />
              )}
            </div>

            <div className={cn("pb-6", last && "pb-0")}>
              <p
                className={cn(
                  "text-sm",
                  current ? "font-medium text-fg" : done ? "text-muted" : "text-faint",
                )}
              >
                {stage}
                {current ? <span className="sr-only"> — current stage</span> : null}
              </p>
            </div>
          </li>
        );
      })}

      {terminal ? (
        <li className="mt-2 flex gap-4">
          <span className="grid size-6 shrink-0 place-items-center rounded-full border border-danger text-danger">
            <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-danger">{status}</p>
        </li>
      ) : null}
    </ol>
  );
}
