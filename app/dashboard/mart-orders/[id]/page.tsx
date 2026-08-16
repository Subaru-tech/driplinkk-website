import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OrderTimeline } from "@/components/dashboard/order-timeline";
import { Card, CardTitle } from "@/components/ui/card";
import { OrderStatusPill } from "@/components/ui/status-pill";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getMartOrder } from "@/lib/queries";

export const metadata: Metadata = { title: "Order" };

/* Spec §6.3 — row click navigates here: full timeline, shipping address,
   itemised cost. */

export default async function OrderDetailPage({ params }: PageProps<"/dashboard/mart-orders/[id]">) {
  const { id } = await params;
  const { data: order } = await getMartOrder(id);

  if (!order) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/mart-orders"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All orders
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <h2 className="font-mono text-xl font-medium text-fg">{order.reference}</h2>
          <OrderStatusPill status={order.status} />
        </div>
        <p className="text-sm text-muted">Ordered {formatDateTime(order.created_at)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="flex flex-col gap-6">
          <CardTitle>Progress</CardTitle>
          <OrderTimeline status={order.status} />
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <CardTitle>Shipping address</CardTitle>
            {order.shipping_address ? (
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted">
                {order.shipping_address}
              </p>
            ) : (
              <p className="text-sm text-faint">No address on this order.</p>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <CardTitle>Cost</CardTitle>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">{order.model_name}</dt>
                <dd className="font-mono text-fg">{formatCurrency(order.total_inr)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-line pt-3">
                <dt className="font-medium text-fg">Total</dt>
                <dd className="font-mono font-medium text-fg">
                  {formatCurrency(order.total_inr)}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
