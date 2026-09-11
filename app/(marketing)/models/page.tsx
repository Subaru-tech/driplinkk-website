import { PackageSearch } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketplaceModelCard } from "@/components/marketing/marketplace-model-card";
import { ModelsFilters } from "@/components/marketing/models-filters";
import { ModelsPagination } from "@/components/marketing/models-pagination";
import { Section } from "@/components/marketing/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";
import { getMarketplaceCategoryCounts, getMarketplaceModels } from "@/driplink-web-backend";

export const metadata: Metadata = {
  title: "Browse 3D Models",
  description:
    "Explore community-crafted 3D models on DripLink. Claim free models into your library or send them straight to print.",
};

export const dynamic = "force-dynamic";

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

async function Results({
  category,
  license,
  search,
  sort,
  page,
}: {
  category?: string;
  license?: string;
  search?: string;
  sort?: "newest" | "price_low" | "price_high";
  page: number;
}) {
  const { data } = await getMarketplaceModels({
    category,
    licenseType: license,
    search,
    sort,
    page,
    pageSize: 12,
  });

  const { models, total, totalPages } = data;

  if (models.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        size="lg"
        message={
          search || category || license
            ? "No models match your current filters."
            : "No models have been published yet. The first one could be yours."
        }
      />
    );
  }

  return (
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
        }}
      />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <SkeletonGroup label="Loading models" className={GRID}>
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="aspect-4/3 w-full rounded-[var(--radius-card)]" />
      ))}
    </SkeletonGroup>
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
  const sort =
    sortParam === "price_low" || sortParam === "price_high" || sortParam === "newest"
      ? sortParam
      : "newest";

  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const { data: counts } = await getMarketplaceCategoryCounts();

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-semibold text-fg md:text-4xl">
            3D Model Marketplace
          </h1>
          <p className="max-w-2xl text-base text-muted">
            Explore 3D models published by the community. Claim free models directly into your
            library, modify them, or send them straight to print.
          </p>
        </div>

        <Suspense fallback={null}>
          <ModelsFilters counts={counts} />
        </Suspense>

        <Suspense
          key={`${category ?? ""}-${license ?? ""}-${search ?? ""}-${sort}-${page}`}
          fallback={<ResultsSkeleton />}
        >
          <Results
            category={category}
            license={license}
            search={search}
            sort={sort}
            page={page}
          />
        </Suspense>
      </div>
    </Section>
  );
}
