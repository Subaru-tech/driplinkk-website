import Link from "next/link";
import { OrderStatusPill } from "@/components/ui/status-pill";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MartOrder, MartVendorOrder } from "@/lib/types";

type AnyMartOrder = MartOrder | MartVendorOrder;

function getOrderDisplay(order: AnyMartOrder) {
  const legacy = "reference" in order ? order : null;
  const vendorOrder = legacy ? null : (order as MartVendorOrder);
  const ref = legacy?.reference ?? `DL-${order.id.slice(0, 6).toUpperCase()}`;
  const modelName =
    legacy?.model_name ??
    (vendorOrder?.material ? `${vendorOrder.material.toUpperCase()} Custom Print` : "3D Print Model");
  const price = legacy?.total_inr ?? vendorOrder?.price ?? 0;
  return {
    ref,
    modelName,
    price,
    status: order.status,
    createdAt: order.created_at,
    counterparty: vendorOrder?.counterparty_name ?? null,
  };
}

/** Compact row used in the Overview "Recent Mart Orders" list — spec §6.1. */
export function OrderRowCompact({ order }: { order: AnyMartOrder }) {
  const { ref, status, createdAt } = getOrderDisplay(order);

  return (
    <Link
      href={`/dashboard/mart-orders/${order.id}`}
      className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] px-3 py-3 transition-colors hover:bg-raised min-h-[44px]"
    >
      <span className="font-mono text-sm text-fg">{ref}</span>
      <span className="flex shrink-0 items-center gap-4">
        <OrderStatusPill status={status} />
        <span className="hidden text-xs text-faint sm:inline">{formatDate(createdAt)}</span>
      </span>
    </Link>
  );
}

/**
 * Full order row — spec §6.3. Renders as a table row on desktop; the mobile
 * stacked-card variant is `OrderCard` below.
 */
export function OrderRow({ order }: { order: AnyMartOrder }) {
  const { ref, modelName, price, status, createdAt, counterparty } = getOrderDisplay(order);

  return (
    <tr className="border-t border-line transition-colors hover:bg-raised">
      <td className="px-4 py-4">
        <Link
          href={`/dashboard/mart-orders/${order.id}`}
          className="font-mono text-sm text-fg hover:text-accent inline-block min-h-[44px] leading-[44px]"
        >
          {ref}
        </Link>
      </td>
      <td className="max-w-0 px-4 py-4">
        <p className="truncate text-sm text-muted" title={modelName}>
          {modelName}
        </p>
        {counterparty && (
          <p className="text-xs text-faint truncate">{counterparty}</p>
        )}
      </td>
      <td className="px-4 py-4">
        <OrderStatusPill status={status} />
      </td>
      <td className="px-4 py-4 text-sm whitespace-nowrap text-muted">
        {formatDate(createdAt)}
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm whitespace-nowrap text-fg">
        {formatCurrency(price)}
      </td>
    </tr>
  );
}

export function OrderCard({ order }: { order: AnyMartOrder }) {
  const { ref, modelName, price, status, createdAt, counterparty } = getOrderDisplay(order);

  return (
    <Link
      href={`/dashboard/mart-orders/${order.id}`}
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors hover:border-line-hover min-h-[44px]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-medium text-fg">{ref}</span>
        <OrderStatusPill status={status} />
      </div>
      <p className="truncate text-sm text-muted">{modelName}</p>
      {counterparty && (
        <p className="text-xs text-accent-muted-fg">{counterparty}</p>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-line/40 pt-2">
        <span className="text-xs text-faint">{formatDate(createdAt)}</span>
        <span className="font-mono text-sm font-semibold text-fg">{formatCurrency(price)}</span>
      </div>
    </Link>
  );
}
