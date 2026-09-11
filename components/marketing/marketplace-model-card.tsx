import { Box, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { MODEL_LICENSES, type ModelLicenseType } from "@/lib/marketplace";
import type { MarketplaceModel } from "@/lib/types";

export function MarketplaceModelCard({ model }: { model: MarketplaceModel }) {
  const license = MODEL_LICENSES[model.license_type as ModelLicenseType] ?? {
    label: model.license_type,
    badge: model.license_type,
  };

  const previewImage = model.preview_image_paths && model.preview_image_paths.length > 0
    ? model.preview_image_paths[0]
    : null;

  const isFree = model.price === 0;

  return (
    <Link
      href={`/models/${model.id}`}
      id={`model-card-${model.id}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg hover:shadow-black/20 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-raised">
        {previewImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImage}
            alt={model.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
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

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="flex flex-col gap-1">
          <p className="line-clamp-1 text-sm font-medium text-fg" title={model.title}>
            {model.title}
          </p>
          <p className="line-clamp-1 text-xs text-muted">
            by {model.seller_name || model.seller?.full_name || "DripLink Creator"}
            {model.category ? ` · ${model.category}` : ""}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-line/60 pt-3">
          <span className="font-mono text-sm font-semibold text-fg">
            {isFree ? (
              <span className="text-accent font-medium">Free</span>
            ) : (
              formatCurrency(model.price)
            )}
          </span>
          <span className="text-xs text-muted group-hover:text-fg transition-colors">
            View model →
          </span>
        </div>
      </div>
    </Link>
  );
}
