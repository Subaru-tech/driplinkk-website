import type { Metadata } from "next";
import { BackendNotice } from "@/components/dashboard/backend-notice";
import { DangerZone } from "@/components/dashboard/danger-zone";
import { PasswordSection } from "@/components/dashboard/password-section";
import { ProfileSection } from "@/components/dashboard/profile-section";
import { SessionsSection } from "@/components/dashboard/sessions-section";
import { getProfile } from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getProfile()]);

  const email = user?.email ?? "";
  const name =
    profile.data?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="flex flex-col gap-6">
      {profile.backendReady ? null : <BackendNotice />}

      <ProfileSection
        initialName={name}
        initialEmail={email}
        avatarUrl={profile.data?.avatar_url ?? null}
      />

      <PasswordSection email={email} />

      {/* Empty until Track 2 exposes a server route for session listing —
          see the note in SessionsSection. */}
      <SessionsSection sessions={[]} />

      <DangerZone email={email} />
    </div>
  );
}
