"use server";

import * as actions from "@/driplink-web-backend/actions/account";

export type { UpdateProfileResult } from "@/driplink-web-backend/actions/account";

export async function updateUserProfile(data: { fullName: string; avatarUrl?: string | null }) {
  return actions.updateUserProfile(data);
}

export async function deleteUserAccount() {
  return actions.deleteUserAccount();
}
