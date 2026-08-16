import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false },
};

/* Not in the spec's site map, but §4.1 puts a "Forgot password?" link on the
   login card — this is the page it needs to land on. */
export default function ResetPage() {
  return <ResetForm />;
}
