import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { parseRole } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your DripLink account.",
};

/* `?role=creator|seller` is set by the popup, so the choice survives a reload
   and can be linked to directly ("Sell on DripLink" → /login?role=seller). */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { role } = await searchParams;
  return <LoginForm initialRole={parseRole(role)} />;
}
