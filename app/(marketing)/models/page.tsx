import { PackageSearch } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingCard } from "@/components/marketing/listing-card";
import { ModelsFilters } from "@/components/marketing/models-filters";
import { Section } from "@/components/marketing/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";
import { getCategoryCounts, getPublicListings } from "@/lib/queries";
import { isCategory, isListingSort } from "@/lib/marketplace";

export const metadata: Metadata = {
  title: "Models",
  description:
    "Browse models made by the DripLink community. Buy the file, or send it straight to print.",
};

/* Published listings change whenever a seller hits Publish, and the browse
   view is the first thing they check afterwards. Rendering it per request
   keeps that immediate. */
export const dynamic = "force-dynamic";

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

async function Results({
  category,
  search,
  sort,
}: {
  category?: string;
  search?: string;
  sort?: string;
}) {
  const { data: listings } = await getPublicListings({
    category: isCategory(category) ? category : undefined,
    search,
    sort: isListingSort(sort) ? sort : undefined,
  });

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        size="lg"
        message={
          search || category
            ? "No models match that yet."
            : "No models have been published yet. The first one could be yours."
        }
      />
    );
  }

  return (
    <div className={GRID}>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <SkeletonGroup label="Loading models" className={GRID}>
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="aspect-4/3 w-full" />
      ))}
    </SkeletonGroup>
  );
}

export default async function ModelsPage({ searchParams }: PageProps<"/models">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.q === "string" ? params.q : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;

  const { data: counts } = await getCategoryCounts();

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-semibold text-fg md:text-4xl">Models</h1>
          <p className="max-w-2xl text-base text-muted">
            Models published by the DripLink community. Buy the file to open and modify in LeaFF
            OS, or send it straight to Mart and get the printed part.
          </p>
        </div>

        <Suspense fallback={null}>
          <ModelsFilters counts={counts} />
        </Suspense>

        <Suspense key={`${category ?? ""}-${search ?? ""}-${sort ?? ""}`} fallback={<ResultsSkeleton />}>
          <Results category={category} search={search} sort={sort} />
        </Suspense>
      </div>
    </Section>
  );
}
