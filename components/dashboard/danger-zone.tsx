"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

/**
 * Spec §6.5 — visually separated, red-bordered, bottom of the page.
 * Deleting requires typing the account email, not just clicking a button.
 */
export function DangerZone({ email }: { email: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);

  const matches = confirmation.trim().toLowerCase() === email.toLowerCase();

  async function deleteAccount() {
    setPending(true);
    try {
      /* Account deletion has to run server-side with the service-role key —
         there is no client-side delete-my-user call. Track 2 owns this route. */
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) throw new Error("unavailable");
      router.push("/");
      router.refresh();
    } catch {
      toast("error", "Account deletion isn't connected yet.");
      setPending(false);
    }
  }

  return (
    <>
      <section className="flex flex-col gap-6 rounded-[var(--radius-card)] border border-danger/40 bg-surface p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-lg font-medium text-danger">Danger zone</h3>
          <p className="text-sm text-muted">
            Deleting your account removes your models, order history and remaining credits. This
            cannot be undone.
          </p>
        </div>

        <Button variant="danger" onClick={() => setOpen(true)} className="self-start">
          Delete account
        </Button>
      </section>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirmation("");
        }}
        title="Delete your account?"
        description="Your models, orders and remaining credits are permanently deleted. There is no undo and no recovery."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setConfirmation("");
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" disabled={!matches} loading={pending} onClick={deleteAccount}>
              Delete account
            </Button>
          </>
        }
      >
        <Field
          label={`Type ${email} to confirm`}
          error={confirmation && !matches ? "That doesn't match your account email." : null}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              placeholder={email}
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>
      </Modal>
    </>
  );
}
