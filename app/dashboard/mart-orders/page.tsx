import { Truck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BackendNotice } from "@/components/dashboard/backend-notice";
import { OrderCard, OrderRow } from "@/components/dashboard/order-row";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";
import { getMartOrders } from "@/lib/queries";

export const metadata: Metadata = { title: "Mart Orders" };

/* Spec §6.3 — a list, not a card grid. Orders are read top to bottom.
   Table on desktop, stacked cards on mobile. */

async function OrderList() {
  const { data: orders, backendReady } = await getMartOrders();

  if (orders.length === 0) {
    return (
      <>
        {backendReady ? null : <BackendNotice />}
        <EmptyState
          icon={Truck}
          size="lg"
          message="No orders yet — order a print through Mart"
          action={
            <ButtonLink href="/mart" variant="secondary">
              Go to Mart
            </ButtonLink>
          }
        />
      </>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface md:block">
        <table className="w-full table-fixed">
          <thead>
            <tr className="text-left">
              <th scope="col" className="w-32 px-4 py-3 text-xs font-medium text-faint">
                Order ID
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-faint">
                Model
              </th>
              <th scope="col" className="w-32 px-4 py-3 text-xs font-medium text-faint">
                Status
              </th>
              <th scope="col" className="w-36 px-4 py-3 text-xs font-medium text-faint">
                Ordered
              </th>
              <th scope="col" className="w-28 px-4 py-3 text-right text-xs font-medium text-faint">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </>
  );
}

function OrderListSkeleton() {
  return (
    <SkeletonGroup label="Loading orders" className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </SkeletonGroup>
  );
}

export default function MartOrdersPage() {
  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-display text-xl font-semibold text-fg">Mart Orders</h2>
      <Suspense fallback={<OrderListSkeleton />}>
        <OrderList />
      </Suspense>
    </div>
  );
}
