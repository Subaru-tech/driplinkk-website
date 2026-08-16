"use client";

import { useState } from "react";
import { CreditBuyModal } from "@/components/dashboard/credit-buy-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCredits } from "@/lib/format";

/** Spec §6.4 — balance card with the Buy Credits button that opens the modal. */
export function BalanceCard({ balance }: { balance: number | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Credit Balance</p>
          <p className="font-mono text-2xl leading-none font-medium text-fg">
            {balance === null ? "—" : formatCredits(balance)}
          </p>
        </div>
        <Button size="lg" onClick={() => setOpen(true)} className="shrink-0">
          Buy Credits
        </Button>
      </Card>

      <CreditBuyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
