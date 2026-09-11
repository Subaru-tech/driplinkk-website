import { Box, Calendar, FileBox, ShieldCheck, Tag, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModelAcquirePanel } from "@/components/marketing/model-acquire-panel";
import { Section } from "@/components/marketing/section";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/format";
import { MODEL_LICENSES, type ModelLicenseType } from "@/lib/marketplace";
import {
  getMarketplaceModelById,
  getPublicListing,
  getUnifiedUser,
  isModelAcquired,
} from "@/driplink-web-backend";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: model } = await getMarketplaceModelById(id);

  if (model) {
    return {
      title: `${model.title} — 3D Model`,
      description:
        model.description?.slice(0, 160) ??
        `3D Model by ${model.seller_name || "DripLink Creator"} on DripLink.`,
    };
  }

  const { data: listing } = await getPublicListing(id);
  if (listing) {
    return {
      title: `${listing.title} — 3D Model`,
      description: listing.description?.slice(0, 160) ?? "3D Model on DripLink.",
    };
  }

  return { title: "Model Not Found — DripLink" };
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Try to fetch from models table
  const { data: model } = await getMarketplaceModelById(id);

  // 2. Fallback for legacy listings if accessed by slug/id
  if (!model) {
    const { data: listing } = await getPublicListing(id);
    if (!listing) notFound();

    // Map listing to model format for display
    return renderListingFallback(listing);
  }

  const [user, owned] = await Promise.all([
    getUnifiedUser(),
    isModelAcquired(model.id),
  ]);

  const license = MODEL_LICENSES[model.license_type as ModelLicenseType] ?? {
    label: model.license_type,
    badge: model.license_type,
    summary: "Standard 3D printing license.",
  };

  const isFree = model.price === 0;
  const previewImages = model.preview_image_paths || [];
  const primaryImage = previewImages.length > 0 ? previewImages[0] : null;
  const sellerName = model.seller_name || model.seller?.full_name || "DripLink Creator";

  return (
    <Section>
      <div className="flex flex-col gap-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted">
          <Link href="/models" className="hover:text-fg transition-colors">
            Marketplace
          </Link>
          <span>/</span>
          {model.category ? (
            <>
              <Link
                href={`/models?category=${encodeURIComponent(model.category)}`}
                className="hover:text-fg transition-colors"
              >
                {model.category}
              </Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-fg font-medium truncate max-w-xs">{model.title}</span>
        </nav>

        {/* Top Grid: Previews + Buy Box */}
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Preview Imagery */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-4/3 overflow-hidden rounded-[var(--radius-card)] border border-line bg-raised">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage}
                  alt={model.title}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center">
                  <Box className="size-12 text-faint" strokeWidth={1.5} aria-hidden="true" />
                </div>
              )}
            </div>

            {previewImages.length > 1 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {previewImages.map((imgPath, idx) => (
                  <div
                    key={idx}
                    className="relative size-16 shrink-0 overflow-hidden rounded-md border border-line bg-raised"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgPath} alt="" className="size-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}

            <p className="text-xs text-muted">
              Pre-rendered model visual. Full mesh and manufacturing CAD files become accessible
              directly in your account library after claiming.
            </p>
          </div>

          {/* Buy Box */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-balance text-fg">
                {model.title}
              </h1>

              <div className="flex items-center gap-2 text-sm text-muted">
                <User className="size-4 text-faint" aria-hidden="true" />
                <span>
                  by <span className="font-medium text-fg">{sellerName}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-faint" aria-hidden="true" />
                  {formatDate(model.created_at)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {model.category ? (
                  <StatusPill tone="neutral">{model.category}</StatusPill>
                ) : null}
                {isFree ? (
                  <StatusPill tone="accent">Free Claim</StatusPill>
                ) : (
                  <StatusPill tone="neutral">Paid</StatusPill>
                )}
                <StatusPill tone="neutral">{license.badge}</StatusPill>
              </div>
            </div>

            {/* Interactive Acquire Panel */}
            <ModelAcquirePanel
              modelId={model.id}
              price={model.price}
              signedIn={Boolean(user)}
              owned={owned}
            />

            {/* License Breakdown Card */}
            <div className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-fg">{license.label}</p>
                <p className="text-xs text-muted leading-relaxed">{license.summary}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Details Grid */}
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="flex flex-col gap-4">
            <CardTitle>About this model</CardTitle>
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted">
              {model.description || "No description provided for this model."}
            </p>
          </Card>

          <Card className="flex flex-col gap-4">
            <CardTitle>What you receive</CardTitle>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li className="flex items-start gap-2">
                <FileBox className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>Secure access in your personal library with on-demand download links.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>Verified license rights snapshot retained with your acquisition.</span>
              </li>
              <li className="flex items-start gap-2">
                <Box className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>One-click bridge to Mart for on-demand 3D printing and shipping.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Section>
  );
}

// Fallback renderer for legacy listings if visited
function renderListingFallback(listing: {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price_inr: number;
  thumbnail_url: string | null;
  license: string;
  seller: { studio_name: string } | null;
}) {
  return (
    <Section>
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl font-semibold text-fg">{listing.title}</h1>
        <p className="text-muted">{listing.description}</p>
        <div className="pt-4">
          <Link href="/models" className="text-accent hover:underline text-sm">
            ← Back to Models Marketplace
          </Link>
        </div>
      </div>
    </Section>
  );
}
