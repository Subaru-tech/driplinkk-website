import { LibraryBig } from "lucide-react";
import type { Metadata } from "next";
import { BackendNotice } from "@/components/dashboard/backend-notice";
import { LibraryCard } from "@/components/dashboard/library-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getLibrary } from "@/lib/queries";

export const metadata: Metadata = { title: "My Library" };

export default async function LibraryPage() {
  const { data: items, backendReady } = await getLibrary();

  return (
    <div className="flex flex-col gap-6">
      {backendReady ? null : <BackendNotice />}

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-xl font-semibold text-fg">My Library</h2>
        <p className="text-sm text-muted">
          Models you&apos;ve taken from the marketplace. Separate from the models you made
          yourself, which live under My Models.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={LibraryBig}
          size="lg"
          message="Nothing in your library yet."
          action={<ButtonLink href="/models">Browse models</ButtonLink>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <LibraryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
