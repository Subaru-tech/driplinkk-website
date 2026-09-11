"use client";

import { Box, Download, ExternalLink, Printer, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/format";
import { MODEL_LICENSES, type ModelLicenseType } from "@/lib/marketplace";
import type { AcquiredModel } from "@/lib/types";
import { getModelDownloadUrl } from "@/driplink-web-backend/actions/library";

export function AcquiredModelCard({ model }: { model: AcquiredModel }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  const license = MODEL_LICENSES[model.license_type as ModelLicenseType] ?? {
    label: model.license_type,
    badge: model.license_type,
  };

  const previewImage =
    model.preview_image_paths && model.preview_image_paths.length > 0
      ? model.preview_image_paths[0]
      : null;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await getModelDownloadUrl(model.model_id);
      setDownloading(false);

      if (!res.success || !res.downloadUrl) {
        toast("error", res.error || "Failed to generate download link.");
        return;
      }

      // Open download in a new window/trigger download
      const link = document.createElement("a");
      link.href = res.downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast("success", "Download link resolved. Starting download...");
    } catch {
      setDownloading(false);
      toast("error", "Error connecting to storage server.");
    }
  }

  return (
    <div
      id={`acquired-model-${model.model_id}`}
      className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-md"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-raised">
        {previewImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImage}
            alt={model.title}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <Box className="size-10 text-faint" strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-md bg-canvas/80 px-2 py-0.5 text-[11px] font-medium text-fg backdrop-blur-sm border border-line/50">
          <ShieldCheck className="size-3 text-accent" aria-hidden="true" />
          <span>{license.badge}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-fg" title={model.title}>
              {model.title}
            </h3>
          </div>

          <p className="line-clamp-1 text-xs text-muted">
            by {model.seller_name}
            {model.category ? ` · ${model.category}` : ""}
          </p>

          <p className="text-[11px] text-faint">
            Acquired {formatDate(model.acquired_at)}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-line/60">
          <Button
            id={`download-btn-${model.model_id}`}
            size="sm"
            loading={downloading}
            onClick={handleDownload}
            className="w-full justify-center gap-1.5"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Download File
          </Button>

          <div className="flex items-center gap-2">
            <ButtonLink
              href={`/models/${model.model_id}`}
              variant="secondary"
              size="sm"
              className="flex-1 justify-center gap-1 text-xs"
            >
              <ExternalLink className="size-3" aria-hidden="true" />
              Detail
            </ButtonLink>

            <ButtonLink
              href="/mart"
              variant="secondary"
              size="sm"
              className="flex-1 justify-center gap-1 text-xs"
            >
              <Printer className="size-3" aria-hidden="true" />
              Mart
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
