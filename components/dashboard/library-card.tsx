"use client";

import { Box, Download, Eye, Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ModelViewer } from "@/components/viewer/model-viewer";
import { formatDate } from "@/lib/format";
import { LICENSES } from "@/lib/marketplace";
import { canPreview } from "@/lib/model-preview";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { LibraryItem } from "@/lib/types";

/**
 * A model the user has access to.
 *
 * Both actions mint a short-lived signed URL at click time. Nothing here has a
 * permanent link to the file — the storage policy checks the library table on
 * every request, so revoking access is a row deletion, not a URL rotation.
 */
export function LibraryCard({ item }: { item: LibraryItem }) {
  const toast = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const listing = item.listing;
  const path = listing?.file_path ?? null;
  const viewable = Boolean(path && canPreview(path));
  const license = listing ? LICENSES[listing.license as keyof typeof LICENSES] : null;

  async function signedUrl(download: boolean): Promise<string | null> {
    if (!path) return null;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast("error", "The backend isn't connected.");
      return null;
    }

    const { data, error } = await supabase.storage
      .from("model-files")
      .createSignedUrl(path, 300, download ? { download: true } : undefined);

    if (error || !data) {
      toast("error", "Couldn't open that file. Ask the creator if it was removed.");
      return null;
    }
    return data.signedUrl;
  }

  async function startDownload() {
    setBusy(true);
    const url = await signedUrl(true);
    setBusy(false);
    if (url) window.location.assign(url);
  }

  async function openPreview() {
    setPreviewUrl("pending");
    const url = await signedUrl(false);
    setPreviewUrl(url);
  }

  if (!listing) return null;

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        <div className="relative aspect-4/3 overflow-hidden bg-raised">
          {listing.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage origin is runtime-configured
            <img
              src={listing.thumbnail_url}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center">
              <Box className="size-8 text-faint" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <Link
            href={`/models/${listing.slug}`}
            className="truncate text-sm font-medium text-fg hover:text-accent"
            title={listing.title}
          >
            {listing.title}
          </Link>
          <p className="truncate text-xs text-muted">
            {listing.seller?.studio_name ?? "Unknown studio"}
          </p>
          <p className="text-xs text-faint">
            Added {formatDate(item.acquired_at)}
            {license ? ` · ${license.label}` : ""}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {viewable ? (
              <button
                type="button"
                onClick={openPreview}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-raised hover:text-fg"
              >
                <Eye className="size-3.5" aria-hidden="true" />
                Preview
              </button>
            ) : null}

            <button
              type="button"
              onClick={startDownload}
              disabled={!path || busy}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-raised hover:text-fg disabled:opacity-40"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Download
            </button>

            <Link
              href="/mart"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-line-control px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-raised hover:text-fg"
            >
              <Printer className="size-3.5" aria-hidden="true" />
              Print
            </Link>
          </div>
        </div>
      </div>

      <Modal
        open={previewUrl !== null}
        onClose={() => setPreviewUrl(null)}
        title={listing.title}
        description="Rendered in your browser from the file you own."
        className="max-w-[720px]"
      >
        {previewUrl && previewUrl !== "pending" ? (
          <ModelViewer url={previewUrl} filename={path ?? listing.title} className="aspect-4/3 w-full" />
        ) : (
          <div className="grid aspect-4/3 w-full place-items-center rounded-[var(--radius-card)] border border-line bg-raised">
            <span className="text-sm text-muted">Preparing preview…</span>
          </div>
        )}
      </Modal>
    </>
  );
}
