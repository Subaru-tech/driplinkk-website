import { Box, Truck } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { BackendNotice } from "@/components/dashboard/backend-notice";
import { ModelCard } from "@/components/dashboard/model-card";
import { OrderRowCompact } from "@/components/dashboard/order-row";
import { StartModelCard } from "@/components/dashboard/start-model-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCredits } from "@/lib/format";
import { getActiveOrderCount, getMartOrders, getModelCount, getModels, getProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const [profile, modelCount, activeOrders, recentModels, recentOrders] = await Promise.all([
    getProfile(),
    getModelCount(),
    getActiveOrderCount(),
    getModels(4),
    getMartOrders(3),
  ]);

  const backendReady = profile.backendReady && modelCount.backendReady;

  return (
    <div className="flex flex-col gap-8">
      {backendReady ? null : <BackendNotice />}

      {/* Stat row — spec §6.1 */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Credit Balance"
          value={profile.data ? formatCredits(profile.data.credits_balance) : null}
          action={{ href: "/dashboard/billing", label: "Buy more" }}
        />
        <StatCard
          label="Models Created"
          value={modelCount.backendReady ? formatCredits(modelCount.data) : null}
        />
        <StatCard
          label="Active Mart Orders"
          value={activeOrders.backendReady ? formatCredits(activeOrders.data) : null}
        />
      </div>

      <StartModelCard />

      {/* Recent Models — horizontal scroll row, max 4 (spec §6.1) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-medium text-fg">Recent Models</h2>
          {recentModels.data.length > 0 ? (
            <Link
              href="/dashboard/models"
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              View all →
            </Link>
          ) : null}
        </div>

        {recentModels.data.length === 0 ? (
          <Card>
            <EmptyState
              icon={Box}
              message="No models yet — create your first one"
              action={
                <ButtonLink href="leaffos://new" size="sm" prefetch={false}>
                  Open LeaFF OS
                </ButtonLink>
              }
            />
          </Card>
        ) : (
          /* The one intentional horizontal-scroll row on the site (spec §7). */
          <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {recentModels.data.map((model) => (
              <div key={model.id} className="w-56 shrink-0">
                <ModelCard model={model} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Mart Orders — max 3 (spec §6.1) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-medium text-fg">Recent Mart Orders</h2>
          {recentOrders.data.length > 0 ? (
            <Link
              href="/dashboard/mart-orders"
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              View all →
            </Link>
          ) : null}
        </div>

        <Card className="p-2 md:p-2">
          {recentOrders.data.length === 0 ? (
            <EmptyState icon={Truck} message="No orders yet." size="sm" />
          ) : (
            <ul className="flex flex-col">
              {recentOrders.data.map((order) => (
                <li key={order.id}>
                  <OrderRowCompact order={order} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
