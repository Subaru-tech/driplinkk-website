"use client";

import { Filter, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input, Select } from "@/components/ui/input";
import { CATEGORY_LIST, MODEL_LICENSE_LIST } from "@/lib/marketplace";
import { cn } from "@/lib/cn";

export const MODEL_SORTS = {
  newest: { label: "Newest first" },
  price_low: { label: "Price: low to high" },
  price_high: { label: "Price: high to low" },
} as const;

export function ModelsFilters({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const category = searchParams.get("category") ?? "";
  const license = searchParams.get("license") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    // Reset to page 1 on filter change
    if (!("page" in next)) {
      params.delete("page");
    }
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;
    const timer = setTimeout(() => apply({ q: search }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            id="models-search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search models by title or description..."
            aria-label="Search models"
            className="pl-9"
          />
        </div>

        <Select
          id="models-sort-select"
          value={sort}
          onChange={(event) => apply({ sort: event.target.value })}
          aria-label="Sort models"
          className="sm:w-56"
        >
          {Object.entries(MODEL_SORTS).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted mr-1">Category:</span>
          <FilterChip
            label="All Categories"
            active={!category}
            onClick={() => apply({ category: "" })}
          />
          {CATEGORY_LIST.map((option) => (
            <FilterChip
              key={option.id}
              label={option.label}
              count={counts[option.label] ?? counts[option.id]}
              active={category.toLowerCase() === option.label.toLowerCase() || category === option.id}
              onClick={() => apply({ category: option.label })}
            />
          ))}
        </div>

        {/* License Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted mr-1">License:</span>
          <FilterChip
            label="All Licenses"
            active={!license}
            onClick={() => apply({ license: "" })}
          />
          {MODEL_LICENSE_LIST.map((lic) => (
            <FilterChip
              key={lic.id}
              label={lic.badge}
              active={license === lic.id}
              onClick={() => apply({ license: lic.id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-2 min-h-[44px] sm:min-h-0 sm:py-1 sm:px-3 text-xs font-medium transition-colors cursor-pointer inline-flex items-center justify-center",
        active
          ? "border-accent bg-accent-muted text-accent shadow-xs"
          : "border-line-control text-muted hover:bg-raised hover:text-fg"
      )}
    >
      {label}
      {count ? <span className="ml-1.5 text-faint">({count})</span> : null}
    </button>
  );
}
