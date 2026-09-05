import type { Metadata } from "next";
import { BackendNotice } from "@/components/dashboard/backend-notice";
import { DangerZone } from "@/components/dashboard/danger-zone";
import { PasswordSection } from "@/components/dashboard/password-section";
import { ProfileSection } from "@/components/dashboard/profile-section";
import { SessionsSection } from "@/components/dashboard/sessions-section";
import { getProfile } from "@/lib/queries";
import { getUnifiedUser } from "@/lib/clerk-supabase";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const [user, profileResult] = await Promise.all([getUnifiedUser(), getProfile()]);
  const profile = profileResult.data;

  const email = user?.email ?? "";
  const name = profile?.full_name ?? user?.name ?? "";
  const avatarUrl = profile?.avatar_url ?? user?.avatarUrl ?? null;
  const authSource = user?.source ?? "supabase";

  return (
    <div className="flex flex-col gap-6">
      {profileResult.backendReady ? null : <BackendNotice />}

      <ProfileSection
        initialName={name}
        initialEmail={email}
        avatarUrl={avatarUrl}
        authSource={authSource}
      />

      <PasswordSection email={email} authSource={authSource} />

      {/* Empty until Track 2 exposes a server route for session listing —
          see the note in SessionsSection. */}
      <SessionsSection sessions={[]} />

      <DangerZone email={email} />
    </div>
  );
}
