"use client";

import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListingStatusPill } from "@/components/seller/listing-row";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatBytes } from "@/lib/uploads";
import { CATEGORY_LIST, LICENSE_LIST, publishBlockers } from "@/lib/marketplace";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

/**
 * Where a draft becomes a product.
 *
 * Publishing is gated on the same four things the database's
 * `check_listing_publishable` trigger enforces. The form shows what's missing
 * up front rather than letting someone hit Publish and receive a Postgres
 * exception — but the trigger stays, because a form is a courtesy and a
 * constraint is a guarantee.
 */
export function ListingEditor({ listing }: { listing: Listing }) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description ?? "");
  const [category, setCategory] = useState(listing.category ?? "");
  const [license, setLicense] = useState(listing.license);
  const [price, setPrice] = useState(String(listing.price_inr));
  const [tags, setTags] = useState(listing.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState(listing.status);

  const parsedPrice = Number.parseInt(price, 10);
  const blockers = publishBlockers({
    title,
    description,
    category: category || null,
    file_path: listing.file_path,
  });

  function fields() {
    return {
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      license,
      price_inr: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
      tags: tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8),
    };
  }

  async function save(nextStatus?: Listing["status"]) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast("error", "Can't save — the backend isn't connected.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("listings")
      .update({ ...fields(), ...(nextStatus ? { status: nextStatus } : {}) })
      .eq("id", listing.id);
    setSaving(false);

    if (error) {
      /* The publish trigger raises a plain-English message; show it rather
         than a generic failure, because it names exactly what's missing. */
      toast("error", error.message || "Couldn't save those changes.");
      return;
    }

    if (nextStatus) setStatus(nextStatus);
    toast(
      "success",
      nextStatus === "published"
        ? "Published. It's live on the marketplace."
        : nextStatus === "draft"
          ? "Unpublished. It's a draft again."
          : "Changes saved.",
    );
    router.refresh();
  }

  async function remove() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (error) {
      /* 23503 = someone's library still references it. */
      toast(
        "error",
        error.code === "23503"
          ? "Someone already has this in their library, so it can't be deleted. Archive it instead."
          : "Couldn't delete that listing.",
      );
      return;
    }
    if (listing.file_path) {
      await supabase.storage.from("model-files").remove([listing.file_path]);
      /* The rendered thumbnail is keyed on the listing id — remove it too,
         or it stays in the public bucket with nothing pointing at it. */
      const owner = listing.file_path.split("/")[0];
      await supabase.storage.from("model-art").remove([`${owner}/listings-${listing.id}.png`]);
    }
    toast("success", "Listing deleted.");
    router.push("/seller/listings");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/seller/listings"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All listings
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-semibold text-fg">{listing.title}</h2>
          <ListingStatusPill status={status} />
          {status === "published" ? (
            <Link
              href={`/models/${listing.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
            >
              View public page
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>

      <Card className="flex flex-col gap-5">
        <CardTitle>Listing details</CardTitle>

        <Field label="Title">
          {({ id }) => (
            <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} />
          )}
        </Field>

        <Field
          label="Description"
          hint="What it is, what it fits, how it prints. Buyers decide on this."
        >
          {({ id }) => (
            <Textarea
              id={id}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A two-part desk organiser that clips together without screws…"
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category">
            {({ id }) => (
              <Select id={id} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Choose a category…</option>
                {CATEGORY_LIST.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Price (₹)" hint="0 makes it free.">
            {({ id }) => (
              <Input
                id={id}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label="Tags" hint="Up to 8, comma separated. Used for search.">
          {({ id }) => (
            <Input
              id={id}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="desk, organiser, modular"
            />
          )}
        </Field>

        <Field
          label="Licence"
          hint={LICENSE_LIST.find((option) => option.id === license)?.summary}
        >
          {({ id }) => (
            <Select id={id} value={license} onChange={(e) => setLicense(e.target.value)}>
              {LICENSE_LIST.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => save()} loading={saving} variant="secondary">
            Save changes
          </Button>

          {status === "published" ? (
            <Button onClick={() => save("draft")} loading={saving} variant="ghost">
              Unpublish
            </Button>
          ) : (
            <Button
              onClick={() => save("published")}
              loading={saving}
              disabled={blockers.length > 0}
            >
              Publish
            </Button>
          )}
        </div>

        {blockers.length > 0 && status !== "published" ? (
          <div className="rounded-[var(--radius-control)] border border-warning/40 bg-warning-muted p-3">
            <p className="text-sm font-medium text-fg">Before this can go live</p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {blockers.map((blocker) => (
                <li key={blocker} className="text-sm text-muted">
                  · {blocker}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-2">
        <CardTitle>File</CardTitle>
        <CardDescription>
          {listing.file_path
            ? `${listing.file_path.split("/").pop()}${listing.file_bytes ? ` · ${formatBytes(listing.file_bytes)}` : ""}`
            : "No file uploaded."}
        </CardDescription>
        <p className="text-sm text-muted">
          Stored privately. Buyers get a time-limited download link after purchase — the file is
          never served from a public URL.
        </p>
      </Card>

      {/* Deletion is refused by the database for a published listing, and
          refused again if anyone has it in their library. Rather than offer a
          button that fails, the card explains the route that works. */}
      <Card className="flex flex-col gap-3 border-danger/30">
        <CardTitle>Delete this listing</CardTitle>
        <CardDescription>
          {status === "published"
            ? "A published listing can't be deleted — people may already have it in their library. Unpublish it first; that takes it off the marketplace and leaves existing owners alone."
            : "The listing and its uploaded file are removed. Sales records are kept. This cannot be undone."}
        </CardDescription>
        <div>
          <Button
            variant="danger"
            disabled={status === "published"}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete listing
          </Button>
        </div>
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this listing?"
        description={
          <>
            <span className="font-medium text-fg">{listing.title}</span> and its file will be
            permanently deleted. This cannot be undone.
          </>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove}>
              Delete listing
            </Button>
          </>
        }
      />
    </div>
  );
}
