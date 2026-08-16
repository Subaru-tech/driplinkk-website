import { Box, SearchX } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BackendNotice } from "@/components/dashboard/backend-notice";
import { ModelCard, ModelCardSkeleton } from "@/components/dashboard/model-card";
import { ModelsToolbar } from "@/components/dashboard/models-toolbar";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonGroup } from "@/components/ui/skeleton";
import { getModels, MODEL_SORTS, type ModelSort } from "@/lib/queries";

export const metadata: Metadata = { title: "My Models" };

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

function isSort(value: string | undefined): value is ModelSort {
  return Boolean(value && value in MODEL_SORTS);
}

async function ModelGrid({ search, sort }: { search?: string; sort?: ModelSort }) {
  const { data: models, backendReady } = await getModels(undefined, { search, sort });

  if (models.length === 0) {
    return (
      <>
        {backendReady ? null : <BackendNotice />}
        {search ? (
          <EmptyState
            icon={SearchX}
            size="lg"
            message={`No models match "${search}".`}
          />
        ) : (
          /* Spec §6.2 — larger than the dashboard-tile empty state. */
          <EmptyState
            icon={Box}
            size="lg"
            message="You haven't created any models yet"
            action={
              <ButtonLink href="leaffos://new" prefetch={false}>
                Open LeaFF OS
              </ButtonLink>
            }
          />
        )}
      </>
    );
  }

  return (
    <div className={GRID}>
      {models.map((model) => (
        <ModelCard key={model.id} model={model} />
      ))}
    </div>
  );
}

/** Skeleton grid matching the card shape — spec §6.2 (never a spinner here). */
function ModelGridSkeleton() {
  return (
    <SkeletonGroup label="Loading models" className={GRID}>
      {Array.from({ length: 8 }, (_, index) => (
        <ModelCardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

export default async function ModelsPage({ searchParams }: PageProps<"/dashboard/models">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : undefined;
  const sortParam = typeof params.sort === "string" ? params.sort : undefined;
  const sort = isSort(sortParam) ? sortParam : undefined;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-semibold text-fg">My Models</h2>
        <Suspense>
          <ModelsToolbar />
        </Suspense>
      </div>

      <Suspense key={`${search ?? ""}-${sort ?? ""}`} fallback={<ModelGridSkeleton />}>
        <ModelGrid search={search} sort={sort} />
      </Suspense>
    </div>
  );
}
