import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { CreditChip } from "@/components/dashboard/credit-chip";
import { DashboardShell, SIDEBAR_COOKIE } from "@/components/dashboard/dashboard-shell";
import { getAccountRole } from "@/lib/account";
import { getProfile } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase-server";

/**
 * Never prerender or cache anything under /dashboard. Without this, the pages
 * that happen not to read cookies (because Supabase isn't configured yet) get
 * statically prerendered at build time — and would keep being served from that
 * static output once it is.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await getCurrentUser();

  /* Spec §2 — authenticated routes redirect to /login without a session.
     While Supabase is unconfigured there is no session to check and no data to
     protect, so the shell renders with a "backend not connected" notice
     instead of bouncing every visitor to a login form that cannot work. Once
     the env vars are set, this is a hard guard. */
  if (isSupabaseConfigured && !user) redirect("/login");

  /* Sellers have their own half of the product. Only a role read straight from
     `profiles` is trusted to bounce someone — see `lib/account.ts`. */
  const account = await getAccountRole();
  if (account?.source === "profile" && account.role === "seller") redirect("/seller");

  const [{ data: profile }, cookieStore] = await Promise.all([getProfile(), cookies()]);

  return (
    <DashboardShell
      defaultCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      creditChip={<CreditChip balance={profile?.credits_balance ?? null} />}
      accountMenu={
        <AccountMenu
          email={user?.email ?? null}
          name={profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
