"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input, Select } from "@/components/ui/input";
import { CATEGORY_LIST, LISTING_SORTS } from "@/lib/marketplace";
import { cn } from "@/lib/cn";

/* Filter state lives in the URL, same as the dashboard's model toolbar: a
   filtered marketplace view should be linkable and survive a refresh. */
export function ModelsFilters({ counts }: { counts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }));
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;
    const timer = setTimeout(() => apply({ q: search }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search models"
            aria-label="Search models"
            className="pl-9"
          />
        </div>

        <Select
          value={sort}
          onChange={(event) => apply({ sort: event.target.value })}
          aria-label="Sort models"
          className="sm:w-52"
        >
          {Object.entries(LISTING_SORTS).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryChip label="All" active={!category} onClick={() => apply({ category: "" })} />
        {CATEGORY_LIST.map((option) => (
          <CategoryChip
            key={option.id}
            label={option.label}
            count={counts[option.id]}
            active={category === option.id}
            onClick={() => apply({ category: option.id })}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryChip({
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
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent-muted text-accent"
          : "border-line-control text-muted hover:bg-raised hover:text-fg",
      )}
    >
      {label}
      {count ? <span className="ml-1.5 text-faint">{count}</span> : null}
    </button>
  );
}
