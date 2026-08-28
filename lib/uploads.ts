import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase";

/**
 * Browser → Supabase Storage uploads.
 *
 * The file goes straight from the browser to Storage; it never passes through
 * the Next server, so a 40 MB mesh doesn't have to be buffered twice.
 *
 * The POST is hand-rolled over XMLHttpRequest rather than `supabase.storage
 * .upload()` because the JS client's standard upload gives no progress events,
 * and a 40 MB file uploading behind an indeterminate spinner reads as a hang.
 * The endpoint and headers are exactly what that method sends.
 */

/** What the pipeline actually accepts. Extension-keyed: mesh files have no
    reliable MIME type — browsers report `application/octet-stream` or ""
    for .stl and .gcode, so sniffing `file.type` would reject valid files. */
export const ACCEPTED_EXTENSIONS = {
  ".stl": "Mesh",
  ".obj": "Mesh",
  ".3mf": "Mesh",
  ".ply": "Mesh",
  ".glb": "Mesh",
  ".gltf": "Mesh",
  ".step": "CAD",
  ".stp": "CAD",
  ".gcode": "Toolpath",
  ".bgcode": "Toolpath",
  ".zip": "Archive",
} as const;

export const ACCEPT_ATTRIBUTE = Object.keys(ACCEPTED_EXTENSIONS).join(",");

/**
 * 50 MB — the Supabase free plan's global per-file ceiling. Raising the
 * `model-files` bucket limit alone does nothing; the project-wide limit
 * (Dashboard → Storage → Settings) has to move first, on a paid plan.
 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export function isAcceptedFile(filename: string): boolean {
  return extensionOf(filename) in ACCEPTED_EXTENSIONS;
}

/** Human-readable size. Uses MB/KB, never bytes — nobody reads 41943040. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Why this file can't be uploaded, or null if it can. */
export function rejectionReason(file: File): string | null {
  if (!isAcceptedFile(file.name)) {
    return `${extensionOf(file.name) || "That file type"} isn't supported.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${formatBytes(file.size)} is over the ${formatBytes(MAX_UPLOAD_BYTES)} limit.`;
  }
  if (file.size === 0) return "That file is empty.";
  return null;
}

/** The display name for a model: the filename without its extension. */
export function nameFromFilename(filename: string): string {
  const ext = extensionOf(filename);
  return (ext ? filename.slice(0, -ext.length) : filename).trim() || filename;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 58);
}

/**
 * Storage path for an upload.
 *
 * The first segment MUST be the user's id — every storage policy in the
 * backend repo checks `(storage.foldername(name))[1] = auth.uid()::text`. The
 * timestamp keeps re-uploads of the same filename from colliding.
 */
export function storagePathFor(userId: string, filename: string): string {
  const ext = extensionOf(filename);
  const stem = slugify(nameFromFilename(filename)) || "model";
  return `${userId}/${Date.now()}-${stem}${ext}`;
}

/**
 * Storage speaks Postgres. People don't.
 *
 * These three are the errors a correctly-built client still hits — a policy
 * that hasn't been deployed, a project size ceiling below the bucket's, a
 * bucket that was never created — and each has a different fix. Passing the
 * raw string through names the mechanism but hides the action.
 */
function humanizeStorageError(message: string): string {
  if (/row-level security/i.test(message)) {
    return "Storage refused the file: the upload policy for this bucket isn't deployed yet. Run `npx supabase db push` in the backend repo.";
  }
  if (/exceeded the maximum allowed size|payload too large/i.test(message)) {
    return "The file is over this project's storage size limit. Raise it in Supabase → Storage → Settings.";
  }
  if (/bucket not found/i.test(message)) {
    return "The `model-files` bucket doesn't exist yet. Deploy the backend migrations first.";
  }
  return message;
}

/**
 * The file reached Storage but the row didn't land. Both failures that
 * actually happen here point at a migration that hasn't run, and they point at
 * different ones, so they get different sentences.
 *
 * 23503 is a foreign-key violation: `models.owner_id` references `profiles`,
 * so an account created before the provisioning trigger existed has nothing to
 * hang the row on. That's what the backfill migration is for.
 */
export function rowErrorMessage(code: string | undefined, target: string): string {
  if (code === "42P01") return "The database schema isn't deployed yet.";
  if (code === "23503") {
    return "Your account has no profile row yet — run `npx supabase db push` to apply the backfill migration.";
  }
  return `Uploaded, but couldn't be saved to ${target}.`;
}

export type UploadResult = { path: string };

/**
 * Uploads one file, reporting progress 0–100.
 *
 * `signal` aborts in flight — the dialog wires it to its Cancel button so a
 * mistaken 40 MB upload can be stopped rather than waited out.
 */
export function uploadToStorage({
  bucket,
  path,
  file,
  accessToken,
  onProgress,
  signal,
}: {
  bucket: string;
  path: string;
  file: File;
  accessToken: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`);
    request.setRequestHeader("authorization", `Bearer ${accessToken}`);
    request.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    request.setRequestHeader("x-upsert", "false");
    request.setRequestHeader(
      "content-type",
      file.type || "application/octet-stream",
    );

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve({ path });
        return;
      }
      /* Storage returns a JSON body with a `message`. Surface it rather than a
         bare status code — but translate the three that arrive as database
         jargon, because "new row violates row-level security policy" tells the
         person at the keyboard nothing about what to do next. */
      let message = `Upload failed (${request.status}).`;
      try {
        const parsed = JSON.parse(request.responseText) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // Non-JSON body — keep the status message.
      }
      reject(new Error(humanizeStorageError(message)));
    });

    request.addEventListener("error", () =>
      reject(new Error("Upload failed — check your connection.")),
    );
    request.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));

    signal?.addEventListener("abort", () => request.abort(), { once: true });

    request.send(file);
  });
}
