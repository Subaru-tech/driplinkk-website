import { PackageSearch } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturedModels } from "@/components/marketing/featured-models";
import { MarketplaceModelCard } from "@/components/marketing/marketplace-model-card";
import { ModelsCatalogLayout } from "@/components/marketing/models-catalog-layout";
import { ModelsHeader } from "@/components/marketing/models-header";
import { ModelsPagination } from "@/components/marketing/models-pagination";
import { Section } from "@/components/marketing/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";
import { getMarketplaceCategoryCounts, getMarketplaceModels } from "@/driplink-web-backend";

export const metadata: Metadata = {
  title: "Browse 3D Models & CAD Marketplace — DripLink",
  description:
    "Discover, download, customize, and build from a growing library of 3D models and CAD parts. Ready for 3D printing and LeaFF OS.",
};

export const dynamic = "force-dynamic";

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

async function Results({
  category,
  license,
  search,
  sort,
  page,
  price,
  counts,
}: {
  category?: string;
  license?: string;
  search?: string;
  sort?: "newest" | "price_low" | "price_high";
  page: number;
  price?: string;
  counts: Record<string, number>;
}) {
  const { data } = await getMarketplaceModels({
    category,
    licenseType: license,
    search,
    sort,
    page,
    pageSize: 12,
  });

  let models = data.models;

  // Optional client-side price filter if specified
  if (price === "free") {
    models = models.filter((m) => m.price === 0);
  } else if (price === "paid") {
    models = models.filter((m) => m.price > 0);
  }

  const total = data.total;
  const totalPages = data.totalPages;

  if (models.length === 0) {
    return (
      <ModelsCatalogLayout total={0} counts={counts}>
        <EmptyState
          icon={PackageSearch}
          size="lg"
          message={
            search || category || license || price
              ? "No models match your current filters. Try resetting your search or category."
              : "No models have been published yet in this category. Be the first to publish one!"
          }
        />
      </ModelsCatalogLayout>
    );
  }

  return (
    <ModelsCatalogLayout total={total} counts={counts}>
      <div className="flex flex-col gap-8">
        <div className={GRID}>
          {models.map((model) => (
            <MarketplaceModelCard key={model.id} model={model} />
          ))}
        </div>

        <ModelsPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          searchParams={{
            category,
            license,
            q: search,
            sort,
            price,
          }}
        />
      </div>
    </ModelsCatalogLayout>
  );
}

function ResultsSkeleton({ counts }: { counts: Record<string, number> }) {
  return (
    <ModelsCatalogLayout total={0} counts={counts}>
      <SkeletonGroup label="Loading models" className={GRID}>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-4/3 w-full rounded-xl" />
        ))}
      </SkeletonGroup>
    </ModelsCatalogLayout>
  );
}

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const license = typeof params.license === "string" ? params.license : undefined;
  const search = typeof params.q === "string" ? params.q : undefined;
  const sortParam = typeof params.sort === "string" ? params.sort : undefined;
  const price = typeof params.price === "string" ? params.price : undefined;

  const sort =
    sortParam === "price_low" || sortParam === "price_high" || sortParam === "newest"
      ? sortParam
      : "newest";

  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [{ data: counts }, { data: initialData }] = await Promise.all([
    getMarketplaceCategoryCounts(),
    getMarketplaceModels({ page: 1, pageSize: 4, sort: "newest" }),
  ]);

  const showFeatured = page === 1 && !search && !category && !license;

  return (
    <Section>
      <div className="flex flex-col gap-10">
        {/* Marketplace Header & Category Strip */}
        <Suspense fallback={null}>
          <ModelsHeader counts={counts} />
        </Suspense>

        {/* Featured / Trending Spotlight */}
        {showFeatured && (
          <FeaturedModels models={initialData.models} />
        )}

        {/* Catalog Results with Two-Column Filter Layout */}
        <Suspense
          key={`${category ?? ""}-${license ?? ""}-${search ?? ""}-${sort}-${page}-${price ?? ""}`}
          fallback={<ResultsSkeleton counts={counts} />}
        >
          <Results
            category={category}
            license={license}
            search={search}
            sort={sort}
            page={page}
            price={price}
            counts={counts}
          />
        </Suspense>
      </div>
    </Section>
  );
}
