"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileDropzone, UploadProgress, type PickedFile } from "@/components/upload/file-dropzone";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { renderThumbnail } from "@/lib/model-preview";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  nameFromFilename,
  rowErrorMessage,
  storagePathFor,
  uploadToStorage,
} from "@/lib/uploads";

/**
 * Upload existing model files from the browser — no desktop app needed.
 *
 * Files go straight to the private `model-files` bucket, then one `models` row
 * per file. If the row insert fails the uploaded object is removed again,
 * because an orphaned blob nothing points at is invisible storage the user
 * still pays for and can never delete from the UI.
 */

type ProgressEntry = { percent: number; error: string | null };

/**
 * Renders a preview image from the file the browser already has, uploads it to
 * the public `model-art` bucket, and points the row at it.
 *
 * Doing this client-side means no server-side mesh rendering: the machine that
 * has the mesh in memory is the one that draws it. Returns false on any
 * failure — every one of them is cosmetic.
 */
export async function attachThumbnail(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  {
    file,
    userId,
    table,
    id,
  }: { file: File; userId: string; table: "models" | "listings"; id: string },
): Promise<boolean> {
  const blob = await renderThumbnail(file);
  if (!blob) return false;

  const path = `${userId}/${table}-${id}.png`;
  const { error: uploadError } = await supabase.storage
    .from("model-art")
    .upload(path, blob, { contentType: "image/png", upsert: true });
  if (uploadError) return false;

  const { data } = supabase.storage.from("model-art").getPublicUrl(path);
  const { error } = await supabase
    .from(table)
    .update({ thumbnail_url: data.publicUrl })
    .eq("id", id);

  return !error;
}

export function UploadModelButton({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [uploading, setUploading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  function reset() {
    setFiles([]);
    setProgress({});
    setUploading(false);
    abortRef.current = null;
  }

  function close() {
    abortRef.current?.abort();
    setOpen(false);
    reset();
  }

  async function startUpload() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast("error", "Uploads aren't available yet — the backend isn't connected.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      toast("error", "Your session expired. Log in again.");
      router.push("/login");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setUploading(true);
    setProgress(Object.fromEntries(files.map((f) => [f.id, { percent: 0, error: null }])));

    let succeeded = 0;

    /* Sequential, not parallel: several 40 MB files at once starves each
       other's bandwidth and makes every progress bar crawl at the same time,
       which reads as a stall. */
    for (const picked of files) {
      const path = storagePathFor(session.user.id, picked.file.name);

      try {
        await uploadToStorage({
          bucket: "model-files",
          path,
          file: picked.file,
          accessToken: session.access_token,
          signal: controller.signal,
          onProgress: (percent) =>
            setProgress((current) => ({ ...current, [picked.id]: { percent, error: null } })),
        });

        const { data: row, error } = await supabase
          .from("models")
          .insert({
            owner_id: session.user.id,
            name: nameFromFilename(picked.file.name),
            storage_path: path,
          })
          .select("id")
          .single();

        if (error || !row) {
          await supabase.storage.from("model-files").remove([path]);
          throw new Error(rowErrorMessage(error?.code, "your library"));
        }

        succeeded += 1;

        /* Thumbnail last, and deliberately outside the failure path: the model
           is already saved, so a browser that can't do WebGL loses a picture,
           not an upload. The card falls back to its icon. */
        void attachThumbnail(supabase, {
          file: picked.file,
          userId: session.user.id,
          table: "models",
          id: row.id as string,
        }).then((ok) => ok && router.refresh());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setProgress((current) => ({
          ...current,
          [picked.id]: {
            percent: current[picked.id]?.percent ?? 0,
            error: error instanceof Error ? error.message : "Upload failed.",
          },
        }));
      }
    }

    setUploading(false);

    if (succeeded > 0) {
      toast("success", `${succeeded} file${succeeded === 1 ? "" : "s"} uploaded.`);
      router.refresh();
    }

    /* Only close when everything landed — a failed row stays on screen with
       its reason rather than vanishing behind a toast. */
    if (succeeded === files.length) {
      setOpen(false);
      reset();
    }
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Upload className="size-4" aria-hidden="true" />
        Upload model
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Upload a model"
        description="Drop an STL, 3MF, STEP or G-code file straight from your machine. No desktop app needed."
        className="max-h-[calc(100svh-2rem)] overflow-y-auto"
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {uploading ? "Cancel" : "Close"}
            </Button>
            <Button onClick={startUpload} loading={uploading} disabled={files.length === 0}>
              Upload {files.length > 0 ? files.length : ""}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FileDropzone files={files} onChange={setFiles} multiple disabled={uploading} />

          {Object.keys(progress).length > 0 ? (
            <div className="flex flex-col gap-3">
              {files.map((picked) => {
                const entry = progress[picked.id];
                if (!entry) return null;
                return (
                  <UploadProgress
                    key={picked.id}
                    name={picked.file.name}
                    percent={entry.percent}
                    error={entry.error}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
