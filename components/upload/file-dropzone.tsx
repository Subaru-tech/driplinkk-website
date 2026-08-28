"use client";

import { FileUp, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import {
  ACCEPTED_EXTENSIONS,
  ACCEPT_ATTRIBUTE,
  MAX_UPLOAD_BYTES,
  formatBytes,
  rejectionReason,
} from "@/lib/uploads";

/**
 * Drag-and-drop / click-to-browse file picker.
 *
 * Selection and validation only — it never uploads. The parent owns the upload
 * so the two flows that need it can differ: models upload on submit, a listing
 * uploads alongside its title and price.
 *
 * Keyboard reachable on purpose: the drop target is a real <label> bound to
 * the file input, so Tab + Enter opens the picker. A div with an onDrop
 * handler would strand anyone not using a mouse.
 */

export type PickedFile = { id: string; file: File };

export function FileDropzone({
  files,
  onChange,
  multiple = false,
  disabled = false,
}: {
  files: PickedFile[];
  onChange: (next: PickedFile[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  function add(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;

    const accepted: PickedFile[] = [];
    const problems: string[] = [];

    for (const file of Array.from(incoming)) {
      const reason = rejectionReason(file);
      if (reason) {
        problems.push(`${file.name} — ${reason}`);
        continue;
      }
      /* Same name + size + mtime twice is the same file picked twice. */
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (files.some((picked) => picked.id === key)) continue;
      accepted.push({ id: key, file });
    }

    setRejected(problems);
    onChange(multiple ? [...files, ...accepted] : accepted.slice(-1));

    /* Reset the input so re-picking the same file still fires onChange. */
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) add(event.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-accent bg-accent-muted/40" : "border-line-control bg-raised",
          disabled && "pointer-events-none opacity-40",
          "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/35",
        )}
      >
        <FileUp className="size-6 text-muted" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-sm text-fg">
          Drop {multiple ? "files" : "a file"} here, or <span className="text-accent">browse</span>
        </span>
        <span className="text-xs text-muted">
          {Object.keys(ACCEPTED_EXTENSIONS).join(" · ")} — up to {formatBytes(MAX_UPLOAD_BYTES)} each
        </span>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={ACCEPT_ATTRIBUTE}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => add(event.target.files)}
        />
      </label>

      {rejected.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1">
          {rejected.map((message) => (
            <li key={message} className="text-xs text-danger">
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((picked) => (
            <li
              key={picked.id}
              className="flex items-center gap-3 rounded-[var(--radius-control)] border border-line bg-raised px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg">
                {picked.file.name}
              </span>
              <span className="shrink-0 text-xs text-muted">{formatBytes(picked.file.size)}</span>
              {disabled ? null : (
                <button
                  type="button"
                  onClick={() => onChange(files.filter((f) => f.id !== picked.id))}
                  aria-label={`Remove ${picked.file.name}`}
                  className="shrink-0 text-muted transition-colors hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Per-file progress bar, shown while the parent is uploading. */
export function UploadProgress({
  name,
  percent,
  error,
}: {
  name: string;
  percent: number;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-mono text-xs text-fg">{name}</span>
        <span className={cn("shrink-0 text-xs", error ? "text-danger" : "text-muted")}>
          {error ? "Failed" : `${percent}%`}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Uploading ${name}`}
        className="h-1 overflow-hidden rounded-full bg-line"
      >
        <div
          className={cn("h-full transition-[width] duration-200", error ? "bg-danger" : "bg-accent")}
          style={{ width: `${error ? 100 : percent}%` }}
        />
      </div>

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
