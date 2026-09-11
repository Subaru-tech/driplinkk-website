"use client";

import { Box, Download, Heart, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { MODEL_LICENSES, getModelStats, type ModelLicenseType } from "@/lib/marketplace";
import type { MarketplaceModel } from "@/lib/types";

export function MarketplaceModelCard({ model }: { model: MarketplaceModel }) {
  const [favorited, setFavorited] = useState(false);

  const license = MODEL_LICENSES[model.license_type as ModelLicenseType] ?? {
    label: model.license_type,
    badge: model.license_type,
  };

  const previewImage =
    model.preview_image_paths && model.preview_image_paths.length > 0
      ? model.preview_image_paths[0]
      : null;

  const isFree = model.price === 0;
  const stats = getModelStats(model.id);
  const sellerName = model.seller_name || model.seller?.full_name || "DripLink Creator";

  return (
    <div
      id={`model-card-${model.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-xl hover:shadow-black/25"
    >
      {/* 3D Preview / Image Viewport */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-raised">
        <Link href={`/models/${model.id}`} className="block size-full" tabIndex={-1}>
          {previewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImage}
              alt={model.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-raised to-surface">
              <Box className="size-10 text-faint group-hover:text-muted transition-colors" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </Link>

        {/* License Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-canvas/80 px-2 py-0.5 text-[10px] font-medium text-fg backdrop-blur-sm border border-line/50">
          <ShieldCheck className="size-3 text-accent" aria-hidden="true" />
          <span>{license.badge}</span>
        </div>

        {/* Wishlist / Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFavorited((prev) => !prev);
          }}
          aria-label={favorited ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-canvas/80 text-muted backdrop-blur-sm border border-line/60 transition-colors hover:text-red-400 hover:bg-canvas"
        >
          <Heart
            className={`size-3.5 transition-transform active:scale-125 ${
              favorited ? "fill-red-500 text-red-500" : ""
            }`}
          />
        </button>

        {/* Formats Strip Tag */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {stats.formats.slice(0, 3).map((fmt) => (
            <span
              key={fmt}
              className="rounded bg-canvas/90 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-muted backdrop-blur-sm border border-line/60"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Details Container */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="flex flex-col gap-1.5">
          <Link
            href={`/models/${model.id}`}
            className="line-clamp-1 font-display text-sm font-semibold text-fg hover:text-accent transition-colors"
            title={model.title}
          >
            {model.title}
          </Link>

          <p className="line-clamp-1 text-xs text-muted">
            {model.category ? (
              <span className="font-medium text-fg/80">{model.category} · </span>
            ) : null}
            <span>by {sellerName}</span>
          </p>

          {/* Social Proof: Rating & Downloads */}
          <div className="flex items-center gap-3 text-xs text-muted pt-1">
            <span className="flex items-center gap-1 font-semibold text-fg">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span>{stats.rating}</span>
            </span>
            <span className="text-faint">·</span>
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <Download className="size-3 text-faint" />
              <span>{stats.downloads} downloads</span>
            </span>
          </div>
        </div>

        {/* Price & Primary Action */}
        <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-medium tracking-wider text-faint">
              License Price
            </span>
            <span className="font-mono text-base font-bold text-fg">
              {isFree ? (
                <span className="text-accent">Free</span>
              ) : (
                formatCurrency(model.price)
              )}
            </span>
          </div>

          <Link
            href={`/models/${model.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg transition-all duration-150 hover:border-line-strong hover:bg-raised hover:text-accent group-hover:border-accent/40"
          >
            View Model →
          </Link>
        </div>
      </div>
    </div>
  );
}
