import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

const TIMELINE_STAGES = [
  { id: "placed", label: "Order Placed" },
  { id: "accepted", label: "Hub Accepted" },
  { id: "printing", label: "Printing in Progress" },
  { id: "shipped", label: "Dispatched & Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "completed", label: "Completed" },
];

/**
 * Vertical stepper for the order detail view — supports lowercase database statuses.
 */
export function OrderTimeline({ status }: { status: string }) {
  const normStatus = status.toLowerCase();
  const terminal = normStatus === "cancelled" || normStatus === "failed";
  const stageIds = TIMELINE_STAGES.map((s) => s.id);
  const currentIndex = terminal ? -1 : stageIds.indexOf(normStatus);

  return (
    <ol className="flex flex-col">
      {TIMELINE_STAGES.map((stage, index) => {
        const done = !terminal && index < currentIndex;
        const current = !terminal && index === currentIndex;
        const last = index === TIMELINE_STAGES.length - 1;

        return (
          <li key={stage.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-xs",
                  done && "border-accent bg-accent text-accent-contrast",
                  current && "border-accent text-accent",
                  !done && !current && "border-line text-faint"
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
                  className={cn("w-px flex-1 min-h-6", done ? "bg-accent" : "bg-line")}
                />
              )}
            </div>

            <div className={cn("pb-6", last && "pb-0")}>
              <p
                className={cn(
                  "text-sm",
                  current ? "font-medium text-fg" : done ? "text-muted" : "text-faint"
                )}
              >
                {stage.label}
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
          <p className="text-sm font-medium text-danger capitalize">{status}</p>
        </li>
      ) : null}
    </ol>
  );
}
