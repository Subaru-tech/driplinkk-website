import { Box, LibraryBig, SearchX } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BackendNotice } from "@/components/dashboard/backend-notice";
import { AcquiredModelCard } from "@/components/dashboard/acquired-model-card";
import { ModelCard, ModelCardSkeleton } from "@/components/dashboard/model-card";
import { ModelsToolbar } from "@/components/dashboard/models-toolbar";
import { UploadModelButton } from "@/components/dashboard/upload-model-button";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";
import { getModels, getUserAcquiredModels, MODEL_SORTS, type ModelSort } from "@/driplink-web-backend";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "My Models" };

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

type Tab = "created" | "acquired";

function isTab(value: string | undefined): value is Tab {
  return value === "created" || value === "acquired";
}

function isSort(value: string | undefined): value is ModelSort {
  return Boolean(value && value in MODEL_SORTS);
}

/* ------------------------------------------------------------------ tabs */

function TabStrip({ active, search }: { active: Tab; search?: string }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "created", label: "Created" },
    { id: "acquired", label: "Acquired" },
  ];

  return (
    <div className="flex gap-1 rounded-[var(--radius-control)] border border-line bg-surface p-1 w-fit">
      {tabs.map((tab) => {
        const params = new URLSearchParams();
        params.set("tab", tab.id);
        if (search) params.set("q", search);

        return (
          <a
            key={tab.id}
            href={`/dashboard/models?${params.toString()}`}
            aria-current={active === tab.id ? "page" : undefined}
            className={cn(
              "rounded-[calc(var(--radius-control)-2px)] px-4 py-1.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "bg-canvas text-fg shadow-sm"
                : "text-muted hover:text-fg",
            )}
          >
            {tab.label}
          </a>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- created */

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
              /* Two ways in, because there are two: model it in the desktop
                 app, or upload a file you already have. */
              <div className="flex flex-col gap-3 sm:flex-row">
                <UploadModelButton />
                <ButtonLink href="leaffos://new" variant="secondary" prefetch={false}>
                  Open LeaFF OS
                </ButtonLink>
              </div>
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

/* -------------------------------------------------------------- acquired */

async function LibraryGrid() {
  const { data: models, backendReady } = await getUserAcquiredModels();

  if (models.length === 0) {
    return (
      <>
        {backendReady ? null : <BackendNotice />}
        <EmptyState
          icon={LibraryBig}
          size="lg"
          message="Nothing acquired yet."
          action={<ButtonLink href="/models">Browse models</ButtonLink>}
        />
      </>
    );
  }

  return (
    <div className={GRID}>
      {models.map((item) => (
        <AcquiredModelCard key={item.acquisition_id} model={item} />
      ))}
    </div>
  );
}

function LibraryGridSkeleton() {
  return (
    <SkeletonGroup label="Loading acquired models" className={GRID}>
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="aspect-4/3 w-full" />
      ))}
    </SkeletonGroup>
  );
}

/* ------------------------------------------------------------------ page */

export default async function ModelsPage({ searchParams }: PageProps<"/dashboard/models">) {
  const params = await searchParams;
  const tabParam = typeof params.tab === "string" ? params.tab : undefined;
  const tab: Tab = isTab(tabParam) ? tabParam : "created";
  const search = typeof params.q === "string" ? params.q : undefined;
  const sortParam = typeof params.sort === "string" ? params.sort : undefined;
  const sort = isSort(sortParam) ? sortParam : undefined;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-semibold text-fg">My Models</h2>
        {tab === "created" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Suspense>
              <ModelsToolbar />
            </Suspense>
            <UploadModelButton />
          </div>
        ) : null}
      </div>

      <TabStrip active={tab} search={search} />

      {tab === "created" ? (
        <Suspense key={`created-${search ?? ""}-${sort ?? ""}`} fallback={<ModelGridSkeleton />}>
          <ModelGrid search={search} sort={sort} />
        </Suspense>
      ) : (
        <Suspense key="acquired" fallback={<LibraryGridSkeleton />}>
          <LibraryGrid />
        </Suspense>
      )}
    </div>
  );
}
