"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { MarketplaceSidebarFilters, MarketplaceTopBar } from "./models-filters";

export function ModelsCatalogLayout({
  total,
  counts,
  children,
}: {
  total: number;
  counts: Record<string, number>;
  children: React.ReactNode;
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div id="all-models" className="flex flex-col gap-6 pt-4 scroll-mt-6">
      <MarketplaceTopBar
        total={total}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
      />

      <div className="flex gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block w-64 shrink-0 sticky top-20">
          <MarketplaceSidebarFilters counts={counts} />
        </div>

        {/* Mobile Filter Drawer / Modal */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-canvas/80 backdrop-blur-sm">
            <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-surface p-6 shadow-xl border-l border-line">
              <div className="flex items-center justify-between pb-4 border-b border-line">
                <span className="font-display font-semibold text-fg">Catalog Filters</span>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-md p-1.5 text-muted hover:text-fg hover:bg-raised"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="py-4">
                <MarketplaceSidebarFilters counts={counts} className="border-0 bg-transparent p-0" />
              </div>

              <div className="mt-auto pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full rounded-lg bg-accent py-2.5 text-center text-xs font-semibold text-accent-contrast"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Catalog Main Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
