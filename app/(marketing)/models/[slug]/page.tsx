import { Box, ShieldCheck, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AcquirePanel } from "@/components/marketing/acquire-panel";
import { Section } from "@/components/marketing/section";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/format";
import { CATEGORIES, LICENSES } from "@/lib/marketplace";
import { getLibraryEntry, getPublicListing, getUnifiedUser } from "@/driplink-web-backend";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/models/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { data: listing } = await getPublicListing(slug);

  if (!listing) return { title: "Model not found" };

  return {
    title: listing.title,
    description: listing.description?.slice(0, 160) ?? `A model by ${listing.seller?.studio_name}.`,
  };
}

export default async function ModelPage({ params }: PageProps<"/models/[slug]">) {
  const { slug } = await params;
  const { data: listing } = await getPublicListing(slug);

  if (!listing) notFound();

  /* Ownership decides what the buy box says, so it's read on the server —
     the page would otherwise flash "Add to library" at someone who already
     has it. */
  const [user, libraryEntry] = await Promise.all([
    getUnifiedUser(),
    getLibraryEntry(listing.id),
  ]);

  const category = listing.category ? CATEGORIES[listing.category as keyof typeof CATEGORIES] : null;
  const license = LICENSES[listing.license as keyof typeof LICENSES];
  const free = listing.price_inr === 0;


  return (
    <Section>
      <div className="flex flex-col gap-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* ------------------------------------------------ Preview */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-4/3 overflow-hidden rounded-[var(--radius-card)] border border-line bg-raised">
              {listing.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- storage origin is runtime-configured
                <img src={listing.thumbnail_url} alt="" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center">
                  <Box className="size-10 text-faint" strokeWidth={1.5} aria-hidden="true" />
                </div>
              )}
            </div>

            {/* The mesh is the product. A public orbit-and-zoom viewer would
                hand over the geometry to anyone who opens the page, so the
                full 3D preview is part of what a buyer gets. */}
            <p className="text-xs text-muted">
              Rendered from the actual file. The interactive 3D view opens in your library after
              purchase.
            </p>
          </div>

          {/* -------------------------------------------------- Buy box */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="font-display text-3xl font-semibold text-balance text-fg">
                {listing.title}
              </h1>

              <p className="text-sm text-muted">
                by{" "}
                <span className="font-medium text-fg">
                  {listing.seller?.studio_name ?? "Unknown studio"}
                </span>
                {listing.published_at ? ` · published ${formatDate(listing.published_at)}` : null}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {category ? <StatusPill tone="neutral">{category}</StatusPill> : null}
                {free ? <StatusPill tone="accent">Free</StatusPill> : null}
                {listing.purchases > 0 ? (
                  <StatusPill tone="neutral">{listing.purchases} sold</StatusPill>
                ) : null}
              </div>
            </div>

            <AcquirePanel
              listingId={listing.id}
              priceInr={listing.price_inr}
              signedIn={Boolean(user)}
              owned={Boolean(libraryEntry)}
            />

            {license ? (
              <div className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-fg">{license.label}</p>
                  <p className="text-sm text-muted">{license.summary}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ------------------------------------------------ Description */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="flex flex-col gap-3">
            <CardTitle>About this model</CardTitle>
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted">
              {listing.description}
            </p>

            {listing.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Tag className="size-3.5 text-faint" aria-hidden="true" />
                {listing.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/models?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-line-control px-2.5 py-1 text-xs text-muted transition-colors hover:text-fg"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="flex flex-col gap-4">
            <CardTitle>What you get</CardTitle>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li>The model file, in your DripLink library — not a one-time download link.</li>
              <li>Open it in LeaFF OS to resize, modify or remix it, licence permitting.</li>
              <li>Send it to Mart for printing at any time, without re-uploading.</li>
            </ul>
          </Card>
        </div>
      </div>
    </Section>
  );
}
