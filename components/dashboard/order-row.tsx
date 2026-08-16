import Link from "next/link";
import { OrderStatusPill } from "@/components/ui/status-pill";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MartOrder } from "@/lib/types";

/** Compact row used in the Overview "Recent Mart Orders" list — spec §6.1. */
export function OrderRowCompact({ order }: { order: MartOrder }) {
  return (
    <Link
      href={`/dashboard/mart-orders/${order.id}`}
      className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] px-3 py-3 transition-colors hover:bg-raised"
    >
      <span className="font-mono text-sm text-fg">{order.reference}</span>
      <span className="flex shrink-0 items-center gap-4">
        <OrderStatusPill status={order.status} />
        <span className="hidden text-xs text-faint sm:inline">{formatDate(order.created_at)}</span>
      </span>
    </Link>
  );
}

/**
 * Full order row — spec §6.3. Renders as a table row on desktop; the mobile
 * stacked-card variant is `OrderCard` below.
 */
export function OrderRow({ order }: { order: MartOrder }) {
  return (
    <tr className="border-t border-line transition-colors hover:bg-raised">
      <td className="px-4 py-4">
        <Link
          href={`/dashboard/mart-orders/${order.id}`}
          className="font-mono text-sm text-fg hover:text-accent"
        >
          {order.reference}
        </Link>
      </td>
      <td className="max-w-0 px-4 py-4">
        <p className="truncate text-sm text-muted" title={order.model_name}>
          {order.model_name}
        </p>
      </td>
      <td className="px-4 py-4">
        <OrderStatusPill status={order.status} />
      </td>
      <td className="px-4 py-4 text-sm whitespace-nowrap text-muted">
        {formatDate(order.created_at)}
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm whitespace-nowrap text-fg">
        {formatCurrency(order.total_inr)}
      </td>
    </tr>
  );
}

export function OrderCard({ order }: { order: MartOrder }) {
  return (
    <Link
      href={`/dashboard/mart-orders/${order.id}`}
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition-colors hover:border-line-strong"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm text-fg">{order.reference}</span>
        <OrderStatusPill status={order.status} />
      </div>
      <p className="truncate text-sm text-muted">{order.model_name}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-faint">{formatDate(order.created_at)}</span>
        <span className="font-mono text-sm text-fg">{formatCurrency(order.total_inr)}</span>
      </div>
    </Link>
  );
}
