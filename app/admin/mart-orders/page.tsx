import { Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { OrderFulfillmentControl } from "@/components/admin/order-fulfillment-control";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ORDER_STATUSES, OrderStatusPill } from "@/components/ui/status-pill";
import { getAdminMartOrders } from "@/driplink-web-backend";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — Mart Orders" };
export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["All", ...ORDER_STATUSES] as const;

export default async function AdminMartOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const currentStatus = typeof params.status === "string" ? params.status : "All";

  const { data: orders } = await getAdminMartOrders(currentStatus);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-fg">Mart Orders</h2>
          <p className="text-xs text-muted">
            Track customer print orders, assign 3D printing vendors, and update fulfillment stages.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-control)] border border-line bg-surface p-1.5">
        {STATUS_FILTERS.map((s) => {
          const isActive = currentStatus.toLowerCase() === s.toLowerCase();
          const href = s === "All" ? "/admin/mart-orders" : `/admin/mart-orders?status=${s}`;

          return (
            <Link
              key={s}
              href={href}
              className={cn(
                "rounded-[var(--radius-control)] px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border border-line bg-raised font-semibold text-fg shadow-xs"
                  : "text-muted hover:bg-raised/60 hover:text-fg",
              )}
            >
              {s}
            </Link>
          );
        })}
      </div>

      <Card>
        {orders.length === 0 ? (
          <EmptyState
            icon={Truck}
            size="lg"
            message={`No mart orders found${currentStatus !== "All" ? ` matching status "${currentStatus}"` : ""}.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-xs font-medium text-faint">
                  <th scope="col" className="w-28 px-4 py-3">
                    Reference
                  </th>
                  <th scope="col" className="w-40 px-4 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Model
                  </th>
                  <th scope="col" className="w-28 px-4 py-3">
                    Total
                  </th>
                  <th scope="col" className="w-32 px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="w-32 px-4 py-3">
                    Ordered
                  </th>
                  <th scope="col" className="min-w-[340px] px-4 py-3">
                    Vendor Assignment & Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-sm">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-raised/40">
                    {/* Reference */}
                    <td className="px-4 py-3.5 font-mono text-xs font-medium text-accent">
                      {order.reference}
                    </td>

                    {/* Buyer */}
                    <td className="px-4 py-3.5 text-sm text-fg">
                      <p className="truncate font-medium">{order.buyer?.full_name ?? "Customer"}</p>
                    </td>

                    {/* Model name */}
                    <td className="px-4 py-3.5">
                      <p className="truncate font-medium text-fg">{order.model_name}</p>
                      {order.shipping_address ? (
                        <p className="line-clamp-1 text-xs text-muted" title={order.shipping_address}>
                          {order.shipping_address}
                        </p>
                      ) : null}
                    </td>

                    {/* Total price */}
                    <td className="px-4 py-3.5 font-mono text-fg">
                      {formatCurrency(order.total_inr)}
                    </td>

                    {/* Current Status */}
                    <td className="px-4 py-3.5">
                      <OrderStatusPill status={order.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {formatDate(order.created_at)}
                    </td>

                    {/* Fulfillment Control */}
                    <td className="px-4 py-3.5">
                      <OrderFulfillmentControl
                        orderId={order.id}
                        initialVendor={order.assigned_vendor ?? null}
                        initialNotes={order.vendor_notes ?? null}
                        initialStatus={order.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
