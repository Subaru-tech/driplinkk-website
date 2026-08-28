import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { DashboardShell, SIDEBAR_COOKIE } from "@/components/dashboard/dashboard-shell";
import { getAccountRole } from "@/lib/account";
import { getProfile, getSellerProfile } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase-server";
import { StatusPill } from "@/components/ui/status-pill";

/** Same reasoning as the creator dashboard: never prerender, never cache. */
export const dynamic = "force-dynamic";

/**
 * The seller half of the product. Same shell as /dashboard, different doors.
 *
 * Two guards: a session, and the right kind of account. A creator who lands
 * here is sent to their own dashboard rather than shown an empty seller view —
 * but only when the role came from `profiles`. Bouncing someone between two
 * dashboards on the strength of a stale JWT claim would be worse than letting
 * them through to a page whose queries return nothing anyway.
 */
export default async function SellerLayout({ children }: LayoutProps<"/seller">) {
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) redirect("/login?role=seller");

  const account = await getAccountRole();
  if (account?.source === "profile" && account.role !== "seller") redirect("/dashboard");

  const [{ data: profile }, { data: seller }, cookieStore] = await Promise.all([
    getProfile(),
    getSellerProfile(),
    cookies(),
  ]);

  return (
    <DashboardShell
      defaultCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      area="seller"
      creditChip={
        seller ? (
          <StatusPill tone={seller.payout_status === "verified" ? "accent" : "warning"}>
            {seller.studio_name}
          </StatusPill>
        ) : null
      }
      accountMenu={
        <AccountMenu
          email={user?.email ?? null}
          name={
            seller?.studio_name ??
            profile?.full_name ??
            (user?.user_metadata?.full_name as string | undefined) ??
            null
          }
          avatarUrl={profile?.avatar_url ?? null}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
