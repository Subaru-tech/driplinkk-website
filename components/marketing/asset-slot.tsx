import { ImageIcon } from "lucide-react";

/**
 * Placeholder for a real product asset (screen recording / annotated
 * screenshot) that marketing still owes us.
 *
 * Spec §3.2.4 is explicit: use the real workspace UI, don't fake a mockup. So
 * rather than inventing a convincing-looking fake screenshot, this renders a
 * labelled empty frame naming the asset that belongs here. Replace the whole
 * component with an <Image> or <video> when the asset lands.
 */
export function AssetSlot({ label, aspect = "16 / 9" }: { label: string; aspect?: string }) {
  return (
    <div
      style={{ aspectRatio: aspect }}
      className="flex w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface p-8 text-center"
    >
      <ImageIcon className="size-8 text-faint" strokeWidth={1.5} aria-hidden="true" />
      <p className="text-sm text-muted">{label}</p>
      <p className="max-w-sm text-xs text-faint">
        Asset pending. Nothing is mocked up here on purpose — drop the real capture in and delete
        this placeholder.
      </p>
    </div>
  );
}
