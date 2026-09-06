"use server";

import * as actions from "@/driplink-web-backend/actions/library";

export type { ClaimResult } from "@/driplink-web-backend/actions/library";

export async function claimFreeListing(listingId: string) {
  return actions.claimFreeListing(listingId);
}
